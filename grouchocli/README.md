# Groucho CLI

A comprehensive Python CLI management tool for the "Groucho the Hunter" game.

## Overview

Groucho CLI provides both command-line and interactive TUI (Text User Interface) modes for managing the Docker-based development and production environments of the Groucho the Hunter Three.js FPS/adventure game, as well as Chrome browser management for debugging.

## Features

- 🚀 **Start/Stop/Restart** - Manage both development and production Docker environments
- 📊 **Status Monitoring** - Real-time container status, health checks, and resource usage
- 📜 **Log Streaming** - View and follow container logs with filtering options
- 🐚 **Shell Access** - Open interactive shells inside containers
- 🔨 **Build Management** - Build Docker images with cache control
- 🧹 **Cleanup** - Remove containers, images, and volumes
- 🖥️ **Interactive TUI** - Compact SSH-friendly menu interface (80x24 minimum)
- 🖼️ **GUI Mode** - tkinter-based GUI for X11 forwarding
- 🌐 **Chrome Management** - Start/stop Chrome with remote debugging for testing
- 🔧 **Profile Management** - Create, backup, and manage Chrome profiles

## Quick Start

### Installation

```bash
cd grouchocli
./setup.sh
```

This script will:
1. Check Python 3.11+ installation
2. Install `uv` if not present
3. Create a virtual environment
4. Install all dependencies
5. Make the `groucho` command available

### Usage

```bash
# Show all commands
groucho --help

# Start development environment (port 3000, hot reload)
groucho start --dev

# Start production environment (port 8080)
groucho start --prod

# Check status
groucho status

# View logs with follow
groucho logs --dev --follow

# Open interactive menu
groucho menu
```

## Commands

| Command | Description | Options |
|---------|-------------|---------|
| `start` | Start containers | `--dev`, `--prod`, `--build` |
| `stop` | Stop containers | `--dev`, `--prod` |
| `restart` | Restart containers | `--dev`, `--prod` |
| `status` | Show container/game status | `--dev`, `--prod` |
| `logs` | View logs | `--dev`, `--prod`, `--follow`, `--tail` |
| `exec` | Execute command in container | `--dev`, `--prod` |
| `shell` | Open interactive shell | `--dev`, `--prod` |
| `build` | Build Docker images | `--dev`, `--prod`, `--no-cache` |
| `clean` | Remove all resources | `--force` |
| `menu` | Launch compact TUI (SSH-friendly) | - |
| `gui` | Launch GUI (requires X11) | - |

## Chrome Management Commands

| Command | Description | Options |
|---------|-------------|---------|
| `chrome start` | Start Chrome with remote debugging | `--profile`, `--url` |
| `chrome stop` | Stop Chrome browser | `--force` |
| `chrome status` | Check Chrome status | - |
| `chrome profile create` | Create new profile | `<name>` |
| `chrome profile delete` | Delete profile | `<name>`, `--force` |
| `chrome profile reset` | Reset profile | `[name]`, `--force` |
| `chrome profile list` | List all profiles | - |
| `chrome profile backup` | Backup profile | `[name]`, `--output` |
| `chrome profile restore` | Restore from backup | `<backup_path>`, `--name` |

## TUI Commands

| Command | Description |
|---------|-------------|
| `menu` | Launch interactive TUI |

## Chrome Browser Management

The Chrome management features are designed for debugging and testing the game during development. Chrome is started with remote debugging enabled on port 9222.

### Chrome Start Options

Chrome is always started with:
- `--remote-debugging-port=9222` - For DevTools Protocol access
- `--user-data-dir=.chrome-profiles/chrome-profile-groucho` - Isolated profile
- Visible mode (never headless) - For interactive debugging
- Game URL automatically opened

### Chrome Examples

```bash
# Start Chrome with default profile
groucho chrome start

# Start with custom profile
groucho chrome start --profile testing

# Start and open specific URL
groucho chrome start --url http://localhost:8080

# Stop Chrome
groucho chrome stop

# Check Chrome status
groucho chrome status

# Create a new profile
groucho chrome profile create dev-profile

# List all profiles
groucho chrome profile list

# Backup default profile
groucho chrome profile backup

# Reset profile to default state
groucho chrome profile reset --force
```

### Chrome Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CHROME_PATH` | Path to Chrome executable | Auto-detected |
| `GROUPCHO_CHROME_DEBUG_PORT` | Remote debugging port | 9222 |
| `GROUPCHO_CHROME_PROFILES_PATH` | Profiles directory | `.chrome-profiles` |

## TUI (Text User Interface)

The TUI provides a compact, SSH-friendly interface optimized for small terminal windows (minimum 80x24).

### TUI Features

- **Simple numbered menu** - Press 1-9, 0 to select options directly
- **Arrow key navigation** - Up/down to navigate, Enter to select
- **Compact status display** - Shows Dev/Prod/Chrome status at bottom
- **Message log** - Shows last 8 messages for feedback
- **Minimal redraws** - Efficient over slow SSH connections

### TUI Usage

```bash
# Launch TUI
groucho menu

# Navigation:
#   1-9, 0    Direct menu selection
#   ↑, ↓      Navigate menu
#   Enter     Select highlighted item
#   q         Quit
```

### TUI Menu Options

| Key | Action |
|-----|--------|
| 1 | Start Development |
| 2 | Start Production |
| 3 | Stop Development |
| 4 | Stop Production |
| 5 | Restart Development |
| 6 | Restart Production |
| 7 | View Status |
| 8 | View Logs |
| 9 | Start Chrome |
| 0 | Stop Chrome |
| c | Chrome Status |
| p | List Profiles |
| b | Build Images |
| s | Shell (CLI hint) |
| x | Clean Up (CLI hint) |
| g | GUI Mode (X11) |
| q | Quit |

