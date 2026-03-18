# Admin UI

> React-based web interface for DAppNode administration and package management

## Overview

The Admin UI is a modern React application that provides the graphical user interface for DAppNode management. It connects to the DAppManager backend API to offer a comprehensive dashboard for installing packages, monitoring system health, configuring blockchain nodes, and managing all aspects of a DAppNode installation.

### Key Features

- **Package Management**: Browse, install, update, and configure DAppNode packages
- **System Dashboard**: Real-time monitoring of system resources and health
- **Blockchain Node Management**: Configure and monitor Ethereum execution/consensus clients
- **Staking Interface**: Validator key management and staking configuration
- **Network Administration**: VPN, port forwarding, and network configuration
- **System Settings**: User accounts, notifications, and system preferences
- **Responsive Design**: Optimized for desktop and mobile devices

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **State Management**: Redux Toolkit with RTK Query
- **Routing**: React Router v6
- **UI Components**: React Bootstrap with custom styling
- **Styling**: SCSS with Bootstrap 4 theming
- **Real-time Updates**: Socket.IO client for live data
- **Data Fetching**: SWR for efficient API calls and caching

## Architecture

```
src/
├── components/     # Reusable UI components
├── pages/         # Route-based page components
├── hooks/         # Custom React hooks
├── api/           # API client and data fetching
├── services/      # Business logic and utilities
├── store.ts       # Redux store configuration
├── types.ts       # TypeScript type definitions
└── utils/         # Utility functions
```

### Key Components

- **Dashboard**: System overview with real-time stats
- **Packages**: Browse and manage installed/available packages
- **System**: Host management, updates, and configuration
- **Stakers**: Ethereum staking and validator management
- **Network**: VPN, networking, and connectivity settings
- **Support**: Diagnostics, logs, and troubleshooting tools

## Development

### Prerequisites
- Node.js 20.x
- Yarn Berry (4.7.0+)
- DAppManager backend running (for full functionality)

### Environment Setup
```bash
# Install dependencies
yarn install

# Start development server with mock backend
yarn mock-standalone

# Start development server connected to real DAppManager
yarn start

# Start mock server (separate terminal)
yarn server-mock
```

### Development Scripts
```bash
yarn start              # Connect to real DAppManager API
yarn mock               # Development with mock backend at localhost:5000
yarn mock-standalone    # Development with embedded mocks
yarn build              # Production build
yarn server-mock        # Start mock API server
yarn dev                # Build in watch mode
```

### Development Workflow

1. **Standalone Development**: Use `yarn mock-standalone` for UI-only development
2. **Backend Integration**: Use `yarn mock` with mock server for API testing
3. **Full Integration**: Use `yarn start` connected to real DAppManager

The mock backend provides realistic API responses for development without requiring a full DAppNode setup.

## API Integration

The Admin UI communicates with the DAppManager backend through:

- **REST API**: Standard HTTP requests for CRUD operations
- **WebSocket**: Real-time updates via Socket.IO
- **SWR**: Efficient data fetching with caching and revalidation

### API Client Structure
```typescript
// Typed API client with SWR integration
const api = useApi.packageGet({ dnpName: "bitcoin.dnp.dappnode.eth" });

// Real-time subscription
useSubscription("chainData", (data) => {
  // Handle real-time blockchain data updates
});
```

## Styling and Theming

- **Base Framework**: Bootstrap 4 with custom DAppNode theme
- **Color System**: Defined in `src/dappnode_colors.scss`
- **Typography**: Custom font stack with system fallbacks
- **Dark/Light Mode**: Automatic theme switching support
- **Responsive Design**: Mobile-first approach with Bootstrap grid

## Testing

```bash
# Run all tests
yarn test

# Type checking for mock server
yarn server-mock:check-types
```

The testing strategy includes:
- Component testing with React Testing Library
- API integration testing with mock responses
- Type checking for TypeScript code
- End-to-end testing scenarios

## Build and Deployment

### Production Build
```bash
yarn build
```

Creates optimized production bundle in `build/` directory with:
- Code splitting and lazy loading
- Asset optimization and compression
- Source maps for debugging
- Service worker for offline functionality

### Build Configuration
- **Vite**: Modern build tool with HMR
- **TypeScript**: Strict type checking
- **SCSS**: Advanced styling with variables and mixins
- **Asset Optimization**: Images, fonts, and static resources

## Configuration

The Admin UI supports several configuration modes:

- **Production**: Connected to DAppManager backend
- **Mock**: Development with mock API server
- **Standalone**: Self-contained with embedded mocks
- **Test**: Automated testing environment

Environment variables:
- `VITE_APP_API_URL`: Backend API URL
- `VITE_APP_MOCK`: Enable mock mode
- `VITE_APP_API_TEST`: Test mode configuration

## Features Overview

### Package Management
- Install packages from DAppStore or IPFS
- Update and remove installed packages
- Configure package settings and environment variables
- View package logs and metrics

### System Monitoring
- Real-time CPU, memory, and disk usage
- Network statistics and connectivity status
- Docker container health and status
- System logs and diagnostics

### Blockchain Integration
- Ethereum execution/consensus client setup
- Validator key import and management
- Staking rewards and performance tracking
- Multi-network support (Mainnet, Gnosis, etc.)

### Network Management
- OpenVPN configuration and credentials
- Port forwarding and UPnP setup
- Static IP and DNS configuration
- Network diagnostics and troubleshooting

## Contributing

When contributing to the Admin UI:

1. Follow React and TypeScript best practices
2. Use existing component patterns and styling
3. Maintain responsive design principles
4. Add proper TypeScript types for new features
5. Test with both mock and real backends
6. Follow the existing code organization structure

### Code Style
- Use functional components with hooks
- Prefer TypeScript strict mode
- Follow existing naming conventions
- Use SCSS modules for component-specific styles

## Contact

**Maintainers:**
- @pablomendezroyo - Lead Developer
- @GiselleNessi - Frontend Developer
- @dappnodedev - Core Team

**Issues:** Please report UI issues in the main DNP_DAPPMANAGER repository
