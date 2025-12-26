#!/bin/bash
set -e

# This script prepares the examples for deployment to a separate public repository
# It switches from workspace:* dependencies to published npm package versions

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXAMPLES_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Preparing examples for deployment...${NC}\n"

# Function to update package.json dependencies
update_package_deps() {
  local package_dir=$1
  local package_name=$2
  local sdk_name=$3
  local sdk_version=${4:-"^1.0.0"}

  if [ ! -f "$package_dir/package.json" ]; then
    echo -e "${RED}Error: $package_dir/package.json not found${NC}"
    return 1
  fi

  echo -e "${YELLOW}Updating $package_name...${NC}"

  # Use perl to replace workspace:* with npm version
  perl -i -pe "s|\"workspace:\\*\"|\"$sdk_version\"|g" "$package_dir/package.json"

  echo -e "${GREEN}✓ Updated $package_name${NC}\n"
}

# Update each example package
update_package_deps "$EXAMPLES_DIR/node-backend" "node-backend" "@relay/sdk-node"
update_package_deps "$EXAMPLES_DIR/react-app" "react-app" "@relay/sdk-browser"
update_package_deps "$EXAMPLES_DIR/vue-app" "vue-app" "@relay/sdk-browser"

echo -e "${GREEN}All examples prepared for deployment!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Review the changes: git diff"
echo -e "  2. Deploy to public repo: ./scripts/deploy-to-public-repo.sh"
echo -e "  3. Revert changes: ./scripts/restore-workspace-deps.sh"
