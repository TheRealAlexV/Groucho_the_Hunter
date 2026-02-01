"""Main CLI entry point for Groucho CLI.

This module defines all CLI commands using Click, with support for
both development and production Docker environments.
"""

import logging
import sys
from typing import Optional
from pathlib import Path
import time

import click
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from grouchocli.chrome_manager import (
    ChromeManager,
    ChromeManagerError,
    ChromeNotFoundError,
)
from grouchocli.config import get_config
from grouchocli.docker_manager import (
    ComposeFileError,
    ContainerNotFoundError,
    DockerManager,
    DockerManagerError,
)
from grouchocli.game_manager import GameManager
from grouchocli.utils import (
    console,
    error_console,
    handle_errors,
    print_error,
    print_info,
    print_success,
    print_warning,
    setup_logging,
    spinner,
)

# Get package version
from grouchocli import __version__

# Create pass decorator for sharing context
pass_config = click.make_pass_decorator(dict, ensure=True)


def get_environment_help() -> str:
    """Get help text for environment options."""
    return """
    Environment Options:
      --dev    Use development environment (port 3000, hot reload)
      --prod   Use production environment (port 8080, optimized build)
    
    If neither is specified, the command may apply to both or default to development.
    """


@click.group(
    help=f"""
    [bold cyan]Groucho CLI[/bold cyan] - Management tool for Groucho the Hunter game
    
    A browser-based first-person shooter/adventure game built with Three.js.
    
    [green]Version:[/green] {__version__}
    
    Use [yellow]groucho COMMAND --help[/yellow] for detailed command information.
    """,
    invoke_without_command=True,
)
@click.option(
    "--verbose", "-v",
    is_flag=True,
    help="Enable verbose (debug) logging.",
)
@click.option(
    "--version",
    is_flag=True,
    help="Show version and exit.",
)
@click.pass_context
def cli(ctx: click.Context, verbose: bool, version: bool) -> None:
    """Main CLI entry point."""
    if version:
        console.print(f"[bold cyan]Groucho CLI[/bold cyan] version [green]{__version__}[/green]")
        ctx.exit(0)
    
    # Setup logging
    setup_logging(verbose=verbose)
    
    # Ensure context object exists
    if ctx.obj is None:
        ctx.obj = {}
    
    ctx.obj["verbose"] = verbose
    
    # If no subcommand invoked, show help
    if ctx.invoked_subcommand is None:
        console.print(ctx.get_help())
        console.print(f"\n[dim]Run [yellow]groucho menu[/yellow] for interactive mode[/dim]")


@cli.command(
    help=f"""
    Start the game environment.
    
    {get_environment_help()}
    
    Examples:
      groucho start --dev     # Start development environment
      groucho start --prod    # Start production environment
      groucho start --dev --build  # Build before starting
    """
)
@click.option(
    "--dev",
    is_flag=True,
    help="Start development environment.",
)
@click.option(
    "--prod",
    is_flag=True,
    help="Start production environment.",
)
@click.option(
    "--build", "-b",
    is_flag=True,
    help="Build images before starting.",
)
@handle_errors("Failed to start environment")
def start(dev: bool, prod: bool, build: bool) -> None:
    """Start the game environment."""
    # Default to dev if neither specified
    if not dev and not prod:
        dev = True
    
    manager = DockerManager()
    
    environments = []
    if dev:
        environments.append((True, "Development"))
    if prod:
        environments.append((False, "Production"))
    
    for is_dev, env_name in environments:
        try:
            manager.start(dev=is_dev, build=build)
        except DockerManagerError as e:
            print_error(str(e), title=f"{env_name} Start Failed")
            if len(environments) == 1:
                raise click.ClickException(str(e))


