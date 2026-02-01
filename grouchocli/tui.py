"""Scrollable, dynamic TUI for Groucho CLI using curses.

This module provides a scrollable, resizable text-based user interface
that works in any terminal size (minimum 40x10). Uses curses for
terminal control, window resize handling, and mouse support.
"""

import curses
import logging
import os
import sys
from typing import List, Tuple, Optional

from grouchocli.config import get_config
from grouchocli.docker_manager import DockerManager, DockerManagerError
from grouchocli.game_manager import GameManager
from grouchocli.chrome_manager import ChromeManager, ChromeManagerError, ChromeNotFoundError
from grouchocli.utils import format_duration

logger = logging.getLogger("groucho")


class ScrollableTUI:
    """Scrollable, dynamic TUI for Groucho CLI.
    
    Features:
    - Dynamic terminal sizing (minimum 40x10)
    - Scrollable menu viewport
    - Scroll bar indicator
    - W/S and arrow key navigation
    - Mouse wheel support
    - Visual scroll indicators
    """
    
    # Menu items: (key, label, action_method)
    MAIN_MENU: List[Tuple[str, str, str]] = [
        ("1", "Start Development", "start_dev"),
        ("2", "Stop Development", "stop_dev"),
        ("3", "Start Production", "start_prod"),
        ("4", "Stop Production", "stop_prod"),
        ("5", "Restart Development", "restart_dev"),
        ("6", "Restart Production", "restart_prod"),
        ("7", "View Status", "show_status"),
        ("8", "View Logs", "show_logs"),
        ("9", "Start Chrome", "chrome_start"),
        ("0", "Stop Chrome", "chrome_stop"),
        ("c", "Chrome Status", "chrome_status"),
        ("p", "List Profiles", "chrome_profiles"),
        ("b", "Build Images", "build"),
        ("s", "Open Shell (CLI)", "shell"),
        ("x", "Clean Up", "clean"),
        ("g", "GUI Mode (X11)", "gui_mode"),
        ("q", "Quit", "quit"),
    ]
    
    # Layout constants
    HEADER_HEIGHT = 2
    SCROLL_INDICATOR_HEIGHT = 1
    SCROLLBAR_WIDTH = 10
    STATUS_HEIGHT = 3
    MIN_WIDTH = 40
    MIN_HEIGHT = 10
    
    def __init__(self) -> None:
        """Initialize the scrollable TUI."""
        self.config = get_config()
        self.docker_manager: Optional[DockerManager] = None
        self.game_manager: Optional[GameManager] = None
        self.chrome_manager: Optional[ChromeManager] = None
        self.messages: List[str] = []
        self.running = True
        
        # Scrollable menu state
        self.selected_index = 0
        self.scroll_offset = 0
        self.visible_items = 0
        
        # Terminal dimensions
        self.term_height = 0
        self.term_width = 0
        self.menu_height = 0
        
        # Curses windows
        self.stdscr = None
        self.header_win = None
        self.menu_win = None
        self.scrollbar_win = None
        self.scroll_top_win = None
        self.scroll_bottom_win = None
        self.status_win = None
        
        # Initialize managers
        self._init_managers()
    
    def _init_managers(self) -> None:
        """Initialize Docker and Chrome managers."""
        try:
            self.docker_manager = DockerManager(self.config)
            self.game_manager = GameManager(self.config, self.docker_manager)
        except Exception as e:
            self.add_message(f"Docker not available: {e}")
            self.docker_manager = None
            self.game_manager = None
        
        try:
            self.chrome_manager = ChromeManager(self.config)
        except ChromeNotFoundError:
            self.add_message("Chrome not found - Chrome management unavailable")
            self.chrome_manager = None
        except Exception as e:
            self.add_message(f"Chrome error: {e}")
            self.chrome_manager = None
    
    def add_message(self, message: str) -> None:
        """Add a message to the output buffer."""
        self.messages.append(message)
        if len(self.messages) > 50:
            self.messages.pop(0)
    
    def clear_messages(self) -> None:
        """Clear all messages."""
        self.messages = []
    
    def _get_status_line(self) -> str:
        """Get compact status line."""
        parts = []
        
        # Dev status
        if self.docker_manager:
            try:
                dev_info = self.docker_manager.get_status(dev=True)
                if dev_info.get("running"):
                    parts.append("Dev:RUN")
                elif dev_info.get("exists"):
                    parts.append("Dev:STOP")
                else:
                    parts.append("Dev:--")
            except Exception:
                parts.append("Dev:ERR")
        else:
            parts.append("Dev:NA")
        
        # Prod status
        if self.docker_manager:
            try:
                prod_info = self.docker_manager.get_status(dev=False)
                if prod_info.get("running"):
                    parts.append("Prod:RUN")
                elif prod_info.get("exists"):
                    parts.append("Prod:STOP")
                else:
                    parts.append("Prod:--")
            except Exception:
                parts.append("Prod:ERR")
        else:
            parts.append("Prod:NA")
        
        # Chrome status
        if self.chrome_manager:
            try:
                chrome_info = self.chrome_manager.get_status()
                if chrome_info.get("running"):
                    parts.append("Chr:RUN")
                else:
                    parts.append("Chr:STOP")
            except Exception:
                parts.append("Chr:ERR")
        else:
            parts.append("Chr:NA")
        
        return " | ".join(parts)
    
    def _calculate_layout(self) -> None:
        """Calculate layout dimensions based on terminal size."""
        self.term_height, self.term_width = self.stdscr.getmaxyx()
        
        # Enforce minimum size
        self.term_width = max(self.term_width, self.MIN_WIDTH)
        self.term_height = max(self.term_height, self.MIN_HEIGHT)
        
        # Calculate menu viewport height
        # Header (2) + Top indicator (1) + Menu items + Bottom indicator (1) + Status (3)
        self.menu_height = self.term_height - (
            self.HEADER_HEIGHT + 
            self.SCROLL_INDICATOR_HEIGHT + 
            self.SCROLL_INDICATOR_HEIGHT + 
            self.STATUS_HEIGHT
        )
        self.menu_height = max(self.menu_height, 1)
        
        # Calculate visible items
        self.visible_items = self.menu_height
    
    def _setup_windows(self) -> None:
        """Create and position curses windows."""
        # Recalculate layout based on current terminal size
        self._calculate_layout()
        
        # Header window (top 2 lines)
        self.header_win = curses.newwin(
            self.HEADER_HEIGHT, 
            self.term_width, 
            0, 
            0
        )
        
        # Top scroll indicator
        self.scroll_top_win = curses.newwin(
            self.SCROLL_INDICATOR_HEIGHT,
            self.term_width - self.SCROLLBAR_WIDTH,
            self.HEADER_HEIGHT,
            0
        )
        
        # Menu viewport window
        self.menu_win = curses.newwin(
            self.menu_height,
            self.term_width - self.SCROLLBAR_WIDTH,
            self.HEADER_HEIGHT + self.SCROLL_INDICATOR_HEIGHT,
            0
        )
        
        # Bottom scroll indicator
        scroll_bottom_y = self.HEADER_HEIGHT + self.SCROLL_INDICATOR_HEIGHT + self.menu_height
        self.scroll_bottom_win = curses.newwin(
            self.SCROLL_INDICATOR_HEIGHT,
            self.term_width - self.SCROLLBAR_WIDTH,
            scroll_bottom_y,
            0
        )
        
        # Scroll bar window (right side)
        self.scrollbar_win = curses.newwin(
            self.menu_height + 2,  # Include space for indicators
            self.SCROLLBAR_WIDTH,
            self.HEADER_HEIGHT,
            self.term_width - self.SCROLLBAR_WIDTH
        )
        
        # Status window (bottom)
        status_y = self.term_height - self.STATUS_HEIGHT
        self.status_win = curses.newwin(
            self.STATUS_HEIGHT,
            self.term_width,
            status_y,
            0
        )
    
    def _draw_header(self) -> None:
        """Draw the header with title and scroll indicator."""
        self.header_win.clear()
        
        title = "Groucho the Hunter CLI"
        scroll_hint = "[▼]" if len(self.MAIN_MENU) > self.visible_items else "[ ]"
        
        # Draw title line
        header_line = f" {title}"
        header_line += " " * (self.term_width - len(header_line) - len(scroll_hint) - 1)
        header_line += scroll_hint
        
        try:
            self.header_win.addstr(0, 0, header_line[:self.term_width-1])
        except curses.error:
            pass
        
        # Draw separator line
        sep_line = "─" * (self.term_width - 1)
        try:
            self.header_win.addstr(1, 0, sep_line[:self.term_width-1])
        except curses.error:
            pass
        
        self.header_win.refresh()
    
    def _draw_scroll_indicators(self) -> None:
        """Draw top and bottom scroll indicators."""
        # Top indicator
        self.scroll_top_win.clear()
        if self.scroll_offset > 0:
            indicator = "▲ more above"
            try:
                self.scroll_top_win.addstr(0, 2, indicator, curses.A_DIM)
            except curses.error:
                pass
        self.scroll_top_win.refresh()
        
        # Bottom indicator
        self.scroll_bottom_win.clear()
        max_scroll = max(0, len(self.MAIN_MENU) - self.visible_items)
        if self.scroll_offset < max_scroll:
            indicator = "▼ more below"
            try:
                self.scroll_bottom_win.addstr(0, 2, indicator, curses.A_DIM)
            except curses.error:
                pass
        self.scroll_bottom_win.refresh()
    
    def _draw_menu(self) -> None:
        """Draw the scrollable menu viewport."""
        self.menu_win.clear()
        
        # Calculate visible range
        start_idx = self.scroll_offset
        end_idx = min(start_idx + self.visible_items, len(self.MAIN_MENU))
        
        for row, idx in enumerate(range(start_idx, end_idx)):
            key, label, action = self.MAIN_MENU[idx]
            
            # Format menu item
            item_text = f"{key}. {label}"
            
            # Truncate if too long
            max_width = self.term_width - self.SCROLLBAR_WIDTH - 4
            if len(item_text) > max_width:
                item_text = item_text[:max_width-3] + "..."
            
            # Highlight selected item
            if idx == self.selected_index:
                attrs = curses.A_REVERSE
                prefix = "> "
            else:
                attrs = curses.A_NORMAL
                prefix = "  "
            
            try:
                self.menu_win.addstr(row, 0, prefix + item_text, attrs)
            except curses.error:
                pass
        
        self.menu_win.refresh()
    
    def _draw_scrollbar(self) -> None:
        """Draw scroll bar with position indicator."""
        self.scrollbar_win.clear()
        
        total_items = len(self.MAIN_MENU)
        if total_items <= self.visible_items:
            # No scrolling needed
            self.scrollbar_win.refresh()
            return
        
        # Calculate scroll bar dimensions
        scrollbar_height = self.menu_height
        
        # Draw scroll track
        for i in range(scrollbar_height):
            try:
                self.scrollbar_win.addstr(i, 2, "│")
            except curses.error:
                pass
        
        # Calculate thumb position and size
        thumb_size = max(1, int((self.visible_items / total_items) * scrollbar_height))
        max_scroll = max(0, total_items - self.visible_items)
        if max_scroll > 0:
            thumb_pos = int((self.scroll_offset / max_scroll) * (scrollbar_height - thumb_size))
        else:
            thumb_pos = 0
        
        # Draw thumb
        for i in range(thumb_size):
            row = thumb_pos + i
            if 0 <= row < scrollbar_height:
                try:
                    self.scrollbar_win.addstr(row, 2, "█")
                except curses.error:
                    pass
        
        # Draw position counter
        pos_text = f"{self.selected_index + 1}/{total_items}"
        try:
            self.scrollbar_win.addstr(scrollbar_height + 1, 0, pos_text)
        except curses.error:
            pass
        
        self.scrollbar_win.refresh()
    
    def _draw_status(self) -> None:
        """Draw status bar at the bottom."""
        self.status_win.clear()
        
        status = self._get_status_line()
        
        # Separator line
        sep_line = "─" * (self.term_width - 1)
        try:
            self.status_win.addstr(0, 0, sep_line[:self.term_width-1])
        except curses.error:
            pass
        
        # Status line
        try:
            self.status_win.addstr(1, 1, status[:self.term_width-2])
        except curses.error:
            pass
        
        # Help line
        help_text = "↑/↓/W/S:Navigate | Enter:Select | q:Quit"
        try:
            self.status_win.addstr(2, 1, help_text[:self.term_width-2], curses.A_DIM)
        except curses.error:
            pass
        
        self.status_win.refresh()
    
    def _draw_all(self) -> None:
        """Draw all UI components."""
        # Clear and refresh main screen first
        self.stdscr.clear()
        self.stdscr.refresh()
        
        # Draw all subwindows
        self._draw_header()
        self._draw_scroll_indicators()
        self._draw_menu()
        self._draw_scrollbar()
        self._draw_status()
        
        # Push all updates to the screen
        curses.doupdate()
    
    def _ensure_selection_visible(self) -> None:
        """Adjust scroll offset to keep selected item visible."""
        # If selection is above viewport, scroll up
        if self.selected_index < self.scroll_offset:
            self.scroll_offset = self.selected_index
        
        # If selection is below viewport, scroll down
        elif self.selected_index >= self.scroll_offset + self.visible_items:
            self.scroll_offset = self.selected_index - self.visible_items + 1
        
        # Clamp scroll offset
        max_scroll = max(0, len(self.MAIN_MENU) - self.visible_items)
        self.scroll_offset = max(0, min(self.scroll_offset, max_scroll))
    
    def _clamp_selection(self) -> None:
        """Ensure selection is within bounds."""
        self.selected_index = max(0, min(self.selected_index, len(self.MAIN_MENU) - 1))
        self._ensure_selection_visible()
    
    def _handle_resize(self) -> None:
        """Handle terminal resize signal."""
        curses.endwin()
        self.stdscr.refresh()
        self._setup_windows()
        self._ensure_selection_visible()
        self._draw_all()
    
    def _select_by_key(self, key: str) -> bool:
        """Select menu item by its key character."""
        for i, (k, _, _) in enumerate(self.MAIN_MENU):
            if k == key:
                self.selected_index = i
                self._clamp_selection()
                self._execute_action_by_index(i)
                return True
        return False
    
    def _execute_action_by_index(self, index: int) -> None:
        """Execute action at given menu index."""
        if 0 <= index < len(self.MAIN_MENU):
            _, _, action = self.MAIN_MENU[index]
            self._execute_action(action)
    
    def _execute_action(self, action: str) -> None:
        """Execute a menu action."""
        method = getattr(self, f"action_{action}", None)
        if method:
            try:
                method()
            except Exception as e:
                self.add_message(f"Error: {e}")
    
    def run_curses(self, stdscr) -> None:
        """Main curses application loop."""
        self.stdscr = stdscr
        
        # Setup curses
        curses.curs_set(0)  # Hide cursor
        self.stdscr.timeout(100)  # Non-blocking input with 100ms timeout
        
        # Enable mouse support
        curses.mousemask(curses.ALL_MOUSE_EVENTS | curses.REPORT_MOUSE_POSITION)
        
        # Setup colors if available
        if curses.has_colors():
            curses.start_color()
            curses.use_default_colors()
        
        # Setup windows
        self._setup_windows()
        
        # Initial clear and refresh of main screen
        self.stdscr.clear()
        self.stdscr.refresh()
        
        # Initial draw
        self.add_message("Welcome to Groucho CLI!")
        self.add_message("Press 'q' to quit, arrows/W/S to navigate")
        self._draw_all()
        
        # Main loop
        while self.running:
            try:
                ch = self.stdscr.getch()
                
                if ch == -1:
                    # Timeout - just continue
                    continue
                elif ch == ord('q') or ch == ord('Q'):
                    self.action_quit()
                elif ch == curses.KEY_UP or ch == ord('w') or ch == ord('W'):
                    self.selected_index = max(0, self.selected_index - 1)
                    self._clamp_selection()
                elif ch == curses.KEY_DOWN or ch == ord('s') or ch == ord('S'):
                    self.selected_index = min(len(self.MAIN_MENU) - 1, self.selected_index + 1)
                    self._clamp_selection()
                elif ch == curses.KEY_PPAGE:  # Page Up
                    self.selected_index = max(0, self.selected_index - self.visible_items)
                    self._clamp_selection()
                elif ch == curses.KEY_NPAGE:  # Page Down
                    self.selected_index = min(len(self.MAIN_MENU) - 1, self.selected_index + self.visible_items)
                    self._clamp_selection()
                elif ch == curses.KEY_HOME:
                    self.selected_index = 0
                    self._clamp_selection()
                elif ch == curses.KEY_END:
                    self.selected_index = len(self.MAIN_MENU) - 1
                    self._clamp_selection()
                elif ch == 10 or ch == 13 or ch == curses.KEY_ENTER:  # Enter
                    self._execute_action_by_index(self.selected_index)
                elif ch == curses.KEY_RESIZE:
                    self._handle_resize()
                elif ch == curses.KEY_MOUSE:
                    try:
                        _, mx, my, _, bstate = curses.getmouse()
                        # Handle mouse wheel
                        if bstate & curses.BUTTON4_PRESSED:  # Scroll up
                            self.selected_index = max(0, self.selected_index - 1)
                            self._clamp_selection()
                        elif bstate & curses.BUTTON5_PRESSED:  # Scroll down
                            self.selected_index = min(len(self.MAIN_MENU) - 1, self.selected_index + 1)
                            self._clamp_selection()
                    except curses.error:
                        pass
                elif 32 <= ch <= 126:  # Printable characters
                    key_char = chr(ch)
                    if key_char.isdigit() or key_char in 'cbpsxgq':
                        self._select_by_key(key_char)
                
                # Redraw UI
                self._draw_all()
                
            except KeyboardInterrupt:
                self.running = False
            except curses.error:
                pass
    
    def run(self) -> None:
        """Run the TUI."""
        curses.wrapper(self.run_curses)
    
    # Action methods
    def action_start_dev(self) -> None:
        """Start development environment."""
        if not self.docker_manager:
            self.add_message("Docker not available")
            return
        
        self.add_message("Starting development...")
        try:
            self.docker_manager.start(dev=True)
            self.add_message("Development started successfully")
            self.add_message(f"URL: {self.config.get_url(dev=True)}")
        except DockerManagerError as e:
            self.add_message(f"Error: {e}")
    
    def action_start_prod(self) -> None:
        """Start production environment."""
        if not self.docker_manager:
            self.add_message("Docker not available")
            return
        
        self.add_message("Starting production...")
        try:
            self.docker_manager.start(dev=False)
            self.add_message("Production started successfully")
            self.add_message(f"URL: {self.config.get_url(dev=False)}")
        except DockerManagerError as e:
            self.add_message(f"Error: {e}")
    
    def action_stop_dev(self) -> None:
        """Stop development environment."""
        if not self.docker_manager:
            self.add_message("Docker not available")
            return
        
        self.add_message("Stopping development...")
        try:
            self.docker_manager.stop(dev=True)
            self.add_message("Development stopped")
        except DockerManagerError as e:
            self.add_message(f"Error: {e}")
    
    def action_stop_prod(self) -> None:
        """Stop production environment."""
        if not self.docker_manager:
            self.add_message("Docker not available")
            return
        
        self.add_message("Stopping production...")
        try:
            self.docker_manager.stop(dev=False)
            self.add_message("Production stopped")
        except DockerManagerError as e:
            self.add_message(f"Error: {e}")
    
    def action_restart_dev(self) -> None:
        """Restart development environment."""
        if not self.docker_manager:
            self.add_message("Docker not available")
            return
        
        self.add_message("Restarting development...")
        try:
            self.docker_manager.restart(dev=True)
            self.add_message("Development restarted")
        except DockerManagerError as e:
            self.add_message(f"Error: {e}")
    
    def action_restart_prod(self) -> None:
        """Restart production environment."""
        if not self.docker_manager:
            self.add_message("Docker not available")
            return
        
        self.add_message("Restarting production...")
        try:
            self.docker_manager.restart(dev=False)
            self.add_message("Production restarted")
        except DockerManagerError as e:
            self.add_message(f"Error: {e}")
    
    def action_show_status(self) -> None:
        """Show status of environments."""
        if not self.game_manager:
            self.add_message("Game manager not available")
            return
        
        self.clear_messages()
        for dev, name in [(True, "Dev"), (False, "Prod")]:
            try:
                info = self.game_manager.get_game_info(dev=dev)
                container = info.get("container", {})
                status = "RUN" if container.get("running") else "STOP"
                self.add_message(f"{name}: {status}")
            except Exception as e:
                self.add_message(f"{name}: Error - {e}")
    
    def action_show_logs(self) -> None:
        """Show recent logs."""
        if not self.docker_manager:
            self.add_message("Docker not available")
            return
        
        self.clear_messages()
        self.add_message("Fetching logs (last 10 lines)...")
        
        for dev, name in [(True, "Dev"), (False, "Prod")]:
            try:
                lines = list(self.docker_manager.stream_logs(dev=dev, follow=False, tail=10))
                self.add_message(f"--- {name} ---")
                for line in lines[-3:]:
                    self.add_message(line[:60])
            except Exception as e:
                self.add_message(f"{name}: {e}")
    
    def action_chrome_start(self) -> None:
        """Start Chrome browser."""
        if not self.chrome_manager:
            self.add_message("Chrome not available")
            return
        
        self.add_message("Starting Chrome...")
        try:
            self.chrome_manager.start()
            self.add_message("Chrome started")
        except ChromeManagerError as e:
            self.add_message(f"Error: {e}")
    
    def action_chrome_stop(self) -> None:
        """Stop Chrome browser."""
        if not self.chrome_manager:
            self.add_message("Chrome not available")
            return
        
        self.add_message("Stopping Chrome...")
        try:
            self.chrome_manager.stop()
            self.add_message("Chrome stopped")
        except ChromeManagerError as e:
            self.add_message(f"Error: {e}")
    
    def action_chrome_status(self) -> None:
        """Show Chrome status."""
        if not self.chrome_manager:
            self.add_message("Chrome not available")
            return
        
        try:
            status = self.chrome_manager.get_status()
            state = "RUN" if status["running"] else "STOP"
            self.add_message(f"Chrome: {state} (port {status['port']})")
        except Exception as e:
            self.add_message(f"Error: {e}")
    
    def action_chrome_profiles(self) -> None:
        """List Chrome profiles."""
        if not self.chrome_manager:
            self.add_message("Chrome not available")
            return
        
        try:
            profiles = self.chrome_manager.list_profiles()
            self.clear_messages()
            self.add_message(f"Profiles: {len(profiles)}")
            for profile in profiles[:5]:
                self.add_message(f"  - {profile['name']}")
        except Exception as e:
            self.add_message(f"Error: {e}")
    
    def action_build(self) -> None:
        """Build Docker images."""
        if not self.docker_manager:
            self.add_message("Docker not available")
            return
        
        self.add_message("Building images...")
        for dev, name in [(True, "dev"), (False, "prod")]:
            try:
                self.add_message(f"Building {name}...")
                self.docker_manager.build(dev=dev)
                self.add_message(f"{name} build complete")
            except Exception as e:
                self.add_message(f"{name} failed: {e}")
    
    def action_shell(self) -> None:
        """Open shell hint."""
        self.add_message("Use: groucho shell --dev or --prod")
    
    def action_clean(self) -> None:
        """Clean up hint."""
        self.add_message("Use: groucho clean --force")
    
    def action_gui_mode(self) -> None:
        """Launch GUI mode."""
        if not os.environ.get("DISPLAY"):
            self.add_message("X11 not available (DISPLAY not set)")
            self.add_message("Enable X11 forwarding: ssh -X user@host")
            return
        
        try:
            self.add_message("Launching GUI mode...")
            from grouchocli.gui import run_gui
            self.running = False
            curses.endwin()
            run_gui()
        except Exception as e:
            self.add_message(f"GUI error: {e}")
    
    def action_quit(self) -> None:
        """Exit the application."""
        self.running = False


class GrouchoApp:
    """Compatibility wrapper for existing code."""
    
    def __init__(self) -> None:
        """Initialize the application."""
        self.tui = ScrollableTUI()
    
    def run(self) -> None:
        """Run the application."""
        try:
            self.tui.run()
        except KeyboardInterrupt:
            print("\n\nExiting...")


if __name__ == "__main__":
    app = GrouchoApp()
    app.run()
