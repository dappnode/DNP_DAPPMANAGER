# DAppNode Manager - Copilot Coding Agent Instructions

## Repository Overview

DNP_DAPPMANAGER is the core package manager for DAppNode, a blockchain infrastructure platform. This repository contains a monorepo with multiple TypeScript packages that work together to provide package management, UI administration, Docker orchestration, and system services for DAppNode installations.

**Key Facts:**
- **Size**: 25+ packages in a yarn workspace monorepo (~800MB with dependencies)
- **Languages**: TypeScript (Node.js), React, Shell scripts  
- **Runtime**: Node.js 20.x with Yarn Berry 4.7.0
- **Architecture**: Microservices with shared packages
- **Target Environment**: Docker containers on Linux systems

## Build System & Commands

**CRITICAL: Always run commands in this exact order to avoid failures:**

### Prerequisites & Setup
```bash
# Always use Node.js 20.x (required)
node --version  # Must be 20.x

# Enable corepack for Yarn Berry (REQUIRED)
corepack enable

# Install dependencies (ALWAYS run first)
yarn install
```

### Core Build Commands
```bash
# Build all packages (required before most operations)
yarn build                    # 50-60s build time

# Development mode (watch/rebuild)
yarn dev                      # Starts dev servers for all packages

# Testing
yarn test                     # Unit tests (some failures expected in CI)
yarn test:int                # Integration tests (may require services)

# Code Quality
yarn lint                     # ESLint check
yarn lint:fix                # Auto-fix linting issues
yarn format                   # Prettier formatting

# UI Development
yarn mock-standalone         # Standalone UI development
yarn mock-standalone:build   # Build standalone UI
```

### Package-Specific Commands
```bash
# Admin UI development
cd packages/admin-ui && yarn mock          # Mock backend development
cd packages/admin-ui && yarn server-mock  # Run mock server
cd packages/admin-ui && yarn start        # Connect to real DAppManager

# Individual package builds
cd packages/[package-name] && yarn build
cd packages/[package-name] && yarn test
```

### Docker Development (Production-like)
```bash
# Development container (recommended for full testing)
docker-compose -f docker-compose-dev.yml up -d --build

# Production build test
docker build -t dappmanager.dnp.dappnode.eth:dev .
```

**Build Time Expectations:**
- Initial `yarn install`: 1-2 minutes
- Full `yarn build`: 50-60 seconds  
- Individual package builds: 2-5 seconds
- Admin UI build: 15-20 seconds

**Common Build Issues & Solutions:**
- If `yarn build` fails, run `yarn install` first
- Node version must be 20.x - other versions will cause issues
- Always enable corepack before running yarn commands
- Some test failures are expected in CI environments (network timeouts)

### Validation Pipeline
The repository runs these checks on all PRs:
1. `yarn build` - Must pass
2. `yarn test` - Unit tests (timeouts expected in CI)
3. `yarn lint` - Code style enforcement
4. `yarn server-mock:check-types` - Type checking for mock server

## Project Architecture & Layout

### Workspace Structure
```
packages/
├── admin-ui/          # React web interface (Vite + React 18)
├── dappmanager/       # Main application entry point  
├── common/            # Shared validation & schemas
├── types/             # TypeScript type definitions
├── toolkit/           # Core utilities & IPFS integration
├── dockerApi/         # Docker container management
├── dockerCompose/     # Docker Compose handling
├── db/                # Database layer
├── eventBus/          # Inter-service communication
├── installer/         # Package installation logic
├── logger/            # Logging infrastructure
├── notifications/     # Alert system
├── params/            # Configuration parameters
├── stakers/           # Ethereum staking support
├── chains/            # Blockchain integration
├── [other services]   # Additional microservices
```

### Key Files & Configuration
- `package.json` - Root workspace configuration
- `tsconfig.json` - TypeScript configuration (strict mode)
- `eslint.config.mjs` - ESLint rules (TypeScript ESLint)
- `.prettierrc` - Code formatting (120 char width, 2 spaces)
- `docker-compose.yml` - Production deployment
- `docker-compose-dev.yml` - Development environment
- `Dockerfile` - Multi-stage production build
- `dappnode_package.json` - DAppNode package metadata

### GitHub Workflows
Located in `.github/workflows/`:
- `main.yml` - Main CI/CD (unit tests, linting, releases)
- `build.yml` - PR build validation using DAppNode SDK
- `npm.yml` - NPM package publishing for schemas/types/toolkit  
- `netlify.yml` - UI deployment for PR previews

### Entry Points
- **Main Application**: `packages/dappmanager/src/index.ts`
- **Web UI**: `packages/admin-ui/src/index.tsx`
- **Mock Server**: `packages/admin-ui/server-mock/`

### Dependencies & Architecture
- **Backend**: Express.js API with Socket.IO for real-time updates
- **Frontend**: React 18 with Redux, React Router, Bootstrap
- **Database**: JSON file-based storage 
- **Container Management**: Docker API integration
- **Package Management**: IPFS-based distribution
- **Authentication**: Session-based with bcrypt
- **Networking**: Docker networks with custom DNS

## Development Patterns

### Making Changes
1. **Always run `yarn build` after making changes** - the build system generates schemas and validates types
2. **Frontend changes**: Work in `packages/admin-ui/src/`
3. **Backend changes**: Work in `packages/dappmanager/src/` or relevant service package
4. **Shared logic**: Use `packages/common/`, `packages/utils/`, or `packages/types/`
5. **New packages**: Follow existing naming convention `@dappnode/[package-name]`

### Testing Strategy
- Unit tests use Mocha + Chai
- Mock data available in test directories
- Some tests require Docker or network access (may fail in CI)
- UI tests use React Testing Library patterns
- Integration tests marked with `.test.int.ts` suffix

### Common Tasks
- **Add API endpoint**: Update `packages/dappmanager/src/api/routes/`
- **Add UI component**: Create in `packages/admin-ui/src/components/`
- **Update validation**: Modify schemas in `packages/common/src/validation/`
- **Add configuration**: Update `packages/params/src/params.ts`

## Files to Exclude from Commits
The `.gitignore` handles most build artifacts, but watch for:
- `packages/*/dist/` - Build outputs
- `packages/*/node_modules/` - Dependencies  
- `packages/*/dnp_repo/` - Runtime data
- `packages/*/DNCORE/` - DAppNode system files
- `.yarn/install-state.gz` - Yarn state

## Trust These Instructions
These instructions have been validated against the actual repository state and build system. Only search for additional information if:
1. Commands fail unexpectedly with these instructions
2. New packages or build steps have been added since these instructions were created
3. The build system has been changed significantly

**Always start with the prerequisite setup and run commands in the documented order for best results.**