@cli.command(
    help=f"""
    Stop the game environment.
    
    {get_environment_help()}
    
    Examples:
      groucho stop --dev     # Stop development environment
      groucho stop --prod    # Stop production environment
      groucho stop --dev --prod  # Stop both environments
    """
)
@click.option(
    "--dev",
    is_flag=True,
    help="Stop development environment.",
)
@click.option(
    "--prod",
    is_flag=True,
    help="Stop production environment.",
)
@handle_errors("Failed to stop environment")
def stop(dev: bool, prod: bool) -> None:
    """Stop the game environment."""
    # Default to both if neither specified
    if not dev and not prod:
        dev = True
        prod = True
    
    manager = DockerManager()
    
    environments = []
    if dev:
        environments.append((True, "Development"))
    if prod:
        environments.append((False, "Production"))
    
    for is_dev, env_name in environments:
        try:
            manager.stop(dev=is_dev)
        except DockerManagerError as e:
            print_error(str(e), title=f"{env_name} Stop Failed")


@cli.command(
    help=f"""
    Restart the game environment.
    
    {get_environment_help()}
    
    Examples:
      groucho restart --dev     # Restart development environment
      groucho restart --prod    # Restart production environment
    """
)
@click.option(
    "--dev",
    is_flag=True,
    help="Restart development environment.",
)
@click.option(
    "--prod",
    is_flag=True,
    help="Restart production environment.",
)
@handle_errors("Failed to restart environment")
def restart(dev: bool, prod: bool) -> None:
    """Restart the game environment."""
    # Default to dev if neither specified
    if not dev and not prod:
        dev = True
    
    manager = DockerManager()
    
    environments = []
    if dev:
        environments.append((True, "Development"))
    if prod:
        environments.append((False, "Production"))
    
    for is_dev, env_name in environments:
        try:
            manager.restart(dev=is_dev)
        except DockerManagerError as e:
            print_error(str(e), title=f"{env_name} Restart Failed")


@cli.command(
    help="""
    Show the status of game environments.
    
    Displays information about both development and production containers
    including their running status, ports, uptime, and health.
    
    Examples:
      groucho status           # Show status of all environments
      groucho status --dev     # Show only development status
      groucho status --prod    # Show only production status
    """
)
@click.option(
    "--dev",
    is_flag=True,
    help="Show only development environment status.",
)
@click.option(
    "--prod",
    is_flag=True,
    help="Show only production environment status.",
)
@handle_errors("Failed to get status")
def status(dev: bool, prod: bool) -> None:
    """Show container and game status."""
    game_manager = GameManager()
    
    # Determine which environments to show
    if not dev and not prod:
        # Show both
        game_manager.display_status(dev=None)
    elif dev and not prod:
        game_manager.display_status(dev=True)
    elif prod and not dev:
        game_manager.display_status(dev=False)
    else:
        # Both flags specified
        game_manager.display_status(dev=None)


@cli.command(
    help=f"""
    View container logs.
    
    {get_environment_help()}
    
    Examples:
      groucho logs --dev              # Show last 100 lines of dev logs
      groucho logs --dev --follow     # Follow dev logs in real-time
      groucho logs --prod -f -n 50    # Follow prod logs, show last 50 lines
    """
)
@click.option(
    "--dev",
    is_flag=True,
    help="Show development environment logs.",
)
@click.option(
    "--prod",
    is_flag=True,
    help="Show production environment logs.",
)
@click.option(
    "--follow", "-f",
    is_flag=True,
    help="Follow log output in real-time.",
)
@click.option(
    "--tail", "-n",
    default=100,
    type=int,
    help="Number of lines to show from the end (default: 100).",
)
@handle_errors("Failed to get logs", exit_on_error=False)
def logs(dev: bool, prod: bool, follow: bool, tail: int) -> None:
    """View container logs."""
    # Default to dev if neither specified
    if not dev and not prod:
        dev = True
    
    manager = DockerManager()
    
    environments = []
    if dev:
        environments.append((True, "Development"))
    if prod:
        environments.append((False, "Production"))
    
    for is_dev, env_name in environments:
        if len(environments) > 1:
            console.print(f"\n[bold cyan]=== {env_name} Logs ===[/bold cyan]")
        
        try:
            for line in manager.stream_logs(dev=is_dev, follow=follow, tail=tail):
                console.print(line)
        except ContainerNotFoundError:
            print_error(
                f"Container not found. Is the {env_name.lower()} environment started?",
                title="Container Not Found"
            )


