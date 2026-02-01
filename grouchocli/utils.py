"""Utility functions for Groucho CLI.

This module provides logging setup, console output formatting,
error handling decorators, and other utility functions.
"""

import functools
import logging
import sys
from pathlib import Path
from typing import Any, Callable, TypeVar, cast

from rich.console import Console
from rich.logging import RichHandler
from rich.panel import Panel
from rich.text import Text
from rich.theme import Theme

# Custom theme for consistent styling
CUSTOM_THEME = Theme({
    "info": "cyan",
    "success": "green",
    "warning": "yellow",
    "error": "red bold",
    "debug": "dim blue",
    "highlight": "magenta",
    "title": "bold white on blue",
})

# Global console instance
console = Console(theme=CUSTOM_THEME, stderr=False)
error_console = Console(theme=CUSTOM_THEME, stderr=True)

# Type variable for decorator
F = TypeVar("F", bound=Callable[..., Any])


def setup_logging(
    level: str = "INFO",
    log_file: Path | None = None,
    verbose: bool = False,
) -> logging.Logger:
    """Set up logging with Rich formatting.
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL).
        log_file: Optional path to log file for persistent logging.
        verbose: If True, enable debug logging regardless of level.
    
    Returns:
        Configured logger instance.
    """
    # Determine effective log level
    effective_level = "DEBUG" if verbose else level.upper()
    
    # Configure root logger
    logger = logging.getLogger("groucho")
    logger.setLevel(getattr(logging, effective_level))
    
    # Remove existing handlers to avoid duplicates
    logger.handlers.clear()
    
    # Rich console handler
    rich_handler = RichHandler(
        console=console,
        show_time=True,
        show_path=verbose,
        rich_tracebacks=True,
        tracebacks_show_locals=verbose,
        markup=True,
    )
    rich_handler.setLevel(getattr(logging, effective_level))
    
    formatter = logging.Formatter(
        fmt="%(message)s",
        datefmt="[%X]",
    )
    rich_handler.setFormatter(formatter)
    logger.addHandler(rich_handler)
    
    # File handler if requested
    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)  # Always log debug to file
        file_formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(funcName)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
    
    return logger


def print_success(message: str, title: str = "Success") -> None:
    """Print a success message in a styled panel.
    
    Args:
        message: The success message to display.
        title: Title for the panel.
    """
    panel = Panel(
        Text(message, style="success"),
        title=f"[success]✓ {title}[/success]",
        border_style="green",
    )
    console.print(panel)


def print_error(message: str, title: str = "Error") -> None:
    """Print an error message in a styled panel.
    
    Args:
        message: The error message to display.
        title: Title for the panel.
    """
    panel = Panel(
        Text(message, style="error"),
        title=f"[error]✗ {title}[/error]",
        border_style="red",
    )
    error_console.print(panel)


def print_warning(message: str, title: str = "Warning") -> None:
    """Print a warning message in a styled panel.
    
    Args:
        message: The warning message to display.
        title: Title for the panel.
    """
    panel = Panel(
        Text(message, style="warning"),
        title=f"[warning]⚠ {title}[/warning]",
        border_style="yellow",
    )
    console.print(panel)


def print_info(message: str, title: str = "Info") -> None:
    """Print an info message in a styled panel.
    
    Args:
        message: The info message to display.
        title: Title for the panel.
    """
    panel = Panel(
        Text(message, style="info"),
        title=f"[info]ℹ {title}[/info]",
        border_style="cyan",
    )
    console.print(panel)


def handle_errors(
    message: str = "An error occurred",
    exit_on_error: bool = True,
) -> Callable[[F], F]:
    """Decorator for handling exceptions with Rich output.
    
    Args:
        message: Error message prefix.
        exit_on_error: If True, exit with code 1 on error.
    
    Returns:
        Decorator function.
    """
    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                return func(*args, **kwargs)
            except KeyboardInterrupt:
                console.print("\n[yellow]Operation cancelled by user[/yellow]")
                sys.exit(130)
            except Exception as e:
                error_console.print(f"\n[error]{message}:[/error] {e}")
                if logging.getLogger("groucho").isEnabledFor(logging.DEBUG):
                    error_console.print_exception()
                if exit_on_error:
                    sys.exit(1)
                raise
        return cast(F, wrapper)
    return decorator


def validate_path(path: Path, must_exist: bool = True, is_file: bool = False) -> bool:
    """Validate a file or directory path.
    
    Args:
        path: Path to validate.
        must_exist: If True, path must exist.
        is_file: If True, path must be a file; if False, must be a directory.
    
    Returns:
        True if path is valid, False otherwise.
    """
    if must_exist and not path.exists():
        return False
    
    if path.exists():
        if is_file and not path.is_file():
            return False
        if not is_file and not path.is_dir():
            return False
    
    return True


def get_project_root() -> Path:
    """Get the project root directory.
    
    Returns:
        Absolute path to project root.
    """
    # Start from current file and go up to find project root
    current = Path(__file__).resolve().parent
    # Look for docker-compose.yml as marker
    while current != current.parent:
        if (current / "docker-compose.yml").exists():
            return current
        current = current.parent
    
    # Fallback to parent of grouchocli package
    return Path(__file__).resolve().parent.parent


def format_duration(seconds: float) -> str:
    """Format a duration in seconds to human-readable string.
    
    Args:
        seconds: Duration in seconds.
    
    Returns:
        Formatted duration string (e.g., "2h 15m 30s").
    """
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{minutes}m {secs}s"
    else:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        return f"{hours}h {minutes}m {secs}s"


def format_bytes(size_bytes: int) -> str:
    """Format bytes to human-readable string.
    
    Args:
        size_bytes: Size in bytes.
    
    Returns:
        Formatted size string (e.g., "1.5 GB").
    """
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} PB"


def spinner(text: str = "Working..."):
    """Create a Rich spinner context manager.
    
    Args:
        text: Text to display next to spinner.
    
    Returns:
        Rich status context manager.
    """
    return console.status(f"[bold cyan]{text}[/bold cyan]", spinner="dots")


def confirm_action(message: str, default: bool = False) -> bool:
    """Ask user for confirmation.
    
    Args:
        message: Confirmation message.
        default: Default value if user just presses Enter.
    
    Returns:
        True if confirmed, False otherwise.
    """
    from rich.prompt import Confirm
    return Confirm.ask(message, default=default)
