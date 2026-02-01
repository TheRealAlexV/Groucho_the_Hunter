"""Groucho CLI - Management tool for Groucho the Hunter game.

A comprehensive CLI application for managing the Groucho the Hunter game
Docker environments, with support for development and production deployments.
"""

__version__ = "1.0.0"
__author__ = "Groucho Dev Team"
__email__ = "dev@groucho.game"

from grouchocli.config import Config
from grouchocli.docker_manager import DockerManager
from grouchocli.game_manager import GameManager
from grouchocli.chrome_manager import ChromeManager
from grouchocli.utils import setup_logging, console

__all__ = [
    "Config",
    "DockerManager",
    "GameManager",
    "ChromeManager",
    "setup_logging",
    "console",
    "__version__",
]