@cli.command(
    help=f"""
    Execute a command inside the container.
    
    {get_environment_help()}
    
    Examples:
      groucho exec --dev "ls -la"              # List files in dev container
      groucho exec --prod "cat /etc/os-release" # Check OS in prod container
    """
)
@click.argument("command")
@click.option(
    "--dev",
    is_flag=True,
    help="Execute in development container.",
)
@click.option(
    "--prod",
    is_flag=True,
    help="Execute in production container.",
)
@handle_errors("Failed to execute command")
def exec(command: str, dev: bool, prod: bool) -> None:
    """Execute a command inside the container."""
    # Default to dev if neither specified
    if not dev and not prod:
        dev = True
    
    manager = DockerManager()
    is_dev = dev or not prod
    
    exit_code, stdout, stderr = manager.execute(is_dev, command)
    
    if stdout:
        console.print(stdout)
    if stderr:
        error_console.print(stderr)
    
    if exit_code != 0:
        raise click.ClickException(f"Command exited with code {exit_code}")


@cli.command(
    help=f"""
    Open an interactive shell in the container.
    
    {get_environment_help()}
    
    Examples:
      groucho shell --dev     # Open shell in development container
      groucho shell --prod    # Open shell in production container
    """
)
@click.option(
    "--dev",
    is_flag=True,
    help="Open shell in development container.",
)
@click.option(
    "--prod",
    is_flag=True,
    help="Open shell in production container.",
)
@handle_errors("Failed to open shell")
def shell(dev: bool, prod: bool) -> None:
    """Open interactive shell in container."""
    # Default to dev if neither specified
    if not dev and not prod:
        dev = True
    
    manager = DockerManager()
    is_dev = dev or not prod
    
    manager.shell(is_dev)


@cli.command(
    help=f"""
    Build Docker images.
    
    {get_environment_help()}
    
    Examples:
      groucho build --dev         # Build development image
      groucho build --prod        # Build production image
      groucho build --dev --prod  # Build both images
      groucho build --dev --no-cache  # Build without cache
    """
)
@click.option(
    "--dev",
    is_flag=True,
    help="Build development image.",
)
@click.option(
    "--prod",
    is_flag=True,
    help="Build production image.",
)
@click.option(
    "--no-cache",
    is_flag=True,
    help="Build without using cache.",
)
@handle_errors("Failed to build images")
def build(dev: bool, prod: bool, no_cache: bool) -> None:
    """Build Docker images."""
    # Default to dev if neither specified
    if not dev and not prod:
        dev = True
    
    manager = DockerManager()
    
    environments = []
    if dev:
        environments.append((True, "Development"))
    if prod:
        environments.append((False, "Production"))
    
    for is_dev, env_name in environments:
        try:
            manager.build(dev=is_dev, no_cache=no_cache)
        except DockerManagerError as e:
            print_error(str(e), title=f"{env_name} Build Failed")


@cli.command(
    help="""
    Clean up Docker resources.
    
    Stops and removes all Groucho containers, images, and volumes.
    This is useful for starting fresh or reclaiming disk space.
    
    [red]Warning:[/red] This action cannot be undone!
    
    Examples:
      groucho clean          # Clean with confirmation prompt
      groucho clean --force  # Clean without confirmation
    """
)
@click.option(
    "--force", "-f",
    is_flag=True,
    help="Force clean without confirmation.",
)
@handle_errors("Failed to clean resources")
def clean(force: bool) -> None:
    """Clean up Docker resources."""
    manager = DockerManager()
    manager.clean(force=force)


