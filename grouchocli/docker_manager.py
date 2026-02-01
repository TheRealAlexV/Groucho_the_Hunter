"""Docker management for Groucho CLI.

This module provides comprehensive Docker operations including container
management, log streaming, command execution, and resource cleanup.
"""

import logging
import subprocess
import time
from pathlib import Path
from typing import Iterator, Optional

import docker
from docker.errors import APIError, ContainerError, DockerException, ImageNotFound
from docker.models.containers import Container
from rich.progress import Progress, SpinnerColumn, TextColumn

from grouchocli.config import Config, get_config
from grouchocli.utils import console, error_console, print_error, print_success, spinner

logger = logging.getLogger("groucho")


class DockerManagerError(Exception):
    """Base exception for Docker manager errors."""
    pass


class ContainerNotFoundError(DockerManagerError):
    """Raised when a container is not found."""
    pass


class ComposeFileError(DockerManagerError):
    """Raised when docker-compose file is invalid or missing."""
    pass


class DockerManager:
    """Manager for Docker operations.
    
    This class handles all Docker-related operations including starting,
    stopping, and monitoring containers, as well as building images and
    cleaning up resources.
    
    Attributes:
        config: Configuration instance.
        client: Docker client instance.
    """
    
    def __init__(self, config: Optional[Config] = None) -> None:
        """Initialize Docker manager.
        
        Args:
            config: Optional configuration instance. Uses global config if None.
        
        Raises:
            DockerManagerError: If Docker is not available.
        """
        self.config = config or get_config()
        self.client: Optional[docker.DockerClient] = None
        
        try:
            self.client = docker.from_env()
            # Test connection
            self.client.ping()
            logger.debug("Docker client initialized successfully")
        except DockerException as e:
            raise DockerManagerError(
                f"Failed to connect to Docker: {e}\n"
                "Make sure Docker is installed and running."
            )
    
    def _get_container(self, dev: bool = True) -> Optional[Container]:
        """Get container by name.
        
        Args:
            dev: If True, get development container; else production.
        
        Returns:
            Container instance or None if not found.
        """
        if not self.client:
            return None
        
        container_name = self.config.get_container_name(dev)
        try:
            return self.client.containers.get(container_name)
        except docker.errors.NotFound:
            return None
    
    def _run_compose(
        self,
        command: str,
        dev: bool = True,
        additional_args: Optional[list[str]] = None,
    ) -> subprocess.CompletedProcess:
        """Run docker-compose command.
        
        Args:
            command: The compose command (up, down, logs, etc.).
            dev: If True, use development compose file; else production.
            additional_args: Additional arguments for the command.
        
        Returns:
            CompletedProcess instance.
        
        Raises:
            ComposeFileError: If compose file doesn't exist.
        """
        compose_file = self.config.get_compose_file(dev)
        
        if not compose_file.exists():
            raise ComposeFileError(f"Docker compose file not found: {compose_file}")
        
        # Use 'docker compose' (newer) instead of 'docker-compose' (older)
        cmd = [
            "docker", "compose",
            "-f", str(compose_file),
            command,
        ]
        
        if additional_args:
            cmd.extend(additional_args)
        
        logger.debug(f"Running command: {' '.join(cmd)}")
        
        return subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=self.config.project_root,
        )
    
    def start(self, dev: bool = True, build: bool = False) -> bool:
        """Start containers.
        
        Args:
            dev: If True, start development container; else production.
            build: If True, build images before starting.
        
        Returns:
            True if successful, False otherwise.
        
        Raises:
            DockerManagerError: If start operation fails.
        """
        environment = "development" if dev else "production"
        container_name = self.config.get_container_name(dev)
        
        with spinner(f"Starting {environment} environment..."):
            # Check if already running
            container = self._get_container(dev)
            if container and container.status == "running":
                console.print(f"[yellow]Container '{container_name}' is already running[/yellow]")
                return True
            
            # Prepare arguments
            args = ["-d"]  # Detached mode
            if build:
                args.append("--build")
            
            result = self._run_compose("up", dev, args)
            
            if result.returncode != 0:
                raise DockerManagerError(f"Failed to start containers: {result.stderr}")
            
            # Wait for container to be healthy
            if not self._wait_for_container(dev, timeout=60):
                raise DockerManagerError("Container failed to become healthy within timeout")
        
        port = self.config.dev_port if dev else self.config.prod_port
        url = self.config.get_url(dev)
        print_success(
            f"{environment.title()} environment started successfully!\n"
            f"Container: {container_name}\n"
            f"Port: {port}\n"
            f"URL: {url}",
            title=f"{environment.title()} Started"
        )
        return True
    
    def stop(self, dev: bool = True, remove: bool = False) -> bool:
        """Stop containers.
        
        Args:
            dev: If True, stop development container; else production.
            remove: If True, remove containers after stopping.
        
        Returns:
            True if successful, False otherwise.
        """
        environment = "development" if dev else "production"
        container_name = self.config.get_container_name(dev)
        
        with spinner(f"Stopping {environment} environment..."):
            # Check if running
            container = self._get_container(dev)
            if not container:
                console.print(f"[yellow]Container '{container_name}' does not exist[/yellow]")
                return True
            
            if container.status != "running":
                console.print(f"[yellow]Container '{container_name}' is not running[/yellow]")
                if remove:
                    return self._remove_container(dev)
                return True
            
            args = ["-v"] if remove else []  # Remove volumes if specified
            result = self._run_compose("down", dev, args)
            
            if result.returncode != 0:
                raise DockerManagerError(f"Failed to stop containers: {result.stderr}")
        
        print_success(
            f"{environment.title()} environment stopped successfully!",
            title=f"{environment.title()} Stopped"
        )
        return True
    
    def restart(self, dev: bool = True) -> bool:
        """Restart containers.
        
        Args:
            dev: If True, restart development container; else production.
        
        Returns:
            True if successful, False otherwise.
        """
        environment = "development" if dev else "production"
        
        with spinner(f"Restarting {environment} environment..."):
            result = self._run_compose("restart", dev)
            
            if result.returncode != 0:
                raise DockerManagerError(f"Failed to restart containers: {result.stderr}")
            
            # Wait for container to be healthy
            if not self._wait_for_container(dev, timeout=60):
                raise DockerManagerError("Container failed to become healthy after restart")
        
        print_success(
            f"{environment.title()} environment restarted successfully!",
            title=f"{environment.title()} Restarted"
        )
        return True
    
    def get_status(self, dev: bool = True) -> dict:
        """Get container status.
        
        Args:
            dev: If True, check development container; else production.
        
        Returns:
            Dictionary with status information.
        """
        container_name = self.config.get_container_name(dev)
        container = self._get_container(dev)
        
        if not container:
            return {
                "exists": False,
                "running": False,
                "name": container_name,
                "status": "not_created",
                "health": "unknown",
                "ports": {},
                "uptime": None,
            }
        
        # Get health status
        health = "unknown"
        if container.attrs.get("State", {}).get("Health"):
            health = container.attrs["State"]["Health"]["Status"]
        elif container.status == "running":
            health = "healthy"
        
        # Calculate uptime
        uptime = None
        if container.status == "running" and container.attrs.get("State", {}).get("StartedAt"):
            started_at = container.attrs["State"]["StartedAt"]
            try:
                # Parse timestamp
                start_time = time.mktime(time.strptime(started_at[:19], "%Y-%m-%dT%H:%M:%S"))
                uptime = time.time() - start_time
            except (ValueError, OSError):
                pass
        
        return {
            "exists": True,
            "running": container.status == "running",
            "name": container_name,
            "status": container.status,
            "health": health,
            "ports": container.ports,
            "uptime": uptime,
            "image": container.image.tags[0] if container.image.tags else "unknown",
        }
    
    def stream_logs(
        self,
        dev: bool = True,
        follow: bool = False,
        tail: int = 100,
    ) -> Iterator[str]:
        """Stream container logs.
        
        Args:
            dev: If True, get development container logs; else production.
            follow: If True, follow logs in real-time.
            tail: Number of lines to show from the end.
        
        Yields:
            Log lines as strings.
        """
        container = self._get_container(dev)
        
        if not container:
            container_name = self.config.get_container_name(dev)
            raise ContainerNotFoundError(f"Container '{container_name}' not found")
        
        if follow:
            # Use docker-compose logs for following
            compose_file = self.config.get_compose_file(dev)
            cmd = [
                "docker", "compose",
                "-f", str(compose_file),
                "logs", "-f", "--tail", str(tail),
            ]
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                cwd=self.config.project_root,
            )
            
            try:
                if process.stdout:
                    for line in process.stdout:
                        yield line.rstrip()
            except KeyboardInterrupt:
                process.terminate()
                raise
            finally:
                process.wait()
        else:
            # Get logs from container object
            logs = container.logs(tail=tail, timestamps=True).decode("utf-8")
            for line in logs.splitlines():
                yield line
    
    def execute(self, dev: bool, command: str) -> tuple[int, str, str]:
        """Execute a command inside the container.
        
        Args:
            dev: If True, use development container; else production.
            command: Command to execute.
        
        Returns:
            Tuple of (exit_code, stdout, stderr).
        """
        container = self._get_container(dev)
        
        if not container:
            container_name = self.config.get_container_name(dev)
            raise ContainerNotFoundError(f"Container '{container_name}' not found")
        
        if container.status != "running":
            raise DockerManagerError(f"Container is not running (status: {container.status})")
        
        logger.debug(f"Executing command in container: {command}")
        
        result = container.exec_run(
            command,
            stdout=True,
            stderr=True,
            tty=False,
        )
        
        stdout = result.output.decode("utf-8") if result.output else ""
        return (result.exit_code, stdout, "")
    
    def shell(self, dev: bool = True) -> None:
        """Open an interactive shell in the container.
        
        Args:
            dev: If True, use development container; else production.
        """
        container_name = self.config.get_container_name(dev)
        container = self._get_container(dev)
        
        if not container:
            raise ContainerNotFoundError(f"Container '{container_name}' not found")
        
        if container.status != "running":
            raise DockerManagerError(f"Container is not running (status: {container.status})")
        
        # Determine shell to use
        shell = "/bin/sh"
        test_result = self.execute(dev, "test -x /bin/bash")
        if test_result[0] == 0:
            shell = "/bin/bash"
        
        console.print(f"[cyan]Opening shell in {container_name} ({shell})...[/cyan]")
        console.print("[dim]Type 'exit' to leave the shell[/dim]\n")
        
        # Use docker compose exec for interactive shell
        compose_file = self.config.get_compose_file(dev)
        service_name = self.config.get_service_name(dev)
        
        cmd = [
            "docker", "compose",
            "-f", str(compose_file),
            "exec", service_name,
            shell,
        ]
        
        subprocess.run(cmd, cwd=self.config.project_root)
    
    def build(self, dev: bool = True, no_cache: bool = False) -> bool:
        """Build Docker images.
        
        Args:
            dev: If True, build development image; else production.
            no_cache: If True, build without cache.
        
        Returns:
            True if successful, False otherwise.
        """
        environment = "development" if dev else "production"
        
        args = ["--pull"]  # Always pull latest base images
        if no_cache:
            args.append("--no-cache")
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task(
                description=f"Building {environment} image...",
                total=None,
            )
            
            result = self._run_compose("build", dev, args)
            
            progress.update(task, completed=True)
        
        if result.returncode != 0:
            raise DockerManagerError(f"Build failed: {result.stderr}")
        
        print_success(
            f"{environment.title()} image built successfully!",
            title="Build Complete"
        )
        return True
    
    def clean(self, force: bool = False) -> bool:
        """Clean up Docker resources.
        
        Args:
            force: If True, don't ask for confirmation.
        
        Returns:
            True if successful, False otherwise.
        """
        from grouchocli.utils import confirm_action
        
        if not force:
            if not confirm_action(
                "This will stop and remove all Groucho containers, images, and volumes. Continue?",
                default=False,
            ):
                console.print("[yellow]Clean operation cancelled[/yellow]")
                return False
        
        with spinner("Cleaning up Docker resources..."):
            # Stop and remove containers for both environments
            for dev in [True, False]:
                try:
                    self._run_compose("down", dev, ["-v", "--remove-orphans"])
                except ComposeFileError:
                    pass  # File might not exist
            
            # Remove images
            if self.client:
                for image_tag in ["groucho-the-hunter:latest", "groucho-the-hunter-dev:latest"]:
                    try:
                        self.client.images.remove(image_tag, force=True)
                        logger.debug(f"Removed image: {image_tag}")
                    except (ImageNotFound, APIError):
                        pass  # Image doesn't exist
        
        print_success(
            "All Groucho Docker resources cleaned up successfully!",
            title="Clean Complete"
        )
        return True
    
    def _remove_container(self, dev: bool) -> bool:
        """Remove a container.
        
        Args:
            dev: If True, remove development container; else production.
        
        Returns:
            True if successful, False otherwise.
        """
        container_name = self.config.get_container_name(dev)
        container = self._get_container(dev)
        
        if container:
            try:
                container.remove(force=True)
                logger.debug(f"Removed container: {container_name}")
                return True
            except APIError as e:
                logger.error(f"Failed to remove container: {e}")
                return False
        
        return True
    
    def _wait_for_container(self, dev: bool, timeout: int = 60) -> bool:
        """Wait for container to be running and healthy.
        
        Args:
            dev: If True, check development container; else production.
            timeout: Maximum time to wait in seconds.
        
        Returns:
            True if container is healthy, False if timeout reached.
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            container = self._get_container(dev)
            
            if not container:
                time.sleep(1)
                continue
            
            if container.status == "running":
                # Check if container has health check
                health = container.attrs.get("State", {}).get("Health", {})
                
                if not health or health.get("Status") == "healthy":
                    # Wait a moment to ensure service is actually ready
                    time.sleep(2)
                    return True
                elif health.get("Status") == "unhealthy":
                    return False
            
            time.sleep(1)
        
        return False
    
    def get_all_status(self) -> dict:
        """Get status of both development and production containers.
        
        Returns:
            Dictionary with status of both environments.
        """
        return {
            "development": self.get_status(dev=True),
            "production": self.get_status(dev=False),
        }
