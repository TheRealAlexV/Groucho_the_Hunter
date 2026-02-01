#!/bin/bash
# =============================================================================
# Groucho CLI Setup Script
# =============================================================================
# Bootstrap script to install and configure the Groucho CLI tool.
# This script checks prerequisites, installs uv if needed, creates a
# virtual environment, and makes the 'groucho' command available.
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="Groucho CLI"
MIN_PYTHON_VERSION="3.11"
REQUIRED_PYTHON_MAJOR=3
REQUIRED_PYTHON_MINOR=11
VENV_DIR="$SCRIPT_DIR/.venv"

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                     Groucho CLI Setup                         ║"
    echo "║         Management tool for Groucho the Hunter                ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_step() {
    echo -e "${CYAN}→ $1${NC}"
}

# =============================================================================
# Check Python Version
# =============================================================================

check_python() {
    print_step "Checking Python installation..."
    
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        print_error "Python is not installed. Please install Python $MIN_PYTHON_VERSION or higher."
        echo "   Visit: https://www.python.org/downloads/"
        exit 1
    fi
    
    # Get Python version
    PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
    PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
    PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)
    
    print_info "Found Python $PYTHON_VERSION"
    
    # Check version compatibility
    if [ "$PYTHON_MAJOR" -lt "$REQUIRED_PYTHON_MAJOR" ] || \
       ([ "$PYTHON_MAJOR" -eq "$REQUIRED_PYTHON_MAJOR" ] && [ "$PYTHON_MINOR" -lt "$REQUIRED_PYTHON_MINOR" ]); then
        print_error "Python $MIN_PYTHON_VERSION or higher is required (found $PYTHON_VERSION)"
        echo "   Please upgrade your Python installation."
        exit 1
    fi
    
    print_success "Python version $PYTHON_VERSION is compatible"
}

# =============================================================================
# Install UV
# =============================================================================

install_uv() {
    print_step "Checking uv installation..."
    
    if command -v uv &> /dev/null; then
        UV_VERSION=$(uv --version)
        print_success "uv is already installed ($UV_VERSION)"
        return 0
    fi
    
    print_info "uv not found. Installing uv..."
    
    # Try to install uv using the official installer
    if command -v curl &> /dev/null; then
        curl -LsSf https://astral.sh/uv/install.sh | sh
    elif command -v wget &> /dev/null; then
        wget -qO- https://astral.sh/uv/install.sh | sh
    else
        print_error "Neither curl nor wget is available. Please install uv manually:"
        echo "   https://github.com/astral-sh/uv#installation"
        exit 1
    fi
    
    # Add to PATH for this session
    export PATH="$HOME/.cargo/bin:$PATH"
    
    if command -v uv &> /dev/null; then
        print_success "uv installed successfully"
    else
        print_error "uv installation failed. Please install manually:"
        echo "   https://github.com/astral-sh/uv#installation"
        exit 1
    fi
}

# =============================================================================
# Check tkinter Availability
# =============================================================================

check_tkinter() {
    print_step "Checking tkinter availability..."
    
    if python3 -c "import tkinter" 2>/dev/null; then
        print_success "tkinter is available (GUI mode will work)"
        return 0
    else
        print_warning "tkinter not found in system Python"
        print_info "GUI mode will not be available. To enable GUI:"
        print_info "  Ubuntu/Debian: sudo apt-get install python3-tk"
        print_info "  RHEL/CentOS:   sudo yum install python3-tkinter"
        print_info "  macOS:         brew install python-tk"
        print_info ""
        print_info "TUI mode will still work fine: groucho menu"
        return 1
    fi
}

# =============================================================================
# Setup Virtual Environment
# =============================================================================

setup_venv() {
    print_step "Setting up virtual environment..."
    
    cd "$SCRIPT_DIR"
    
    # Remove existing venv if it exists but is broken
    if [ -d "$VENV_DIR" ]; then
        if [ ! -f "$VENV_DIR/bin/python" ] && [ ! -f "$VENV_DIR/Scripts/python.exe" ]; then
            print_warning "Existing virtual environment appears broken. Removing..."
            rm -rf "$VENV_DIR"
        fi
    fi
    
    # Create virtual environment using uv with system site packages
    # This allows the venv to access system tkinter if available
    if [ ! -d "$VENV_DIR" ]; then
        uv venv "$VENV_DIR" --system-site-packages
        print_success "Virtual environment created (with system site packages)"
    else
        print_info "Virtual environment already exists"
    fi
    
    # Determine python path in venv
    if [ -f "$VENV_DIR/bin/python" ]; then
        VENV_PYTHON="$VENV_DIR/bin/python"
    elif [ -f "$VENV_DIR/Scripts/python.exe" ]; then
        VENV_PYTHON="$VENV_DIR/Scripts/python.exe"
    else
        print_error "Could not find Python in virtual environment"
        exit 1
    fi
    
    print_success "Using Python from virtual environment"
    
    # Check if tkinter is available in venv
    if $VENV_PYTHON -c "import tkinter" 2>/dev/null; then
        print_success "tkinter available in virtual environment"
    else
        print_warning "tkinter not available in virtual environment"
        print_info "GUI mode will not work. Install system tkinter and re-run setup."
    fi
}