@cli.command(
    help="""
    Launch interactive menu (TUI).
    
    Opens a text-based user interface for managing the game
    with keyboard navigation and real-time status display.
    
    This is a compact, SSH-friendly interface optimized for small
    terminal windows (minimum 80x24).
    
    Examples:
      groucho menu              # Launch TUI
    """
)
@handle_errors("Failed to launch TUI")
def menu() -> None:
    """Launch interactive TUI."""
    from grouchocli.tui import GrouchoApp
    
    app = GrouchoApp()
    app.run()


@cli.command(
    help="""
    Launch graphical user interface (GUI).
    
    Opens a tkinter-based GUI for managing the game environments.
    Requires X11 forwarding when running over SSH and tkinter installed.
    
    Environment Variables:
      DISPLAY       X11 display (e.g., ':0.0' or 'localhost:10.0')
      SSH_CLIENT    Set automatically by SSH
    
    SSH X11 Forwarding Setup:
      1. Enable X11 forwarding in SSH client:
         ssh -X user@host
         
      2. Or enable in ~/.ssh/config:
         Host remote-server
           ForwardX11 yes
           ForwardX11Trusted yes
    
    Examples:
      groucho gui               # Launch GUI (requires X11 + tkinter)
    """
)
@handle_errors("Failed to launch GUI")
def gui() -> None:
    """Launch graphical user interface."""
    import os
    
    # Check for DISPLAY environment variable
    display = os.environ.get("DISPLAY")
    if not display:
        console.print("[red]Error: X11 not available[/red]")
        console.print("")
        console.print("[yellow]The GUI requires X11 forwarding.[/yellow]")
        console.print("")
        console.print("To enable X11 forwarding:")
        console.print("  1. Connect with: ssh -X user@host")
        console.print("  2. Or set in ~/.ssh/config:")
        console.print("       Host remote-server")
        console.print("         ForwardX11 yes")
        console.print("")
        console.print("Alternatively, use the TUI: [cyan]groucho menu[/cyan]")
        raise click.ClickException("X11 not available")
    
    # Check for tkinter availability
    try:
        import tkinter
    except ImportError:
        console.print("[red]Error: tkinter not available[/red]")
        console.print("")
        console.print("[yellow]The GUI requires tkinter to be installed.[/yellow]")
        console.print("")
        console.print("To install tkinter:")
        console.print("  Ubuntu/Debian:  [cyan]sudo apt-get install python3-tk[/cyan]")
        console.print("  RHEL/CentOS:    [cyan]sudo yum install python3-tkinter[/cyan]")
        console.print("  Fedora:         [cyan]sudo dnf install python3-tkinter[/cyan]")
        console.print("  macOS:          [cyan]brew install python-tk[/cyan]")
        console.print("  Arch Linux:     [cyan]sudo pacman -S tk[/cyan]")
        console.print("")
        console.print("After installing, re-run: [cyan]./setup.sh[/cyan]")
        console.print("")
        console.print("Alternatively, use the TUI: [cyan]groucho menu[/cyan]")
        raise click.ClickException("tkinter not available")
    
    console.print(f"[green]Launching GUI on display: {display}[/green]")
    
    try:
        from grouchocli.gui import run_gui
        run_gui()
    except ImportError as e:
        console.print(f"[red]Error loading GUI: {e}[/red]")
        raise click.ClickException(f"Failed to load GUI: {e}")
    except Exception as e:
        console.print(f"[red]GUI error: {e}[/red]")
        raise click.ClickException(str(e))


# Chrome management command group
@cli.group(name="chrome", help="Chrome browser management for debugging and testing.")
def chrome_group():
    """Chrome browser management commands."""
    pass


