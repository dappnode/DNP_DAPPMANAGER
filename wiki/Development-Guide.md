# 🔧 Development Guide

This guide provides comprehensive information for developers who want to contribute to, build, or understand the DAppNode Manager codebase.

## 🏗️ Repository Structure

DAppNode Manager is a **monorepo** containing 25+ TypeScript packages managed with Yarn Berry workspaces:

```
DNP_DAPPMANAGER/
├── packages/                    # Workspace packages
│   ├── admin-ui/               # React web interface
│   ├── dappmanager/            # Main Node.js application  
│   ├── installer/              # Package installation engine
│   ├── dockerApi/              # Docker integration
│   ├── stakers/                # Staking infrastructure
│   ├── common/                 # Shared utilities
│   ├── types/                  # TypeScript definitions
│   └── [20+ more packages]     # Supporting modules
├── docker-compose.yml          # Production deployment
├── docker-compose-dev.yml      # Development environment
├── Dockerfile                  # Production container build
├── tsconfig.json               # TypeScript configuration
├── package.json                # Root workspace configuration
└── yarn.lock                   # Dependency lockfile
```

## ⚙️ Prerequisites & Setup

### Required Software
- **Node.js 20.x** (required - other versions cause issues)
- **Yarn Berry 4.7.0** (managed via corepack)
- **Docker & Docker Compose** (for containerized development)
- **Git** (version control)

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/dappnode/DNP_DAPPMANAGER.git
cd DNP_DAPPMANAGER

# Verify Node.js version (must be 20.x)
node --version

# Enable corepack for Yarn Berry (CRITICAL)
corepack enable

# Install dependencies (always run first)
yarn install

# Build all packages (required before most operations)
yarn build
```

## 🛠️ Build System

### Core Commands
```bash
# Install dependencies (always run first)
yarn install                    # Install all dependencies

# Build system (run after code changes)
yarn build                      # Build all packages (50-60s)
yarn dev                        # Development mode with watch

# Testing
yarn test                       # Unit tests
yarn test:int                  # Integration tests
yarn lint                      # ESLint checking
yarn lint:fix                  # Auto-fix lint issues

# UI Development
yarn mock-standalone           # Standalone UI development
yarn mock-standalone:build     # Build standalone UI
```

### Build Order & Dependencies
The build system has interdependencies between packages:

```typescript
// Build dependency chain
types → common → utils → toolkit → installer → dappmanager
  ↓        ↓       ↓        ↓         ↓           ↓
schemas  → db → eventBus → stakers → daemons → admin-ui
```

**Important**: Always run `yarn build` after making changes to shared packages.

### Package-Specific Development
```bash
# Work on individual packages
cd packages/admin-ui
yarn start                     # Start React dev server
yarn mock                     # Run with mock backend
yarn test                     # Run package tests

cd packages/dappmanager  
yarn dev                      # Start with nodemon
yarn test                     # Run backend tests
```

## 🏃‍♂️ Development Workflows

### Frontend Development (Admin UI)
```bash
# Start UI development with mock backend
cd packages/admin-ui
yarn mock

# Or start with real DAppManager backend
yarn start

# Build for production
yarn build
```

The Admin UI supports:
- **Hot Reload**: Automatic refresh on code changes
- **Mock Backend**: Develop without running full DAppManager
- **Storybook**: Component development (if configured)
- **TypeScript**: Full type checking and IntelliSense

### Backend Development (DAppManager)
```bash
# Start DAppManager in development mode
cd packages/dappmanager
yarn dev

# Or run full development environment
docker-compose -f docker-compose-dev.yml up -d
```

Backend development features:
- **Auto-restart**: nodemon restarts on file changes
- **TypeScript**: Live compilation and type checking
- **Docker Integration**: Full container environment
- **API Testing**: Integrated with Admin UI

### Full Stack Development
```bash
# Run complete development environment
docker-compose -f docker-compose-dev.yml up -d --build

# Access services
# Admin UI: http://localhost:3000
# DAppManager API: http://localhost:8080
# Mock services: Various ports
```

## 🧪 Testing Strategy

### Unit Tests
```bash
# Run all unit tests
yarn test

# Run tests for specific package
cd packages/installer
yarn test

# Run tests in watch mode
yarn test --watch
```

### Integration Tests
```bash
# Run integration tests (may require Docker)
yarn test:int

# Run specific integration test
cd packages/dockerApi
yarn test:int
```

### Test Structure
```typescript
// Example test structure
describe('PackageInstaller', () => {
  let installer: DappnodeInstaller;
  
  beforeEach(() => {
    installer = new DappnodeInstaller();
  });
  
  describe('installPackage', () => {
    it('should install package successfully', async () => {
      const result = await installer.installPackage({
        name: 'test.dnp.dappnode.eth',
        version: '1.0.0'
      });
      
      expect(result.success).toBe(true);
    });
    
    it('should handle installation errors', async () => {
      await expect(installer.installPackage({
        name: 'invalid-package'
      })).rejects.toThrow('Package not found');
    });
  });
});
```

### Mock Data & Fixtures
```typescript
// Test fixtures location
packages/
├── admin-ui/src/__tests__/
│   ├── fixtures/              # Test data
│   ├── mocks/                 # Mock implementations
│   └── utils/                 # Test utilities
└── dappmanager/src/__tests__/
    ├── fixtures/
    └── integration/           # Integration tests
