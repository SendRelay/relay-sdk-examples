#!/bin/bash
set -e

# This script deploys the examples directory to a separate public Git repository
# It uses git subtree push to maintain the examples as a standalone repository

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXAMPLES_DIR="$(dirname "$SCRIPT_DIR")"
MONOREPO_ROOT="$(cd "$EXAMPLES_DIR/../../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PUBLIC_REPO_URL="${PUBLIC_REPO_URL:-git@github.com:relay/relay-examples.git}"
BRANCH="${BRANCH:-main}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Relay Examples - Public Repository Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check if we're in a git repository
cd "$MONOREPO_ROOT"
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}Error: Not in a git repository${NC}"
  exit 1
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo -e "${RED}Error: You have uncommitted changes${NC}"
  echo -e "${YELLOW}Please commit or stash your changes before deploying${NC}"
  exit 1
fi

# Verify examples have been prepared
echo -e "${YELLOW}Verifying examples are prepared for deployment...${NC}"
if grep -q "workspace:\*" "$EXAMPLES_DIR/node-backend/package.json"; then
  echo -e "${RED}Error: Examples still use workspace:* dependencies${NC}"
  echo -e "${YELLOW}Run ./scripts/prepare-for-deploy.sh first${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Examples are prepared${NC}\n"

# Display configuration
echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Public repo: ${BLUE}$PUBLIC_REPO_URL${NC}"
echo -e "  Branch: ${BLUE}$BRANCH${NC}"
echo -e "  Subtree path: ${BLUE}packages/examples${NC}\n"

# Confirm deployment
read -p "$(echo -e ${YELLOW}Deploy to public repository? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Deployment cancelled${NC}"
  exit 0
fi

# Add remote if it doesn't exist
if ! git remote get-url examples-public > /dev/null 2>&1; then
  echo -e "${YELLOW}Adding remote 'examples-public'...${NC}"
  git remote add examples-public "$PUBLIC_REPO_URL"
  echo -e "${GREEN}✓ Remote added${NC}\n"
else
  echo -e "${GREEN}✓ Remote 'examples-public' already exists${NC}\n"
fi

# Deploy using git subtree push
echo -e "${YELLOW}Deploying to public repository...${NC}"
echo -e "${BLUE}This may take a few minutes...${NC}\n"

git subtree push --prefix=packages/examples examples-public "$BRANCH"

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Deployment successful!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Verify deployment: ${BLUE}$PUBLIC_REPO_URL${NC}"
echo -e "  2. Restore workspace deps: ${BLUE}./scripts/restore-workspace-deps.sh${NC}"

echo -e "\n${YELLOW}Note:${NC} Remember to restore workspace dependencies before continuing local development"