@chrome_group.command(
    name="start",
    help="""
    Start Chrome with remote debugging enabled.
    
    Launches Chrome with remote debugging port (default: 9222)
    for debugging and testing the game during development.
    
    Chrome will always:
    - Start with --remote-debugging-port=9222
    - Use a dedicated user profile
    - Run in visible mode (not headless)
    - Open the game URL automatically
    
    Examples:
      groucho chrome start              # Start Chrome with default profile
      groucho chrome start --profile dev  # Start with 'dev' profile
    """
)
@click.option(
    "--profile", "-p",
    default="default",
    help="Profile name to use (default: 'default').",
)
@click.option(
    "--url", "-u",
    default=None,
    help="URL to open (default: dev server URL).",
)
@handle_errors("Failed to start Chrome")
def chrome_start(profile: str, url: Optional[str]) -> None:
    """Start Chrome with remote debugging."""
    try:
        manager = ChromeManager()
        manager.start(profile_name=profile, url=url)
    except ChromeNotFoundError as e:
        print_error(
            str(e),
            title="Chrome Not Found"
        )
        console.print("\n[dim]To specify Chrome path, set CHROME_PATH environment variable.[/dim]")


@chrome_group.command(
    name="stop",
    help="""
    Stop Chrome browser.
    
    Gracefully closes Chrome browser. If graceful close fails,
    the process will be forcefully terminated.
    
    Examples:
      groucho chrome stop         # Stop Chrome gracefully
      groucho chrome stop --force # Force kill Chrome
    """
)
@click.option(
    "--force", "-f",
    is_flag=True,
    help="Force kill Chrome without graceful shutdown.",
)
@handle_errors("Failed to stop Chrome")
def chrome_stop(force: bool) -> None:
    """Stop Chrome browser."""
    manager = ChromeManager()
    manager.stop(graceful=not force)


@chrome_group.command(
    name="status",
    help="""
    Check Chrome browser status.
    
    Displays information about Chrome including:
    - Running status
    - Process ID
    - Remote debugging port availability
    - Profile path
    
    Examples:
      groucho chrome status       # Check Chrome status
    """
)
@handle_errors("Failed to get Chrome status")
def chrome_status() -> None:
    """Check Chrome status."""
    from rich.table import Table
    
    try:
        manager = ChromeManager()
        status = manager.get_status()
        
        table = Table(title="Chrome Browser Status")
        table.add_column("Property", style="cyan")
        table.add_column("Value", style="green")
        
        table.add_row("Running", "Yes" if status["running"] else "No")
        table.add_row("PID", str(status["pid"]) if status["pid"] else "N/A")
        table.add_row("Debugging Port", str(status["port"]))
        table.add_row(
            "Debugging Available",
            "Yes" if status["debugging_available"] else "No"
        )
        table.add_row("Chrome Path", status["chrome_path"])
        table.add_row("Profile Path", status["profile_path"])
        
        console.print(table)
        
        if status["running"] and status["debugging_available"]:
            console.print(f"\n[dim]Chrome DevTools: http://localhost:{status['port']}/json/list[/dim]")
            
    except ChromeNotFoundError as e:
        print_error(str(e), title="Chrome Not Found")


# Chrome profile management commands
@chrome_group.group(name="profile", help="Manage Chrome profiles.")
def chrome_profile_group():
    """Chrome profile management commands."""
    pass


@chrome_profile_group.command(
    name="create",
    help="""
    Create a new Chrome profile.
    
    Creates a new isolated Chrome profile for separate browsing sessions.
    
    Examples:
      groucho chrome profile create dev      # Create 'dev' profile
      groucho chrome profile create testing  # Create 'testing' profile
    """
)
@click.argument("name")
@handle_errors("Failed to create profile")
def chrome_profile_create(name: str) -> None:
    """Create new Chrome profile."""
    manager = ChromeManager()
    manager.create_profile(name)


