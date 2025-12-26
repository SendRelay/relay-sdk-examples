#!/bin/bash
set -e

# This script restores workspace:* dependencies after deployment
# Run this after deploying to the public repository

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXAMPLES_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Restoring workspace dependencies...${NC}\n"

# Function to restore workspace dependencies
restore_package_deps() {
  local package_dir=$1
  local package_name=$2
  local sdk_name=$3

  echo -e "${YELLOW}Restoring $package_name...${NC}"

  # Use perl to replace npm version with workspace:*
  perl -i -pe 's|"\^[0-9]+\.[0-9]+\.[0-9]+"|"workspace:*"|g' "$package_dir/package.json"

  echo -e "${GREEN}✓ Restored $package_name${NC}\n"
}

# Restore each example package
restore_package_deps "$EXAMPLES_DIR/node-backend" "node-backend" "@relay/sdk-node"
restore_package_deps "$EXAMPLES_DIR/react-app" "react-app" "@relay/sdk-browser"
restore_package_deps "$EXAMPLES_DIR/vue-app" "vue-app" "@relay/sdk-browser"

echo -e "${GREEN}All workspace dependencies restored!${NC}"
echo -e "${YELLOW}You can now continue local development with workspace packages.${NC}"
