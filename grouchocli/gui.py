"""GUI for Groucho CLI using tkinter (X11 forwarding compatible).

This module provides a graphical user interface using tkinter,
which is part of the Python standard library and works over
SSH X11 forwarding without external dependencies.

Note: tkinter must be installed at the system level:
  - Ubuntu/Debian: sudo apt-get install python3-tk
  - RHEL/CentOS:   sudo yum install python3-tkinter
  - macOS:         brew install python-tk
  - Windows:       Included with standard Python installer
"""

import logging
import os
import sys
import threading
import time
from typing import Optional, List, Tuple

# Check tkinter availability before importing
try:
    import tkinter as tk
    from tkinter import ttk, scrolledtext, messagebox, filedialog
    TKINTER_AVAILABLE = True
except ImportError:
    TKINTER_AVAILABLE = False
    # Define dummy classes for type hints
    class tk:  # type: ignore
        class Tk:
            pass
    ttk = messagebox = filedialog = None  # type: ignore

from grouchocli.config import get_config, Config
from grouchocli.docker_manager import DockerManager, DockerManagerError
from grouchocli.game_manager import GameManager
from grouchocli.chrome_manager import ChromeManager, ChromeManagerError, ChromeNotFoundError
from grouchocli.utils import format_duration

logger = logging.getLogger("groucho")


class StatusIndicator:
    """Helper class for status indicators."""
    
    RUNNING = "#00aa00"  # Green
    STOPPED = "#cc0000"  # Red
    UNKNOWN = "#888888"  # Gray
    WARNING = "#ff8800"  # Orange


