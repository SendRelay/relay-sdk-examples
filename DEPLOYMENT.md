# Examples Deployment Guide

This guide explains how to deploy the Relay SDK examples to a separate public repository while keeping the main monorepo private.

## Overview

The examples live in the monorepo at `packages/examples/` but are deployed to a separate public Git repository. This allows:

- ✅ **Private monorepo**: Internal packages (@relay/core, @relay/functions, etc.) remain private
- ✅ **Public examples**: Developers can view and clone working examples
- ✅ **Local development**: Examples use `workspace:*` to reference local SDKs during development
- ✅ **Production deployment**: Examples use published npm packages in the public repository

## Architecture

```
relay/mvp/                              (Private monorepo)
└── packages/
    ├── sdk-node/                       (Published to npm)
    ├── sdk-browser/                    (Published to npm)
    ├── core/                           (Private)
    ├── functions/                      (Private)
    └── examples/                       (Deployed to public repo)
        ├── node-backend/
        ├── react-app/
        ├── vue-app/
        └── scripts/
```

## Local Development

During local development, examples use `workspace:*` dependencies to reference the local SDKs:

```json
{
  "dependencies": {
    "@relay/sdk-node": "workspace:*"
  }
}
```

This allows you to:
- Test SDK changes immediately without publishing
- Develop examples alongside SDK features
- Ensure examples work with the latest SDK code

## Deployment Workflow

### Step 1: Prepare Examples for Deployment

Switch from `workspace:*` to published npm versions:

```bash
cd packages/examples
./scripts/prepare-for-deploy.sh
```

This script:
- Replaces `workspace:*` with `^1.0.0` (or specified version)
- Updates all example package.json files
- Shows a summary of changes

**Verify changes:**
```bash
git diff
```

You should see `workspace:*` changed to `^1.0.0` in:
- `node-backend/package.json`
- `react-app/package.json`
- `vue-app/package.json`

### Step 2: Commit Changes

Commit the prepared examples:

```bash
git add packages/examples
git commit -m "Prepare examples for deployment with SDK v1.0.0"
```

### Step 3: Deploy to Public Repository

Deploy using git subtree push:

```bash
cd packages/examples
./scripts/deploy-to-public-repo.sh
```

This script:
- Verifies examples are prepared (no `workspace:*` dependencies)
- Checks for uncommitted changes
- Adds remote `examples-public` (if not exists)
- Uses `git subtree push` to deploy `packages/examples/` to the public repo
- Shows deployment status

**Configuration:**

Set the public repository URL via environment variable:

```bash
export PUBLIC_REPO_URL=git@github.com:yourorg/relay-examples.git
./scripts/deploy-to-public-repo.sh
```

Or configure in the script (default: `git@github.com:relay/relay-examples.git`)

### Step 4: Restore Workspace Dependencies

After deployment, restore `workspace:*` for local development:

```bash
cd packages/examples
./scripts/restore-workspace-deps.sh
```

This script:
- Replaces `^1.0.0` back to `workspace:*`
- Allows you to continue local development

**Verify restoration:**
```bash
git diff
```

You should see `^1.0.0` changed back to `workspace:*`.

### Step 5: Commit Restoration

```bash
git add packages/examples
git commit -m "Restore workspace dependencies after deployment"
```

## Complete Deployment Workflow (TL;DR)

```bash
# 1. Prepare for deployment
cd packages/examples
./scripts/prepare-for-deploy.sh

# 2. Review and commit
git diff
git add packages/examples
git commit -m "Prepare examples for deployment with SDK v1.0.0"

# 3. Deploy to public repo
./scripts/deploy-to-public-repo.sh

# 4. Restore workspace dependencies
./scripts/restore-workspace-deps.sh

# 5. Commit restoration
git add packages/examples
git commit -m "Restore workspace dependencies after deployment"
```

## Updating SDK Versions

When you publish a new SDK version (e.g., v1.2.0), update the version in the deployment script:

**Option 1: Pass version as argument**
```bash
# Edit prepare-for-deploy.sh to accept version argument
./scripts/prepare-for-deploy.sh 1.2.0
```

**Option 2: Edit script directly**
```bash
# In prepare-for-deploy.sh, update the default version:
local sdk_version=${4:-"^1.2.0"}  # Change from ^1.0.0
```

## Git Subtree Explained

We use `git subtree push` to deploy the `packages/examples/` directory to a separate repository:

- **Advantages**:
  - No git submodules complexity
  - Examples can be developed in monorepo
  - Public repo only contains examples (no internal code)
  - Maintains full git history for examples

- **How it works**:
  - `git subtree` extracts `packages/examples/` commits
  - Pushes to `examples-public` remote
  - Public repo only sees examples directory as root

## Troubleshooting

### "Error: Examples still use workspace:* dependencies"

You forgot to run `prepare-for-deploy.sh`. Run it before deploying.

### "Error: You have uncommitted changes"

Commit or stash changes before deploying:
```bash
git stash
./scripts/deploy-to-public-repo.sh
git stash pop
```

### "Error: Remote 'examples-public' already exists"

The remote exists. To update the URL:
```bash
git remote set-url examples-public git@github.com:neworg/relay-examples.git
```

### "Permission denied (publickey)"

Ensure you have SSH access to the public repository:
```bash
ssh -T git@github.com
```

### Deploy failed halfway

If deployment fails, restore workspace dependencies:
```bash
./scripts/restore-workspace-deps.sh
```

Then fix the issue and retry.

## Alternative: Git Subtree Split

For one-time setup, you can split the history:

```bash
# Create a new branch with only examples history
git subtree split --prefix=packages/examples -b examples-only

# Push to public repo
git push git@github.com:yourorg/relay-examples.git examples-only:main
```

This creates a clean public repository with only examples commits.

## CI/CD Integration

For automated deployments, add to `.github/workflows/deploy-examples.yml`:

```yaml
name: Deploy Examples

on:
  push:
    branches: [main]
    paths:
      - 'packages/examples/**'
      - 'packages/sdk-node/**'
      - 'packages/sdk-browser/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for subtree

      - name: Prepare examples
        run: |
          cd packages/examples
          ./scripts/prepare-for-deploy.sh

      - name: Deploy to public repo
        env:
          PUBLIC_REPO_URL: ${{ secrets.EXAMPLES_REPO_URL }}
        run: |
          cd packages/examples
          ./scripts/deploy-to-public-repo.sh
```

## Security Notes

- ✅ **Never commit .env files**: Examples use `.env.example`
- ✅ **No internal code**: Only examples are deployed
- ✅ **Public examples only**: Private packages never deployed
- ✅ **SSH keys**: Use deploy keys for CI/CD

## Best Practices

1. **Always restore workspace deps** after deployment
2. **Test examples** with published SDK before deploying
3. **Version alignment**: Ensure examples use latest published SDK version
4. **Update READMEs**: Keep setup instructions current
5. **Git commits**: Use clear commit messages for deployment
