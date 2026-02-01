"""Chrome browser management for Groucho CLI.

This module provides comprehensive Chrome browser management including
starting/stopping Chrome with remote debugging, profile management, and
status monitoring for debugging and testing the game.
"""

import http.client
import logging
import os
import platform
import shutil
import signal
import socket
import subprocess
import time
from pathlib import Path
from typing import Optional

from grouchocli.config import Config, get_config
from grouchocli.utils import console, print_error, print_info, print_success, print_warning

logger = logging.getLogger("groucho")


class ChromeManagerError(Exception):
    """Base exception for Chrome manager errors."""
    pass


class ChromeNotFoundError(ChromeManagerError):
    """Raised when Chrome executable is not found."""
    pass


class ChromeProcessError(ChromeManagerError):
    """Raised when Chrome process operation fails."""
    pass


class ProfileError(ChromeManagerError):
    """Raised when profile operation fails."""
    pass


class ChromeManager:
    """Manager for Chrome browser operations.
    
    This class handles all Chrome-related operations including starting,
    stopping, and monitoring Chrome instances with remote debugging enabled.
    
    Attributes:
        config: Configuration instance.
        chrome_path: Path to Chrome executable.
        profiles_path: Path to Chrome profiles directory.
        remote_debugging_port: Port for remote debugging (default 9222).
        _process: Chrome subprocess handle.
    """
    
    # Platform-specific Chrome executable paths
    CHROME_PATHS = {
        "Windows": [
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Users\\{}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
        ],
        "Darwin": [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Chrome.app/Contents/MacOS/Chrome",
        ],
        "Linux": [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/snap/bin/chromium",
        ],
    }
    
    def __init__(self, config: Optional[Config] = None) -> None:
        """Initialize Chrome manager.
        
        Args:
            config: Optional configuration instance. Uses global config if None.
        
        Raises:
            ChromeNotFoundError: If Chrome executable is not found.
        """
        self.config = config or get_config()
        self.chrome_path: Optional[Path] = None
        self.profiles_path: Path = self._get_profiles_path()
        self.remote_debugging_port: int = self.config.chrome_remote_debugging_port
        self._process: Optional[subprocess.Popen] = None
        
        # Auto-detect Chrome executable
        self.chrome_path = self._detect_chrome_executable()
        if not self.chrome_path:
            raise ChromeNotFoundError(
                "Chrome executable not found. "
                "Please install Google Chrome or Chromium."
            )
        
        logger.debug(f"Chrome manager initialized with path: {self.chrome_path}")
    
    def _get_profiles_path(self) -> Path:
        """Get the path to Chrome profiles directory.
        
        Returns:
            Path to profiles directory.
        """
        profiles_path = Path(self.config.chrome_profiles_path)
        profiles_path.mkdir(parents=True, exist_ok=True)
        return profiles_path
    
    def _detect_chrome_executable(self) -> Optional[Path]:
        """Auto-detect Chrome/Chromium executable path.
        
        Returns:
            Path to Chrome executable or None if not found.
        """
        # Check environment variable first
        env_path = os.getenv("CHROME_PATH")
        if env_path:
            path = Path(env_path)
            if path.exists() and path.is_file():
                return path
        
        # Check config override
        if self.config.chrome_executable_path:
            path = Path(self.config.chrome_executable_path)
            if path.exists() and path.is_file():
                return path
        
        # Check platform-specific paths
        system = platform.system()
        paths = self.CHROME_PATHS.get(system, [])
        
        for path in paths:
            if system == "Windows" and "{}" in path:
                # Format Windows user path
                user = os.getenv("USERNAME")
                if user:
                    path = path.format(user)
            
            path_obj = Path(path)
            if path_obj.exists() and path_obj.is_file():
                return path_obj
        
        # Try 'which' command on Unix-like systems
        if system != "Windows":
            for executable in ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]:
                path = shutil.which(executable)
                if path:
                    return Path(path)
        
        return None
    
    def _get_default_profile_path(self) -> Path:
        """Get the default Chrome profile path.
        
        Returns:
            Path to default profile directory.
        """
        return self.profiles_path / "chrome-profile-groucho"
    
    def _get_profile_path(self, profile_name: str) -> Path:
        """Get path for a named profile.
        
        Args:
            profile_name: Name of the profile.
        
        Returns:
            Path to profile directory.
        """
        if profile_name == "default":
            return self._get_default_profile_path()
        return self.profiles_path / f"chrome-profile-{profile_name}"
    
    def _is_port_open(self, port: int) -> bool:
        """Check if a port is open and accepting connections.
        
        Args:
            port: Port number to check.
        
        Returns:
            True if port is open, False otherwise.
        """
        try:
            conn = http.client.HTTPConnection("localhost", port, timeout=2)
            conn.request("GET", "/json/version")
            response = conn.getresponse()
            conn.close()
            return response.status == 200
        except (socket.error, http.client.HTTPException):
            return False
    
    def start(
        self,
        profile_name: str = "default",
        url: Optional[str] = None,
        additional_args: Optional[list[str]] = None,
    ) -> None:
        """Start Chrome with remote debugging enabled.
        
        Args:
            profile_name: Name of the profile to use (default: "default").
            url: Optional URL to open on startup.
            additional_args: Optional additional Chrome command-line arguments.
        
        Raises:
            ChromeProcessError: If Chrome fails to start.
        """
        if self.is_running():
            print_info("Chrome is already running", title="Chrome Status")
            return
        
        profile_path = self._get_profile_path(profile_name)
        profile_path.mkdir(parents=True, exist_ok=True)
        
        # Build Chrome command
        cmd = [
            str(self.chrome_path),
            f"--remote-debugging-port={self.remote_debugging_port}",
            f"--user-data-dir={profile_path}",
        ]
        
        # Add common development arguments
        cmd.extend([
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-features=TranslateUI",
            "--disable-extensions",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
        ])
        
        # Add any additional arguments
        if additional_args:
            cmd.extend(additional_args)
        
        # Add URL if specified
        if url:
            cmd.append(url)
        else:
            # Default to local game URL
            cmd.append(self.config.dev_url)
        
        logger.debug(f"Starting Chrome with command: {' '.join(cmd)}")
        
        try:
            # Start Chrome process
            if platform.system() == "Windows":
                self._process = subprocess.Popen(
                    cmd,
                    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
                )
            else:
                self._process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    start_new_session=True,
                )
            
            # Wait a moment for Chrome to start
            time.sleep(2)
            
            # Verify Chrome started successfully
            if self._process.poll() is not None:
                raise ChromeProcessError("Chrome process exited immediately")
            
            # Wait for debugging port to be available
            for _ in range(10):
                if self._is_port_open(self.remote_debugging_port):
                    break
                time.sleep(0.5)
            else:
                print_warning(
                    "Chrome started but debugging port not responding",
                    title="Chrome Warning"
                )
            
            print_success(
                f"Chrome started with remote debugging on port {self.remote_debugging_port}",
                title="Chrome Started"
            )
            print_info(f"Profile: {profile_name}", title="Profile")
            
        except subprocess.SubprocessError as e:
            raise ChromeProcessError(f"Failed to start Chrome: {e}")
    
    def stop(self, graceful: bool = True) -> None:
        """Stop Chrome browser.
        
        Args:
            graceful: If True, try graceful close first before killing.
        
        Raises:
            ChromeProcessError: If Chrome fails to stop.
        """
        if not self.is_running():
            print_info("Chrome is not running", title="Chrome Status")
            return
        
        try:
            if graceful:
                # Try graceful shutdown first
                if self._process and self._process.poll() is None:
                    if platform.system() == "Windows":
                        self._process.terminate()
                    else:
                        os.killpg(os.getpgid(self._process.pid), signal.SIGTERM)
                    
                    # Wait for process to terminate
                    try:
                        self._process.wait(timeout=5)
                        print_success("Chrome stopped gracefully", title="Chrome Stopped")
                        return
                    except subprocess.TimeoutExpired:
                        pass
            
            # Force kill if graceful didn't work
            if self._process and self._process.poll() is None:
                if platform.system() == "Windows":
                    self._process.kill()
                else:
                    os.killpg(os.getpgid(self._process.pid), signal.SIGKILL)
                self._process.wait(timeout=2)
            
            # Clean up lock files
            self._cleanup_lock_files()
            
            print_success("Chrome stopped (force)", title="Chrome Stopped")
            
        except (subprocess.SubprocessError, OSError) as e:
            raise ChromeProcessError(f"Failed to stop Chrome: {e}")
        finally:
            self._process = None
    
    def _cleanup_lock_files(self) -> None:
        """Clean up Chrome lock files after stopping."""
        for profile_dir in self.profiles_path.iterdir():
            if profile_dir.is_dir():
                lock_file = profile_dir / "SingletonLock"
                if lock_file.exists():
                    try:
                        lock_file.unlink()
                        logger.debug(f"Removed lock file: {lock_file}")
                    except OSError as e:
                        logger.warning(f"Failed to remove lock file {lock_file}: {e}")
    
    def is_running(self) -> bool:
        """Check if Chrome is running.
        
        Returns:
            True if Chrome is running, False otherwise.
        """
        # Check if we have a process handle
        if self._process is not None:
            if self._process.poll() is None:
                return True
            self._process = None
        
        # Check if remote debugging port is in use
        return self._is_port_open(self.remote_debugging_port)
    
    def get_status(self) -> dict:
        """Get Chrome status information.
        
        Returns:
            Dictionary with Chrome status details.
        """
        status = {
            "running": False,
            "pid": None,
            "port": self.remote_debugging_port,
            "debugging_available": False,
            "chrome_path": str(self.chrome_path),
            "profile_path": str(self._get_default_profile_path()),
        }
        
        if self._process and self._process.poll() is None:
            status["running"] = True
            status["pid"] = self._process.pid
        
        status["debugging_available"] = self._is_port_open(self.remote_debugging_port)
        
        return status
    
    def create_profile(self, profile_name: str) -> Path:
        """Create a new Chrome profile.
        
        Args:
            profile_name: Name for the new profile.
        
        Returns:
            Path to the created profile.
        
        Raises:
            ProfileError: If profile creation fails.
        """
        if profile_name == "default":
            raise ProfileError("Cannot create profile named 'default', use reset instead")
        
        profile_path = self._get_profile_path(profile_name)
        
        if profile_path.exists():
            raise ProfileError(f"Profile '{profile_name}' already exists")
        
        try:
            profile_path.mkdir(parents=True, exist_ok=True)
            print_success(f"Profile '{profile_name}' created", title="Profile Created")
            return profile_path
        except OSError as e:
            raise ProfileError(f"Failed to create profile: {e}")
    
    def delete_profile(self, profile_name: str, force: bool = False) -> None:
        """Delete a Chrome profile.
        
        Args:
            profile_name: Name of the profile to delete.
            force: If True, delete without confirmation.
        
        Raises:
            ProfileError: If profile deletion fails.
        """
        if profile_name == "default":
            raise ProfileError("Cannot delete default profile, use reset instead")
        
        profile_path = self._get_profile_path(profile_name)
        
        if not profile_path.exists():
            raise ProfileError(f"Profile '{profile_name}' not found")
        
        if not force:
            response = input(f"Are you sure you want to delete profile '{profile_name}'? [y/N]: ")
            if response.lower() != "y":
                print_info("Profile deletion cancelled")
                return
        
        try:
            shutil.rmtree(profile_path)
            print_success(f"Profile '{profile_name}' deleted", title="Profile Deleted")
        except OSError as e:
            raise ProfileError(f"Failed to delete profile: {e}")
    
    def reset_profile(self, profile_name: str = "default", force: bool = False) -> None:
        """Reset a profile to default state.
        
        Args:
            profile_name: Name of the profile to reset.
            force: If True, reset without confirmation.
        
        Raises:
            ProfileError: If profile reset fails.
        """
        profile_path = self._get_profile_path(profile_name)
        
        if not profile_path.exists():
            # Profile doesn't exist, just create it
            profile_path.mkdir(parents=True, exist_ok=True)
            print_success(f"Profile '{profile_name}' created", title="Profile Reset")
            return
        
        if not force:
            response = input(
                f"Are you sure you want to reset profile '{profile_name}'? "
                "All data will be lost! [y/N]: "
            )
            if response.lower() != "y":
                print_info("Profile reset cancelled")
                return
        
        try:
            # Stop Chrome if running with this profile
            if self.is_running():
                self.stop()
            
            # Remove and recreate profile directory
            shutil.rmtree(profile_path)
            profile_path.mkdir(parents=True, exist_ok=True)
            
            print_success(f"Profile '{profile_name}' reset", title="Profile Reset")
        except OSError as e:
            raise ProfileError(f"Failed to reset profile: {e}")
    
    def backup_profile(self, profile_name: str, backup_path: Optional[Path] = None) -> Path:
        """Backup a Chrome profile.
        
        Args:
            profile_name: Name of the profile to backup.
            backup_path: Optional path for backup file. If None, creates timestamped backup.
        
        Returns:
            Path to the backup file.
        
        Raises:
            ProfileError: If backup fails.
        """
        profile_path = self._get_profile_path(profile_name)
        
        if not profile_path.exists():
            raise ProfileError(f"Profile '{profile_name}' not found")
        
        if backup_path is None:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            backup_path = self.profiles_path / f"{profile_name}_backup_{timestamp}.tar.gz"
        
        try:
            import tarfile
            with tarfile.open(backup_path, "w:gz") as tar:
                tar.add(profile_path, arcname=profile_path.name)
            
            print_success(
                f"Profile '{profile_name}' backed up to {backup_path}",
                title="Profile Backup"
            )
            return backup_path
        except Exception as e:
            raise ProfileError(f"Failed to backup profile: {e}")
    
    def restore_profile(self, backup_path: Path, profile_name: Optional[str] = None) -> None:
        """Restore a Chrome profile from backup.
        
        Args:
            backup_path: Path to the backup file.
            profile_name: Optional name for restored profile. If None, uses original name.
        
        Raises:
            ProfileError: If restore fails.
        """
        if not backup_path.exists():
            raise ProfileError(f"Backup file not found: {backup_path}")
        
        if profile_name is None:
            # Extract original profile name from backup filename
            profile_name = backup_path.stem.split("_backup_")[0]
        
        profile_path = self._get_profile_path(profile_name)
        
        # Stop Chrome if running
        if self.is_running():
            self.stop()
        
        try:
            import tarfile
            
            # Remove existing profile if it exists
            if profile_path.exists():
                shutil.rmtree(profile_path)
            
            # Extract backup
            with tarfile.open(backup_path, "r:gz") as tar:
                tar.extractall(self.profiles_path)
            
            print_success(
                f"Profile restored from {backup_path}",
                title="Profile Restored"
            )
        except Exception as e:
            raise ProfileError(f"Failed to restore profile: {e}")
    
    def list_profiles(self) -> list[dict]:
        """List all available Chrome profiles.
        
        Returns:
            List of dictionaries with profile information.
        """
        profiles = []
        
        for profile_dir in self.profiles_path.iterdir():
            if profile_dir.is_dir() and profile_dir.name.startswith("chrome-profile-"):
                profile_name = profile_dir.name.replace("chrome-profile-", "")
                
                # Calculate directory size
                total_size = 0
                for file_path in profile_dir.rglob("*"):
                    if file_path.is_file():
                        total_size += file_path.stat().st_size
                
                profiles.append({
                    "name": profile_name,
                    "path": str(profile_dir),
                    "size": total_size,
                    "created": profile_dir.stat().st_ctime,
                })
        
        return sorted(profiles, key=lambda p: p["name"])