class GrouchoGUI:
    """Main GUI application for Groucho CLI.
    
    Uses tkinter for X11 forwarding compatibility. Uses only basic
    widgets (buttons, labels, text, dropdown) for efficient rendering.
    """
    
    def __init__(self) -> None:
        """Initialize the GUI."""
        self.config = get_config()
        self.docker_manager: Optional[DockerManager] = None
        self.game_manager: Optional[GameManager] = None
        self.chrome_manager: Optional[ChromeManager] = None
        
        # Status tracking
        self.status_vars = {}
        self.log_text: Optional[scrolledtext.ScrolledText] = None
        
        # Initialize managers
        self._init_managers()
        
        # Create UI
        self.root = tk.Tk()
        self.root.title("Groucho CLI - Game Manager")
        self.root.geometry("800x600")
        self.root.minsize(600, 400)
        
        self._create_ui()
        
        # Start status update thread
        self.running = True
        self.status_thread = threading.Thread(target=self._status_updater, daemon=True)
        self.status_thread.start()
    
    def _init_managers(self) -> None:
        """Initialize Docker and Chrome managers."""
        try:
            self.docker_manager = DockerManager(self.config)
            self.game_manager = GameManager(self.config, self.docker_manager)
        except Exception as e:
            logger.error(f"Docker not available: {e}")
            self.docker_manager = None
            self.game_manager = None
        
        try:
            self.chrome_manager = ChromeManager(self.config)
        except ChromeNotFoundError:
            logger.warning("Chrome not found")
            self.chrome_manager = None
        except Exception as e:
            logger.error(f"Chrome error: {e}")
            self.chrome_manager = None
    
    def _create_ui(self) -> None:
        """Create the user interface."""
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky="nsew")
        
        # Configure grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(1, weight=1)
        
        # Header
        header = ttk.Label(
            main_frame,
            text="Groucho the Hunter - Game Manager",
            font=("Helvetica", 16, "bold")
        )
        header.grid(row=0, column=0, pady=(0, 10), sticky="w")
        
        # Notebook (tabs)
        notebook = ttk.Notebook(main_frame)
        notebook.grid(row=1, column=0, sticky="nsew", pady=5)
        
        # Create tabs
        self._create_docker_tab(notebook)
        self._create_chrome_tab(notebook)
        self._create_status_tab(notebook)
        self._create_logs_tab(notebook)
        
        # Status bar
        self.status_bar = ttk.Label(
            main_frame,
            text="Ready",
            relief=tk.SUNKEN,
            anchor=tk.W
        )
        self.status_bar.grid(row=2, column=0, sticky="ew", pady=(5, 0))
    
    def _create_docker_tab(self, notebook: ttk.Notebook) -> None:
        """Create Docker management tab."""
        frame = ttk.Frame(notebook, padding="10")
        notebook.add(frame, text="Docker")
        
        # Development section
        dev_frame = ttk.LabelFrame(frame, text="Development Environment", padding="10")
        dev_frame.pack(fill=tk.X, pady=5)
        
        self.status_vars['dev'] = tk.StringVar(value="Unknown")
        ttk.Label(dev_frame, text="Status:").grid(row=0, column=0, sticky=tk.W)
        self.dev_status_label = ttk.Label(
            dev_frame,
            textvariable=self.status_vars['dev'],
            foreground=StatusIndicator.UNKNOWN
        )
        self.dev_status_label.grid(row=0, column=1, sticky=tk.W, padx=5)
        
        dev_btn_frame = ttk.Frame(dev_frame)
        dev_btn_frame.grid(row=1, column=0, columnspan=2, pady=5)
        
        ttk.Button(
            dev_btn_frame,
            text="Start",
            command=lambda: self._start_dev()
        ).pack(side=tk.LEFT, padx=2)
        ttk.Button(
            dev_btn_frame,
            text="Stop",
            command=lambda: self._stop_dev()
        ).pack(side=tk.LEFT, padx=2)
        ttk.Button(
            dev_btn_frame,
            text="Restart",
            command=lambda: self._restart_dev()
        ).pack(side=tk.LEFT, padx=2)
        
        # Production section
        prod_frame = ttk.LabelFrame(frame, text="Production Environment", padding="10")
        prod_frame.pack(fill=tk.X, pady=5)
        
        self.status_vars['prod'] = tk.StringVar(value="Unknown")
        ttk.Label(prod_frame, text="Status:").grid(row=0, column=0, sticky=tk.W)
        self.prod_status_label = ttk.Label(
            prod_frame,
            textvariable=self.status_vars['prod'],
            foreground=StatusIndicator.UNKNOWN
        )
        self.prod_status_label.grid(row=0, column=1, sticky=tk.W, padx=5)
        
        prod_btn_frame = ttk.Frame(prod_frame)
        prod_btn_frame.grid(row=1, column=0, columnspan=2, pady=5)
        
        ttk.Button(
            prod_btn_frame,
            text="Start",
            command=lambda: self._start_prod()
        ).pack(side=tk.LEFT, padx=2)
        ttk.Button(
            prod_btn_frame,
            text="Stop",
            command=lambda: self._stop_prod()
        ).pack(side=tk.LEFT, padx=2)
        ttk.Button(
            prod_btn_frame,
            text="Restart",
            command=lambda: self._restart_prod()
        ).pack(side=tk.LEFT, padx=2)
        
        # Build section
        build_frame = ttk.LabelFrame(frame, text="Build", padding="10")
        build_frame.pack(fill=tk.X, pady=5)
        
        build_btn_frame = ttk.Frame(build_frame)
        build_btn_frame.pack()
        
        ttk.Button(
            build_btn_frame,
            text="Build Dev",
            command=lambda: self._build_dev()
        ).pack(side=tk.LEFT, padx=2)
        ttk.Button(
            build_btn_frame,
            text="Build Prod",
            command=lambda: self._build_prod()
        ).pack(side=tk.LEFT, padx=2)
        ttk.Button(
            build_btn_frame,
            text="Build Both",
            command=lambda: self._build_both()
        ).pack(side=tk.LEFT, padx=2)
    
    def _create_chrome_tab(self, notebook: ttk.Notebook) -> None:
        """Create Chrome management tab."""
        frame = ttk.Frame(notebook, padding="10")
        notebook.add(frame, text="Chrome")
        
        if not self.chrome_manager:
            ttk.Label(
                frame,
                text="Chrome not available\nPlease install Google Chrome or Chromium",
                justify=tk.CENTER
            ).pack(expand=True)
            return
        
        # Status section
        status_frame = ttk.LabelFrame(frame, text="Chrome Status", padding="10")
        status_frame.pack(fill=tk.X, pady=5)
        
        self.status_vars['chrome'] = tk.StringVar(value="Unknown")
        ttk.Label(status_frame, text="Status:").grid(row=0, column=0, sticky=tk.W)
        self.chrome_status_label = ttk.Label(
            status_frame,
            textvariable=self.status_vars['chrome'],
            foreground=StatusIndicator.UNKNOWN
        )
        self.chrome_status_label.grid(row=0, column=1, sticky=tk.W, padx=5)
        
        ttk.Label(status_frame, text="Port:").grid(row=1, column=0, sticky=tk.W)
        ttk.Label(
            status_frame,
            text=str(self.config.chrome_remote_debugging_port)
        ).grid(row=1, column=1, sticky=tk.W, padx=5)
        
        # Control buttons
        btn_frame = ttk.Frame(frame)
        btn_frame.pack(fill=tk.X, pady=10)
        
        ttk.Button(
            btn_frame,
            text="Start Chrome",
            command=self._start_chrome
        ).pack(side=tk.LEFT, padx=5)
        ttk.Button(
            btn_frame,
            text="Stop Chrome",
            command=self._stop_chrome
        ).pack(side=tk.LEFT, padx=5)
        
        # Profile section
        profile_frame = ttk.LabelFrame(frame, text="Profile Management", padding="10")
        profile_frame.pack(fill=tk.X, pady=5)
        
        profile_btn_frame = ttk.Frame(profile_frame)
        profile_btn_frame.pack()
        
        ttk.Button(
            profile_btn_frame,
            text="List Profiles",
            command=self._list_profiles
        ).pack(side=tk.LEFT, padx=2)
        ttk.Button(
            profile_btn_frame,
            text="Create Profile",
            command=self._create_profile
        ).pack(side=tk.LEFT, padx=2)
        ttk.Button(
            profile_btn_frame,
            text="Backup Profile",
            command=self._backup_profile
        ).pack(side=tk.LEFT, padx=2)
    
    def _create_status_tab(self, notebook: ttk.Notebook) -> None:
        """Create detailed status tab."""
        frame = ttk.Frame(notebook, padding="10")
        notebook.add(frame, text="Status")
        
        self.status_text = scrolledtext.ScrolledText(
            frame,
            wrap=tk.WORD,
            width=70,
            height=20
        )
        self.status_text.pack(fill=tk.BOTH, expand=True)
        
        ttk.Button(
            frame,
            text="Refresh",
            command=self._refresh_status
        ).pack(pady=5)
    
    def _create_logs_tab(self, notebook: ttk.Notebook) -> None:
        """Create logs tab."""
        frame = ttk.Frame(notebook, padding="10")
        notebook.add(frame, text="Logs")
        
        # Environment selection
        select_frame = ttk.Frame(frame)
        select_frame.pack(fill=tk.X, pady=5)
        
        ttk.Label(select_frame, text="Environment:").pack(side=tk.LEFT, padx=5)
        self.log_env = tk.StringVar(value="dev")
        ttk.Radiobutton(
            select_frame,
            text="Development",
            variable=self.log_env,
            value="dev"
        ).pack(side=tk.LEFT, padx=5)
        ttk.Radiobutton(
            select_frame,
            text="Production",
            variable=self.log_env,
            value="prod"
        ).pack(side=tk.LEFT, padx=5)
        
        # Log display
        self.log_text = scrolledtext.ScrolledText(
            frame,
            wrap=tk.WORD,
            width=70,
            height=15
        )
        self.log_text.pack(fill=tk.BOTH, expand=True)
        
        # Buttons
        btn_frame = ttk.Frame(frame)
        btn_frame.pack(fill=tk.X, pady=5)
        
        ttk.Button(
            btn_frame,
            text="Get Logs",
            command=self._get_logs
        ).pack(side=tk.LEFT, padx=5)
        ttk.Button(
            btn_frame,
            text="Clear",
            command=lambda: self.log_text.delete(1.0, tk.END)
        ).pack(side=tk.LEFT, padx=5)
    
    # Docker actions
    def _start_dev(self) -> None:
        """Start development environment."""
        if not self.docker_manager:
            messagebox.showerror("Error", "Docker not available")
            return
        
        self._log("Starting development environment...")
        try:
            self.docker_manager.start(dev=True)
            self._log("Development environment started")
            self._log(f"URL: {self.config.get_url(dev=True)}")
        except Exception as e:
            self._log(f"Error: {e}")
            messagebox.showerror("Error", str(e))
    
    def _stop_dev(self) -> None:
        """Stop development environment."""
        if not self.docker_manager:
            messagebox.showerror("Error", "Docker not available")
            return
        
        self._log("Stopping development environment...")
        try:
            self.docker_manager.stop(dev=True)
            self._log("Development environment stopped")
        except Exception as e:
            self._log(f"Error: {e}")
            messagebox.showerror("Error", str(e))
    
    def _restart_dev(self) -> None:
        """Restart development environment."""
        if not self.docker_manager:
            messagebox.showerror("Error", "Docker not available")
            return
        
        self._log("Restarting development environment...")
        try:
            self.docker_manager.restart(dev=True)
            self._log("Development environment restarted")
        except Exception as e:
            self._log(f"Error: {e}")
            messagebox.showerror("Error", str(e))
    
    def _start_prod(self) -> None:
        """Start production environment."""
        if not self.docker_manager:
            messagebox.showerror("Error", "Docker not available")
            return
        
        self._log("Starting production environment...")
        try:
            self.docker_manager.start(dev=False)
            self._log("Production environment started")
            self._log(f"URL: {self.config.get_url(dev=False)}")
        except Exception as e:
            self._log(f"Error: {e}")
            messagebox.showerror("Error", str(e))
    
    def _stop_prod(self) -> None:
        """Stop production environment."""
        if not self.docker_manager:
            messagebox.showerror("Error", "Docker not available")
            return
        
        self._log("Stopping production environment...")
        try:
            self.docker_manager.stop(dev=False)
            self._log("Production environment stopped")
        except Exception as e:
            self._log(f"Error: {e}")
            messagebox.showerror("Error", str(e))
    
    def _restart_prod(self) -> None:
        """Restart production environment."""
        if not self.docker_manager:
            messagebox.showerror("Error", "Docker not available")
            return
        
        self._log("Restarting production environment...")
        try:
            self.docker_manager.restart(dev=False)
            self._log("Production environment restarted")
        except Exception as e:
            self._log(f"Error: {e}")
            messagebox.showerror("Error", str(e))
    
    def _build_dev(self) -> None:
        """Build development image."""
        if not self.docker_manager:
            messagebox.showerror("Error", "Docker not available")
            return
        
        self._log("Building development image...")
        try:
            self.docker_manager.build(dev=True)
            self._log("Development build complete")
        except Exception as e:
            self._log(f"Error: {e}")
            messagebox.showerror("Error", str(e))
    
    def _build_prod(self) -> None:
        """Build production image."""
        if not self.docker_manager:
            messagebox.showerror("Error", "Docker not available")
            return
        
        self._log("Building production image...")
        try:
            self.docker_manager.build(dev=False)
            self._log("Production build complete")
        except Exception as e:
            self._log(f"Error: {e}")
            messagebox.showerror("Error", str(e))
    
    def _build_both(self) -> None:
        """Build both images."""
        self._build_dev()
        self._build_prod()
    
    # Chrome actions
    def _start_chrome(self) -> None:
        """Start Chrome browser."""
        if not self.chrome_manager:
            messagebox.showerror("Error", "Chrome not available")
            return
        
        self._log("Starting Chrome...")
        try:
            self.chrome_manager.start()
            self._log("Chrome started successfully")
        except Exception as e:
            self._log(f"Error: {e}")
            messagebox.showerror("Error", str(e))
    
    def _stop_chrome(self) -> None:
        """Stop Chrome browser."""
        if not self.chrome_manager:
            messagebox.showerror("Error", "Chrome not available")
            return
        
        self._log("Stopping Chrome...")
        try:
            self.chrome_manager.stop()
            self._log("Chrome stopped")
        except Exception as e:
            self._log(f"Error: {e}")
            messagebox.showerror("Error", str(e))
    
    def _list_profiles(self) -> None:
        """List Chrome profiles."""
        if not self.chrome_manager:
            messagebox.showerror("Error", "Chrome not available")
            return
        
        try:
            profiles = self.chrome_manager.list_profiles()
            self._log(f"Profiles: {len(profiles)}")
            for profile in profiles:
                self._log(f"  - {profile['name']}")
        except Exception as e:
            self._log(f"Error: {e}")
            messagebox.showerror("Error", str(e))
    
    def _create_profile(self) -> None:
        """Create a new Chrome profile."""
        if not self.chrome_manager:
            messagebox.showerror("Error", "Chrome not available")
            return
        
        from tkinter.simpledialog import askstring
        name = askstring("Create Profile", "Enter profile name:")
        if name:
            try:
                self.chrome_manager.create_profile(name)
                self._log(f"Profile '{name}' created")
            except Exception as e:
                self._log(f"Error: {e}")
                messagebox.showerror("Error", str(e))
    
    def _backup_profile(self) -> None:
        """Backup a Chrome profile."""
        if not self.chrome_manager:
            messagebox.showerror("Error", "Chrome not available")
            return
        
        filename = filedialog.asksaveasfilename(
            defaultextension=".tar.gz",
            filetypes=[("Tar GZ", "*.tar.gz"), ("All files", "*.*")]
        )
        if filename:
            try:
                self.chrome_manager.backup_profile("default", filename)
                self._log(f"Profile backed up to: {filename}")
            except Exception as e:
                self._log(f"Error: {e}")
                messagebox.showerror("Error", str(e))
    
    # Status and logs
    def _refresh_status(self) -> None:
        """Refresh detailed status."""
        if not self.game_manager:
            self.status_text.delete(1.0, tk.END)
            self.status_text.insert(tk.END, "Game manager not available\n")
            return
        
        self.status_text.delete(1.0, tk.END)
        
        for dev, name in [(True, "Development"), (False, "Production")]:
            try:
                info = self.game_manager.get_game_info(dev=dev)
                container = info.get("container", {})
                
                self.status_text.insert(tk.END, f"\n{name}:\n")
                self.status_text.insert(tk.END, f"  URL: {info.get('url', 'N/A')}\n")
                self.status_text.insert(tk.END, f"  Status: {container.get('status', 'unknown')}\n")
                self.status_text.insert(tk.END, f"  Container: {container.get('name', 'N/A')}\n")
                self.status_text.insert(tk.END, f"  Health: {container.get('health', 'unknown')}\n")
                
                if container.get("uptime"):
                    self.status_text.insert(tk.END, f"  Uptime: {format_duration(container['uptime'])}\n")
            except Exception as e:
                self.status_text.insert(tk.END, f"\n{name}: Error - {e}\n")
    
    def _get_logs(self) -> None:
        """Get container logs."""
        if not self.docker_manager:
            messagebox.showerror("Error", "Docker not available")
            return
        
        dev = self.log_env.get() == "dev"
        env_name = "Development" if dev else "Production"
        
        self.log_text.delete(1.0, tk.END)
        self.log_text.insert(tk.END, f"--- {env_name} Logs ---\n\n")
        
        try:
            for line in self.docker_manager.stream_logs(dev=dev, follow=False, tail=50):
                self.log_text.insert(tk.END, line + "\n")
            self.log_text.see(tk.END)
        except Exception as e:
            self.log_text.insert(tk.END, f"Error: {e}\n")
    
    def _log(self, message: str) -> None:
        """Log a message."""
        logger.info(message)
        self.status_bar.config(text=message)
    
    # Status updater thread
    def _status_updater(self) -> None:
        """Background thread for updating status."""
        while self.running:
            try:
                self._update_status()
                time.sleep(5)
            except Exception as e:
                logger.error(f"Status updater error: {e}")
                time.sleep(5)
    
    def _update_status(self) -> None:
        """Update status indicators."""
        # Update dev status
        if self.docker_manager:
            try:
                dev_info = self.docker_manager.get_status(dev=True)
                if dev_info.get("running"):
                    self.root.after(0, lambda: self.status_vars['dev'].set("Running"))
                    self.root.after(0, lambda: self.dev_status_label.config(foreground=StatusIndicator.RUNNING))
                elif dev_info.get("exists"):
                    self.root.after(0, lambda: self.status_vars['dev'].set("Stopped"))
                    self.root.after(0, lambda: self.dev_status_label.config(foreground=StatusIndicator.STOPPED))
                else:
                    self.root.after(0, lambda: self.status_vars['dev'].set("Not Created"))
                    self.root.after(0, lambda: self.dev_status_label.config(foreground=StatusIndicator.UNKNOWN))
            except Exception:
                self.root.after(0, lambda: self.status_vars['dev'].set("Error"))
        
        # Update prod status
        if self.docker_manager:
            try:
                prod_info = self.docker_manager.get_status(dev=False)
                if prod_info.get("running"):
                    self.root.after(0, lambda: self.status_vars['prod'].set("Running"))
                    self.root.after(0, lambda: self.prod_status_label.config(foreground=StatusIndicator.RUNNING))
                elif prod_info.get("exists"):
                    self.root.after(0, lambda: self.status_vars['prod'].set("Stopped"))
                    self.root.after(0, lambda: self.prod_status_label.config(foreground=StatusIndicator.STOPPED))
                else:
                    self.root.after(0, lambda: self.status_vars['prod'].set("Not Created"))
                    self.root.after(0, lambda: self.prod_status_label.config(foreground=StatusIndicator.UNKNOWN))
            except Exception:
                self.root.after(0, lambda: self.status_vars['prod'].set("Error"))
        
        # Update Chrome status
        if self.chrome_manager:
            try:
                chrome_info = self.chrome_manager.get_status()
                if chrome_info.get("running"):
                    self.root.after(0, lambda: self.status_vars['chrome'].set("Running"))
                    self.root.after(0, lambda: self.chrome_status_label.config(foreground=StatusIndicator.RUNNING))
                else:
                    self.root.after(0, lambda: self.status_vars['chrome'].set("Stopped"))
                    self.root.after(0, lambda: self.chrome_status_label.config(foreground=StatusIndicator.STOPPED))
            except Exception:
                self.root.after(0, lambda: self.status_vars['chrome'].set("Error"))
    
    def run(self) -> None:
        """Run the GUI main loop."""
        try:
            self.root.mainloop()
        finally:
            self.running = False


def run_gui() -> None:
    """Run the GUI application."""
    if not TKINTER_AVAILABLE:
        print("""
Error: tkinter is not available.

The GUI requires tkinter, which is typically part of the Python standard library
but may need to be installed separately on your system.

To install tkinter:
  Ubuntu/Debian:  sudo apt-get install python3-tk
  RHEL/CentOS:    sudo yum install python3-tkinter
  Fedora:         sudo dnf install python3-tkinter
  macOS:          brew install python-tk
  Arch Linux:     sudo pacman -S tk

After installing tkinter, re-run the setup:
  cd grouchocli
  ./setup.sh

Alternatively, use the TUI (Text UI) which works without tkinter:
  groucho menu
""")
        sys.exit(1)
    
    app = GrouchoGUI()
    app.run()


if __name__ == "__main__":
    run_gui()