# =============================================================================
# Install Dependencies
# =============================================================================

install_dependencies() {
    print_step "Installing dependencies..."
    
    cd "$SCRIPT_DIR"
    
    # Use uv to install dependencies
    uv pip install -e "."
    
    print_success "Dependencies installed"
}

# =============================================================================
# Make Command Available
# =============================================================================

setup_command() {
    print_step "Setting up 'groucho' command..."
    
    # Check if the command is already available
    if command -v groucho &> /dev/null; then
        print_info "'groucho' command is already available"
        return 0
    fi
    
    # Suggest adding to PATH
    INSTALL_PATH="$HOME/.local/bin"
    
    # Create symlink or wrapper script
    if [ ! -d "$INSTALL_PATH" ]; then
        mkdir -p "$INSTALL_PATH"
    fi
    
    # Create wrapper script
    WRAPPER_SCRIPT="$INSTALL_PATH/groucho"
    cat > "$WRAPPER_SCRIPT" << EOF
#!/bin/bash
# Groucho CLI wrapper script
# Auto-generated by setup.sh

VENV_DIR="$VENV_DIR"
SCRIPT_DIR="$SCRIPT_DIR"

# Activate virtual environment and run
source "\$VENV_DIR/bin/activate" 2>/dev/null || source "\$VENV_DIR/Scripts/activate" 2>/dev/null
exec python -m grouchocli.main "\$@"
EOF
    
    chmod +x "$WRAPPER_SCRIPT"
    
    # Check if ~/.local/bin is in PATH
    if [[ ":$PATH:" != *":$INSTALL_PATH:"* ]]; then
        print_warning "$INSTALL_PATH is not in your PATH"
        echo ""
        echo -e "${YELLOW}Add the following to your shell profile (~/.bashrc, ~/.zshrc, etc.):${NC}"
        echo ""
        echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
        echo ""
        echo -e "${YELLOW}Then run: source ~/.bashrc (or your shell's config file)${NC}"
        echo ""
    else
        print_success "'groucho' command installed to $INSTALL_PATH"
    fi
    
    # Also create alias/activation for current session
    alias groucho="$VENV_PYTHON -m grouchocli.main"
}

# =============================================================================
# Print Usage
# =============================================================================

print_usage() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    Setup Complete! 🎉                         ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Groucho CLI has been successfully installed!${NC}"
    echo ""
    echo -e "${BLUE}Usage:${NC}"
    echo ""
    echo "  groucho --help          # Show all available commands"
    echo "  groucho menu            # Launch interactive TUI (SSH-friendly)"
    echo "  groucho gui             # Launch GUI (requires X11 + tkinter)"
    echo ""
    echo "  groucho start --dev     # Start development environment (port 3000)"
    echo "  groucho start --prod    # Start production environment (port 8080)"
    echo "  groucho status          # Check environment status"
    echo "  groucho logs --dev -f   # Follow development logs"
    echo ""
    echo "  groucho stop --dev      # Stop development environment"
    echo "  groucho stop --prod     # Stop production environment"
    echo ""
    echo -e "${BLUE}Quick Start:${NC}"
    echo ""
    echo "  1. Start the development server:  groucho start --dev"
    echo "  2. Open your browser to:          http://localhost:3000"
    echo "  3. View logs:                     groucho logs --dev -f"
    echo ""
    echo -e "${BLUE}Interface Options:${NC}"
    echo ""
    echo "  • TUI (Text UI):  groucho menu    # Best for SSH, small terminals"
    echo "  • GUI (Graphical): groucho gui    # Requires X11 forwarding"
    echo ""
    echo -e "${YELLOW}Note:${NC} If 'groucho' command is not found, make sure ~/.local/bin is in your PATH"
    echo ""
}

# =============================================================================
# Main
# =============================================================================

main() {
    print_header
    
    echo "This script will set up Groucho CLI on your system."
    echo ""
    
    check_python
    check_tkinter
    install_uv
    setup_venv
    install_dependencies
    setup_command
    
    print_usage
    
    print_success "Setup complete! You can now use the 'groucho' command."
}

# Run main function
main "$@"
