"""Configuration management for Groucho CLI.

This module defines all configuration settings, paths, and environment
variables used by the CLI application.
"""

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass(frozen=True)
class Config:
    """Configuration settings for Groucho CLI.
    
    This class uses frozen dataclass to ensure immutability after creation.
    All paths are resolved relative to the project root.
    
    Attributes:
        project_root: Absolute path to the project root directory.
        docker_compose_dev: Path to development docker-compose file.
        docker_compose_prod: Path to production docker-compose file.
        dev_port: Port for development environment.
        prod_port: Port for production environment.
        dev_container_name: Name of the development container.
        prod_container_name: Name of the production container.
        log_level: Default logging level.
        chrome_profiles_path: Path to Chrome profiles directory.
        chrome_executable_path: Path to Chrome executable (auto-detected if None).
        chrome_remote_debugging_port: Port for Chrome remote debugging.
    """
    
    # Project paths
    project_root: Path = Path(__file__).parent.parent.resolve()
    
    # Docker Compose files
    docker_compose_dev: Path = Path(__file__).parent.parent / "docker-compose.yml"
    docker_compose_prod: Path = Path(__file__).parent.parent / "docker-compose.prod.yml"
    
    # Port configurations
    dev_port: int = 3000
    prod_port: int = 8080
    hmr_port: int = 24678  # Hot Module Replacement port
    
    # Container names (must match docker-compose files)
    dev_container_name: str = "groucho-the-hunter-dev"
    prod_container_name: str = "groucho-the-hunter"
    
    # Service names in docker-compose
    dev_service_name: str = "groucho-dev"
    prod_service_name: str = "groucho"
    
    # Default settings
    log_level: str = "INFO"
    
    # Game URLs
    dev_url: str = "http://localhost:3000"
    prod_url: str = "http://localhost:8080"
    
    # Chrome configuration
    chrome_profiles_path: Path = Path(__file__).parent.parent / ".chrome-profiles"
    chrome_executable_path: Optional[str] = None
    chrome_remote_debugging_port: int = 9222
    
    @classmethod
    def from_env(cls) -> "Config":
        """Create configuration from environment variables.
        
        Environment variables override default values:
        - GROUPCHO_PROJECT_ROOT
        - GROUPCHO_DEV_PORT
        - GROUPCHO_PROD_PORT
        - GROUPCHO_LOG_LEVEL
        - GROUPCHO_CHROME_PROFILES_PATH
        - CHROME_PATH
        - GROUPCHO_CHROME_DEBUG_PORT
        
        Returns:
            Config instance with values from environment or defaults.
        """
        project_root = Path(
            os.getenv("GROUPCHO_PROJECT_ROOT", cls.project_root)
        ).resolve()
        
        return cls(
            project_root=project_root,
            docker_compose_dev=Path(
                os.getenv("GROUPCHO_COMPOSE_DEV", project_root / "docker-compose.yml")
            ),
            docker_compose_prod=Path(
                os.getenv("GROUPCHO_COMPOSE_PROD", project_root / "docker-compose.prod.yml")
            ),
            dev_port=int(os.getenv("GROUPCHO_DEV_PORT", cls.dev_port)),
            prod_port=int(os.getenv("GROUPCHO_PROD_PORT", cls.prod_port)),
            hmr_port=int(os.getenv("GROUPCHO_HMR_PORT", cls.hmr_port)),
            dev_container_name=os.getenv(
                "GROUPCHO_DEV_CONTAINER", cls.dev_container_name
            ),
            prod_container_name=os.getenv(
                "GROUPCHO_PROD_CONTAINER", cls.prod_container_name
            ),
            dev_service_name=os.getenv(
                "GROUPCHO_DEV_SERVICE", cls.dev_service_name
            ),
            prod_service_name=os.getenv(
                "GROUPCHO_PROD_SERVICE", cls.prod_service_name
            ),
            log_level=os.getenv("GROUPCHO_LOG_LEVEL", cls.log_level),
            dev_url=os.getenv("GROUPCHO_DEV_URL", f"http://localhost:{cls.dev_port}"),
            prod_url=os.getenv("GROUPCHO_PROD_URL", f"http://localhost:{cls.prod_port}"),
            chrome_profiles_path=Path(
                os.getenv("GROUPCHO_CHROME_PROFILES_PATH", project_root / ".chrome-profiles")
            ),
            chrome_executable_path=os.getenv("CHROME_PATH", cls.chrome_executable_path),
            chrome_remote_debugging_port=int(
                os.getenv("GROUPCHO_CHROME_DEBUG_PORT", cls.chrome_remote_debugging_port)
            ),
        )
    
    def validate(self) -> tuple[bool, list[str]]:
        """Validate configuration and return status with errors.
        
        Returns:
            Tuple of (is_valid, list_of_error_messages).
        """
        errors = []
        
        # Check if docker-compose files exist
        if not self.docker_compose_dev.exists():
            errors.append(f"Development docker-compose not found: {self.docker_compose_dev}")
        
        if not self.docker_compose_prod.exists():
            errors.append(f"Production docker-compose not found: {self.docker_compose_prod}")
        
        # Check if project root exists
        if not self.project_root.exists():
            errors.append(f"Project root does not exist: {self.project_root}")
        
        # Validate ports
        for port_name, port in [
            ("dev_port", self.dev_port),
            ("prod_port", self.prod_port),
            ("hmr_port", self.hmr_port),
        ]:
            if not (1 <= port <= 65535):
                errors.append(f"Invalid {port_name}: {port} (must be 1-65535)")
        
        # Validate log level
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if self.log_level.upper() not in valid_levels:
            errors.append(f"Invalid log level: {self.log_level} (must be one of {valid_levels})")
        
        return (len(errors) == 0, errors)
    
    def get_compose_file(self, dev: bool = True) -> Path:
        """Get the appropriate docker-compose file path.
        
        Args:
            dev: If True, return development compose file; else production.
        
        Returns:
            Path to the docker-compose file.
        """
        return self.docker_compose_dev if dev else self.docker_compose_prod
    
    def get_container_name(self, dev: bool = True) -> str:
        """Get the appropriate container name.
        
        Args:
            dev: If True, return development container name; else production.
        
        Returns:
            Container name string.
        """
        return self.dev_container_name if dev else self.prod_container_name
    
    def get_service_name(self, dev: bool = True) -> str:
        """Get the appropriate service name.
        
        Args:
            dev: If True, return development service name; else production.
        
        Returns:
            Service name string.
        """
        return self.dev_service_name if dev else self.prod_service_name
    
    def get_url(self, dev: bool = True) -> str:
        """Get the appropriate game URL.
        
        Args:
            dev: If True, return development URL; else production.
        
        Returns:
            URL string.
        """
        return self.dev_url if dev else self.prod_url


# Global config instance (lazy-loaded)
_config_instance: Optional[Config] = None


def get_config() -> Config:
    """Get the global configuration instance.
    
    Returns:
        Config instance (creates from environment if not exists).
    """
    global _config_instance
    if _config_instance is None:
        _config_instance = Config.from_env()
    return _config_instance


def reload_config() -> Config:
    """Reload configuration from environment.
    
    Returns:
        Fresh Config instance from environment variables.
    """
    global _config_instance
    _config_instance = Config.from_env()
    return _config_instance
