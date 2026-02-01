"""Game state management for Groucho CLI.

This module provides functionality for monitoring and managing the game
state, including checking if the game is running, getting process info,
and managing local (non-Docker) game instances.
"""

import logging
import socket
import subprocess
import time
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

import psutil
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table

from grouchocli.config import Config, get_config
from grouchocli.docker_manager import DockerManager
from grouchocli.utils import console, format_duration, print_error, spinner

logger = logging.getLogger("groucho")


class GameManagerError(Exception):
    """Base exception for game manager errors."""
    pass


class GameProcessError(GameManagerError):
    """Raised when there's an error with the game process."""
    pass


class GameManager:
    """Manager for game state and processes.
    
    This class handles monitoring the game status, managing local game
    processes, and checking game health via HTTP endpoints.
    
    Attributes:
        config: Configuration instance.
        docker_manager: DockerManager instance for container status.
    """
    
    def __init__(
        self,
        config: Optional[Config] = None,
        docker_manager: Optional[DockerManager] = None,
    ) -> None:
        """Initialize game manager.
        
        Args:
            config: Optional configuration instance.
            docker_manager: Optional DockerManager instance.
        """
        self.config = config or get_config()
        self.docker_manager = docker_manager or DockerManager(self.config)
    
    def is_running(self, dev: bool = True) -> bool:
        """Check if the game is running.
        
        Checks both Docker container status and port availability.
        
        Args:
            dev: If True, check development environment; else production.
        
        Returns:
            True if game is running and accessible.
        """
        # First check Docker container status
        try:
            status = self.docker_manager.get_status(dev)
            if not status.get("running", False):
                return False
        except Exception:
            return False
        
        # Then check if port is accessible
        port = self.config.dev_port if dev else self.config.prod_port
        return self._is_port_open("localhost", port)
    
    def is_healthy(self, dev: bool = True, timeout: int = 5) -> bool:
        """Check if the game is healthy and responding.
        
        Args:
            dev: If True, check development environment; else production.
            timeout: Connection timeout in seconds.
        
        Returns:
            True if game responds to HTTP requests.
        """
        url = self.config.get_url(dev)
        parsed = urlparse(url)
        host = parsed.hostname or "localhost"
        port = parsed.port or (self.config.dev_port if dev else self.config.prod_port)
        
        try:
            with socket.create_connection((host, port), timeout=timeout):
                return True
        except (socket.timeout, ConnectionRefusedError, OSError):
            return False
    
    def get_game_info(self, dev: bool = True) -> dict:
        """Get comprehensive game information.
        
        Args:
            dev: If True, get development environment info; else production.
        
        Returns:
            Dictionary with game status information.
        """
        # Get Docker container status
        docker_status = self.docker_manager.get_status(dev)
        
        # Check HTTP health
        is_healthy = self.is_healthy(dev)
        
        # Get system info
        system_info = self._get_system_info()
        
        return {
            "environment": "development" if dev else "production",
            "url": self.config.get_url(dev),
            "container": docker_status,
            "is_running": docker_status.get("running", False),
            "is_healthy": is_healthy,
            "system": system_info,
        }
    
    def get_all_game_info(self) -> dict:
        """Get information about both development and production environments.
        
        Returns:
            Dictionary with info for both environments.
        """
        return {
            "development": self.get_game_info(dev=True),
            "production": self.get_game_info(dev=False),
        }
    
    def wait_for_game(self, dev: bool = True, timeout: int = 60) -> bool:
        """Wait for the game to become healthy.
        
        Args:
            dev: If True, wait for development environment; else production.
            timeout: Maximum time to wait in seconds.
        
        Returns:
            True if game became healthy within timeout.
        """
        environment = "development" if dev else "production"
        url = self.config.get_url(dev)
        
        with spinner(f"Waiting for {environment} game at {url}..."):
            start_time = time.time()
            
            while time.time() - start_time < timeout:
                if self.is_healthy(dev):
                    console.print(f"[green]Game is healthy at {url}[/green]")
                    return True
                time.sleep(1)
        
        console.print(f"[red]Timeout waiting for game at {url}[/red]")
        return False
    
    def display_status(self, dev: Optional[bool] = None) -> None:
        """Display game status in a formatted table.
        
        Args:
            dev: If True, show only development; if False, only production;
                 if None, show both.
        """
        environments = []
        if dev is None or dev is True:
            environments.append(("Development", True))
        if dev is None or dev is False:
            environments.append(("Production", False))
        
        for env_name, is_dev in environments:
            info = self.get_game_info(is_dev)
            container = info.get("container", {})
            system = info.get("system", {})
            
            table = Table(
                title=f"[bold]{env_name} Environment[/bold]",
                title_style="cyan",
                border_style="blue",
            )
            table.add_column("Property", style="yellow", no_wrap=True)
            table.add_column("Value", style="white")
            
            # Basic info
            table.add_row("URL", info.get("url", "N/A"))
            
            # Container status
            if container.get("exists"):
                status_color = "green" if container.get("running") else "red"
                table.add_row(
                    "Container Status",
                    f"[{status_color}]{container.get('status', 'unknown').title()}[/{status_color}]"
                )
                table.add_row("Container Name", container.get("name", "N/A"))
                table.add_row("Health", container.get("health", "unknown"))
                
                if container.get("uptime"):
                    uptime_str = format_duration(container.get("uptime"))
                    table.add_row("Uptime", uptime_str)
                
                if container.get("image"):
                    table.add_row("Image", container.get("image"))
                
                # Port mappings
                ports = container.get("ports", {})
                if ports:
                    port_strs = []
                    for container_port, host_bindings in ports.items():
                        if host_bindings:
                            for binding in host_bindings:
                                host_port = binding.get("HostPort", "?")
                                port_strs.append(f"{host_port}:{container_port}")
                        else:
                            port_strs.append(container_port)
                    table.add_row("Port Mappings", ", ".join(port_strs))
            else:
                table.add_row("Container Status", "[red]Not Created[/red]")
            
            # Health check
            health_status = "[green]✓ Healthy[/green]" if info.get("is_healthy") else "[red]✗ Unhealthy[/red]"
            table.add_row("Health Check", health_status)
            
            # System resources
            if container.get("running"):
                cpu_percent = system.get("cpu_percent")
                memory_percent = system.get("memory_percent")
                
                if cpu_percent is not None:
                    table.add_row("Host CPU Usage", f"{cpu_percent:.1f}%")
                if memory_percent is not None:
                    table.add_row("Host Memory Usage", f"{memory_percent:.1f}%")
            
            console.print()
            console.print(table)
    
    def start_local(
        self,
        dev: bool = True,
        command: Optional[str] = None,
    ) -> subprocess.Popen:
        """Start the game locally without Docker.
        
        This is useful for development when you want to run the game
        directly on the host machine.
        
        Args:
            dev: If True, start in development mode; else production.
            command: Optional custom command to run.
        
        Returns:
            Popen process instance.
        
        Raises:
            GameProcessError: If the game fails to start.
        """
        if command is None:
            if dev:
                command = "npm run dev"
            else:
                command = "npm run build && npm run preview"
        
        logger.info(f"Starting local game with command: {command}")
        
        try:
            process = subprocess.Popen(
                command,
                shell=True,
                cwd=self.config.project_root,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
            )
            
            # Wait a moment to check if process started successfully
            time.sleep(2)
            
            if process.poll() is not None:
                # Process already exited
                stdout, _ = process.communicate()
                raise GameProcessError(
                    f"Game process exited immediately:\n{stdout}"
                )
            
            return process
            
        except Exception as e:
            raise GameProcessError(f"Failed to start game: {e}")
    
    def stop_local(self, dev: bool = True) -> bool:
        """Stop a locally running game process.
        
        Args:
            dev: If True, stop development process; else production.
        
        Returns:
            True if stopped successfully.
        """
        port = self.config.dev_port if dev else self.config.prod_port
        
        # Find process using the port
        for proc in psutil.process_iter(["pid", "name", "cmdline"]):
            try:
                for conn in proc.connections():
                    if conn.laddr.port == port:
                        logger.info(f"Killing process {proc.pid} using port {port}")
                        proc.terminate()
                        proc.wait(timeout=5)
                        return True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        return False
    
    def _is_port_open(self, host: str, port: int, timeout: int = 2) -> bool:
        """Check if a port is open and accepting connections.
        
        Args:
            host: Hostname or IP address.
            port: Port number to check.
            timeout: Connection timeout in seconds.
        
        Returns:
            True if port is open.
        """
        try:
            with socket.create_connection((host, port), timeout=timeout):
                return True
        except (socket.timeout, ConnectionRefusedError, OSError):
            return False
    
    def _get_system_info(self) -> dict:
        """Get system resource information.
        
        Returns:
            Dictionary with CPU and memory usage.
        """
        try:
            return {
                "cpu_percent": psutil.cpu_percent(interval=0.1),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_percent": psutil.disk_usage("/").percent,
            }
        except Exception as e:
            logger.warning(f"Failed to get system info: {e}")
            return {}


def check_port_available(port: int, host: str = "localhost") -> bool:
    """Check if a port is available (not in use).
    
    Args:
        port: Port number to check.
        host: Host to check on.
    
    Returns:
        True if port is available.
    """
    try:
        with socket.create_connection((host, port), timeout=1):
            return False  # Connection succeeded, port is in use
    except (socket.timeout, ConnectionRefusedError, OSError):
        return True  # Connection failed, port is available