```

## 🎯 Code Quality & Standards

### TypeScript Configuration
```json
// tsconfig.json highlights
{
  "compilerOptions": {
    "strict": true,                    // Strict type checking
    "noImplicitAny": true,            // No implicit any types
    "exactOptionalPropertyTypes": true, // Exact optional properties
    "noUncheckedIndexedAccess": true   // Safe array/object access
  }
}
```

### ESLint Configuration
```javascript
// eslint.config.mjs highlights
export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
];
```

### Code Style Guidelines
- **Naming**: Use camelCase for variables/functions, PascalCase for classes/components
- **Files**: Use kebab-case for file names, PascalCase for React components
- **Imports**: Use absolute imports for packages, relative for local files
- **Comments**: Use JSDoc for public APIs, inline comments for complex logic

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"]
  }
}
```

## 🏗️ Architecture Patterns

### Monorepo Package Structure
Each package follows consistent structure:
```
packages/example-package/
├── src/                       # TypeScript source code
│   ├── index.ts              # Main export file
│   ├── types.ts              # Type definitions
│   └── [feature-files].ts    # Implementation
├── dist/                     # Compiled JavaScript (gitignored)
├── package.json              # Package configuration
├── tsconfig.json             # TypeScript config
└── README.md                 # Package documentation
```

### API Design Patterns
```typescript
// Standard API call pattern
// 1. Define types in packages/types/src/routes.ts
export interface PackageInstallRequest {
  name: string;
  version?: string;
  userSettings?: Record<string, any>;
}

// 2. Implement in packages/dappmanager/src/calls/
export async function packageInstall(
  request: PackageInstallRequest
): Promise<void> {
  // Implementation
}

// 3. Use in packages/admin-ui/src/
const installPackage = useApi.packageInstall();
```

### Error Handling Patterns
```typescript
// Consistent error handling
export class DAppNodeError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DAppNodeError';
  }
}

// Usage
throw new DAppNodeError(
  'Package installation failed',
  'PACKAGE_INSTALL_ERROR',
  { packageName, reason }
);
```

## 🐳 Docker Development

### Development Container
```yaml
# docker-compose-dev.yml
version: '3.8'
services:
  dappmanager:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "8080:8080"
    volumes:
      - .:/usr/src/app
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - NODE_ENV=development
```

### Hot Reload Development
```dockerfile
# Dockerfile.dev
FROM node:20-alpine
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN yarn install

# Copy source code
COPY . .

# Enable hot reload
CMD ["yarn", "dev"]
```

## 🔄 Contributing Workflow

### Git Workflow
```bash
# 1. Create feature branch
git checkout -b feature/my-new-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR
git push origin feature/my-new-feature
# Create PR through GitHub UI

# 4. Address review feedback
git add .
git commit -m "fix: address review comments"
git push origin feature/my-new-feature
```

### Commit Message Format
```
type(scope): description

feat(installer): add support for custom registries
fix(ui): resolve package list loading issue
docs(wiki): update installation guide
test(stakers): add validator monitoring tests
```

### Pull Request Guidelines
- **Title**: Clear, descriptive title
- **Description**: Explain what and why
- **Testing**: Describe testing performed
- **Screenshots**: For UI changes
- **Breaking Changes**: Document any breaking changes

## 🚀 Release Process

### Version Management
```bash
# Update version in package.json
npm version patch|minor|major

# Build and test
yarn build
yarn test

# Create release PR
git push origin release/v1.2.3
```

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Docker images built
- [ ] GitHub release created

## 🔍 Debugging & Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clean and rebuild
yarn clean
yarn install
yarn build

# Check Node.js version
node --version  # Must be 20.x

# Enable corepack if yarn issues
corepack enable
```

#### Type Errors
```bash
# Regenerate types
cd packages/types
yarn build

# Check TypeScript config
yarn tsc --noEmit
```

#### Docker Issues
```bash
# Reset Docker environment
docker-compose down
docker system prune -f
docker-compose up -d --build
```

### Debugging Tools
- **VS Code**: Recommended IDE with TypeScript support
- **Node.js Debugger**: Attach debugger to running processes
- **Docker Desktop**: Container management and logs
- **Chrome DevTools**: Frontend debugging

### Log Analysis
```bash
# View DAppManager logs
docker logs dappmanager

# View specific package logs
docker logs <container-name>

# Follow logs
docker logs -f dappmanager
```

## 📚 Learning Resources

### Codebase Exploration
1. Start with `packages/dappmanager/src/index.ts` - main entry point
2. Explore `packages/admin-ui/src/App.tsx` - UI entry point
3. Read `packages/installer/src/dappnodeInstaller.ts` - core logic
4. Study `packages/types/src/routes.ts` - API definitions

### Key Concepts
- **Monorepo Management**: Yarn workspaces and dependencies
- **TypeScript**: Advanced type system usage
- **Docker**: Container orchestration patterns
- **React**: Modern React patterns and hooks
- **API Design**: RESTful API patterns

### External Documentation
- [Docker API Documentation](https://docs.docker.com/engine/api/)
- [Ethereum Development](https://ethereum.org/developers/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [React Documentation](https://react.dev/)

## 🔗 Related Documentation

- **[Architecture Overview](Architecture-Overview.md)**: System design principles
- **[Package Installer & Repository](Package-Installer-Repository.md)**: Package management internals
- **[Admin UI](Admin-UI.md)**: Frontend architecture details
- **[Docker Integration](Docker-Integration.md)**: Container management details

---

> **Getting Help**: For development questions, create an issue in the GitHub repository or join the DAppNode Discord community. The development team is active and responsive to contributor questions.