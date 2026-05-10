#!/bin/bash

# Makefile Parser Utility
# Provides functions to parse and validate Makefile targets

# List all targets in a Makefile
# Usage: list_makefile_targets <makefile_path>
list_makefile_targets() {
    local makefile="$1"

    if [[ ! -f "$makefile" ]]; then
        echo "Error: Makefile not found at $makefile" >&2
        return 1
    fi

    # Extract target names (lines ending with :)
    # Exclude special targets, comments, and variable assignments
    grep -E "^[a-zA-Z0-9_-]+:" "$makefile" | \
        cut -d: -f1 | \
        grep -v "^\." | \
        sort -u
}

# Get the command(s) for a specific Makefile target
# Usage: get_makefile_command <makefile_path> <target_name>
get_makefile_command() {
    local makefile="$1"
    local target="$2"

    if [[ ! -f "$makefile" ]]; then
        echo "Error: Makefile not found at $makefile" >&2
        return 1
    fi

    # Extract commands for the target
    awk -v target="$target:" '
        $0 ~ "^" target {
            found=1
            next
        }
        found && /^\t/ {
            print substr($0, 2)
            next
        }
        found && !/^\t/ {
            exit
        }
    ' "$makefile"
}

# Check if a target exists in a Makefile
# Usage: target_exists <makefile_path> <target_name>
target_exists() {
    local makefile="$1"
    local target="$2"

    if [[ ! -f "$makefile" ]]; then
        return 1
    fi

    grep -qE "^${target}:" "$makefile"
}

# Validate that required targets exist in a Makefile
# Usage: validate_makefile_targets <makefile_path> <target1> [target2] [...]
validate_makefile_targets() {
    local makefile="$1"
    shift
    local missing_targets=()

    for target in "$@"; do
        if ! target_exists "$makefile" "$target"; then
            missing_targets+=("$target")
        fi
    done

    if [[ ${#missing_targets[@]} -gt 0 ]]; then
        echo "Error: Missing required targets: ${missing_targets[*]}" >&2
        return 1
    fi

    return 0
}