@chrome_profile_group.command(
    name="delete",
    help="""
    Delete a Chrome profile.
    
    Permanently removes a Chrome profile and all its data.
    
    Examples:
      groucho chrome profile delete dev      # Delete 'dev' profile
      groucho chrome profile delete dev --force  # Delete without confirmation
    """
)
@click.argument("name")
@click.option(
    "--force", "-f",
    is_flag=True,
    help="Delete without confirmation.",
)
@handle_errors("Failed to delete profile")
def chrome_profile_delete(name: str, force: bool) -> None:
    """Delete Chrome profile."""
    manager = ChromeManager()
    manager.delete_profile(name, force=force)


@chrome_profile_group.command(
    name="reset",
    help="""
    Reset a Chrome profile to default state.
    
    Clears all profile data including cookies, cache, and settings.
    The default profile will be reset if no name is specified.
    
    Examples:
      groucho chrome profile reset           # Reset default profile
      groucho chrome profile reset dev       # Reset 'dev' profile
      groucho chrome profile reset --force   # Reset without confirmation
    """
)
@click.argument("name", default="default", required=False)
@click.option(
    "--force", "-f",
    is_flag=True,
    help="Reset without confirmation.",
)
@handle_errors("Failed to reset profile")
def chrome_profile_reset(name: str, force: bool) -> None:
    """Reset Chrome profile."""
    manager = ChromeManager()
    manager.reset_profile(name, force=force)


@chrome_profile_group.command(
    name="list",
    help="""
    List all Chrome profiles.
    
    Displays all available Chrome profiles with their sizes and creation dates.
    
    Examples:
      groucho chrome profile list            # List all profiles
    """
)
@handle_errors("Failed to list profiles")
def chrome_profile_list() -> None:
    """List Chrome profiles."""
    from rich.table import Table
    from grouchocli.utils import format_duration
    
    manager = ChromeManager()
    profiles = manager.list_profiles()
    
    if not profiles:
        console.print("[dim]No profiles found.[/dim]")
        return
    
    table = Table(title="Chrome Profiles")
    table.add_column("Name", style="cyan")
    table.add_column("Path", style="dim")
    table.add_column("Size", style="green")
    table.add_column("Created", style="yellow")
    
    for profile in profiles:
        size_mb = profile["size"] / (1024 * 1024)
        created = time.strftime("%Y-%m-%d %H:%M", time.localtime(profile["created"]))
        
        table.add_row(
            profile["name"],
            profile["path"],
            f"{size_mb:.2f} MB",
            created
        )
    
    console.print(table)
    console.print(f"\nTotal profiles: {len(profiles)}")


@chrome_profile_group.command(
    name="backup",
    help="""
    Backup a Chrome profile.
    
    Creates a compressed archive of a profile for backup or migration.
    
    Examples:
      groucho chrome profile backup default     # Backup default profile
      groucho chrome profile backup dev --output ~/dev-profile.tar.gz
    """
)
@click.argument("name", default="default", required=False)
@click.option(
    "--output", "-o",
    type=click.Path(path_type=Path),
    default=None,
    help="Output path for backup file.",
)
@handle_errors("Failed to backup profile")
def chrome_profile_backup(name: str, output: Optional[Path]) -> None:
    """Backup Chrome profile."""
    manager = ChromeManager()
    backup_path = manager.backup_profile(name, output)
    console.print(f"[dim]Backup saved to: {backup_path}[/dim]")


@chrome_profile_group.command(
    name="restore",
    help="""
    Restore a Chrome profile from backup.
    
    Restores a profile from a previously created backup archive.
    
    Examples:
      groucho chrome profile restore ~/backup.tar.gz
      groucho chrome profile restore ~/backup.tar.gz --name restored-profile
    """
)
@click.argument("backup_path", type=click.Path(exists=True, path_type=Path))
@click.option(
    "--name", "-n",
    default=None,
    help="Name for restored profile (default: original name).",
)
@handle_errors("Failed to restore profile")
def chrome_profile_restore(backup_path: Path, name: Optional[str]) -> None:
    """Restore Chrome profile from backup."""
    manager = ChromeManager()
    manager.restore_profile(backup_path, name)


# Entry point for direct execution
if __name__ == "__main__":
    cli()
