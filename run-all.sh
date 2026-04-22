#!/bin/bash

# Detect OS
OS="$(uname)"

# Commands to run
CMD1="npm run start:dev internal-api"
CMD2="npm run web:dev"
CMD3="npm run start:mcp"
CMD4="npm run webhook:listen"

open_new_terminal() {
  local cmd="$1"

  if [[ "$OS" == "Darwin" ]]; then
    # macOS - Terminal.app
    osascript <<EOF
tell application "Terminal"
    activate
    do script "$cmd"
end tell
EOF

  else
    # Linux - try common terminal emulators

    if command -v gnome-terminal >/dev/null 2>&1; then
      gnome-terminal -- bash -c "$cmd; exec bash"

    elif command -v konsole >/dev/null 2>&1; then
      konsole -e bash -c "$cmd; exec bash"

    elif command -v xterm >/dev/null 2>&1; then
      xterm -hold -e "$cmd"

    else
      echo "No supported terminal found (gnome-terminal, konsole, xterm)."
      exit 1
    fi
  fi
}

# Run all commands in separate terminals
open_new_terminal "$CMD1"
open_new_terminal "$CMD2"
open_new_terminal "$CMD3"
open_new_terminal "$CMD4"