### SSH Usage

The TUI is optimized for SSH connections:

```bash
# Standard SSH connection
ssh user@remote-server
groucho menu

# Works well with small terminals
# Resize your terminal to 80x24 or larger for best results
```

## GUI Mode (X11 Forwarding)

The GUI provides a graphical interface using tkinter, compatible with X11 forwarding over SSH.

### GUI Requirements

- X11 server on local machine
- SSH X11 forwarding enabled
- `DISPLAY` environment variable set
- tkinter installed (Python's standard GUI library)

### Installing tkinter

The GUI requires tkinter, which is usually included with Python but may need to be installed separately:

**Ubuntu/Debian:**
```bash
sudo apt-get install python3-tk
```

**RHEL/CentOS/Fedora:**
```bash
sudo yum install python3-tkinter      # RHEL/CentOS
sudo dnf install python3-tkinter      # Fedora
```

**Arch Linux:**
```bash
sudo pacman -S tk
```

**macOS:**
```bash
brew install python-tk
```

**Windows:**
- tkinter is included with the standard Python installer from python.org
- If using a custom Python build, ensure tkinter is enabled

After installing tkinter, re-run the setup:
```bash
cd grouchocli
./setup.sh
```

### Enabling X11 Forwarding

#### Method 1: Command Line

```bash
# Connect with X11 forwarding
ssh -X user@remote-server

# For trusted connections (better performance)
ssh -Y user@remote-server
```

#### Method 2: SSH Config

Add to `~/.ssh/config`:

```
Host remote-server
    HostName remote-server.example.com
    User your-username
    ForwardX11 yes
    ForwardX11Trusted yes
```

Then connect normally:

```bash
ssh user@remote-server
```

### GUI Usage

```bash
# Check if X11 is available
echo $DISPLAY

# Should output something like:
# localhost:10.0
# or :0.0

# Launch GUI
groucho gui
```

### GUI Features

- **Tabbed interface** - Docker, Chrome, Status, Logs tabs
- **Color-coded status** - Green (running), Red (stopped), Gray (unknown)
- **Start/Stop buttons** - One-click container management
- **Log viewer** - Scrollable log display with environment selection
- **Profile management** - Create, list, and backup Chrome profiles
- **Auto-refresh** - Status updates every 5 seconds

### Troubleshooting X11

#### "X11 not available" Error

If you see:
```
Error: X11 not available
The GUI requires X11 forwarding.
```

**Solutions:**

1. **Enable X11 forwarding in SSH connection:**
   ```bash
   ssh -X user@remote-server
   ```

2. **Install X11 server on local machine:**
   - **Linux**: Usually pre-installed
   - **macOS**: Install [XQuartz](https://www.xquartz.org/)
   - **Windows**: Use MobaXterm, VcXsrv, or WSL2 with WSLg

3. **Check DISPLAY variable:**
   ```bash
   echo $DISPLAY
   # Should show something like: localhost:10.0
   ```

4. **Use TUI instead:**
   ```bash
   groucho menu
   ```

#### Slow GUI Performance

If the GUI is slow over SSH:

1. Use `-C` flag for compression:
   ```bash
   ssh -X -C user@remote-server
   ```

2. Use trusted forwarding:
   ```bash
   ssh -Y user@remote-server
   ```

3. Use the TUI instead for better performance:
   ```bash
   groucho menu
   ```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DISPLAY` | X11 display | `:0.0`, `localhost:10.0` |
| `SSH_CLIENT` | SSH connection info | (auto-set by SSH) |

## Project Structure

```
grouchocli/
├── __init__.py          # Package initialization
├── config.py            # Configuration management
├── docker_manager.py    # Docker operations
├── chrome_manager.py    # Chrome browser management
├── game_manager.py      # Game state management
├── main.py              # CLI entry point (Click)
├── tui.py               # Compact SSH-friendly TUI
├── gui.py               # tkinter GUI for X11
├── utils.py             # Utility functions
├── pyproject.toml       # UV project configuration
├── setup.sh             # Bootstrap script
└── README.md            # This file
```

## Interface Comparison

| Feature | CLI | TUI | GUI |
|---------|-----|-----|-----|
| Works over SSH | ✅ | ✅ | ✅ (with X11) |
| Terminal size | Any | 80x24 min | Any |
| Dependencies | None | None | tkinter (built-in) |
| Status display | Text | Compact | Color-coded |
| Navigation | Commands | Keys/Mouse | Mouse |
| Best for | Scripts | SSH/Remote | Local/X11 |

## Requirements

- Python 3.11+
- Docker and Docker Compose
- UV (will be installed by setup.sh if not present)
- Google Chrome or Chromium (for Chrome management features)
- X11 server (for GUI mode over SSH)
- tkinter (for GUI mode - install via system package manager)

## Environment Configuration

The CLI automatically detects your project configuration from the docker-compose files:

- **Development** (`docker-compose.yml`)
  - Port: 3000
  - Container: `groucho-the-hunter-dev`
  - Features: Hot reload, Vite dev server

- **Production** (`docker-compose.prod.yml`)
  - Port: 8080
  - Container: `groucho-the-hunter`
  - Features: nginx, optimized build

## Development

To work on the CLI itself:

```bash
cd grouchocli

# Install in editable mode
uv pip install -e ".[dev]"

# Run linting
ruff check .

# Type checking
mypy grouchocli/
```

## License

MIT License
