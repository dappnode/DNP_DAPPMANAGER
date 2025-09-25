# 🎛️ Admin UI & User Interface

The DAppNode Admin UI is a comprehensive React-based web application that provides users with an intuitive interface to manage their blockchain infrastructure, packages, staking operations, and system monitoring.

## 🏗️ UI Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin UI Architecture                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │    React     │  │    Redux     │  │   React Router   │  │
│  │ Components   │◄─┤     Store    │  │   Navigation     │  │
│  │              │  │              │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │     API      │  │     SWR      │  │    Bootstrap     │  │
│  │  Integration │  │   Caching    │  │     Styling      │  │
│  │              │  │              │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      DAppManager Backend                   │
│                    (Node.js + Express)                     │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Application Structure

### Main Application Entry
```typescript
// From packages/admin-ui/src/App.tsx
function App() {
  return (
    <Router>
      <div className="App">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/stakers" element={<Stakers />} />
            <Route path="/system" element={<System />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
```

### Component Hierarchy
```
src/
├── App.tsx                     # Main application component
├── index.tsx                   # React application entry point
├── components/                 # Reusable UI components
│   ├── common/                 # Generic components
│   ├── forms/                  # Form components
│   ├── modals/                 # Modal dialogs
│   └── charts/                 # Data visualization
├── pages/                      # Page-level components
│   ├── dashboard/              # System overview
│   ├── packages/               # Package management
│   ├── stakers/                # Staking interface
│   ├── system/                 # System settings
│   └── notifications/          # Alert management
├── hooks/                      # Custom React hooks
├── services/                   # Business logic
├── store.ts                    # Redux store configuration
└── types.ts                    # TypeScript type definitions
```

## 🎨 Design System

### Visual Design
DAppNode uses a custom design system built on Bootstrap:

```scss
// From packages/admin-ui/src/dappnode_colors.scss
:root {
  --primary-color: #2fbcb2;      // DAppNode teal
  --secondary-color: #1a1a1a;    // Dark background
  --accent-color: #ffd700;       // Gold accent
  --success-color: #28a745;      // Success green
  --warning-color: #ffc107;      // Warning yellow
  --error-color: #dc3545;        // Error red
  
  // Background colors
  --bg-primary: #ffffff;         // Light theme primary
  --bg-secondary: #f8f9fa;       // Light theme secondary
  --bg-dark: #1a1a1a;           // Dark theme primary
  --bg-dark-secondary: #2d2d2d;  // Dark theme secondary
}
```

### Theme Support
```typescript
// From packages/admin-ui/src/light_dark.scss
interface ThemeConfig {
  mode: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    text: string;
    primary: string;
    accent: string;
  };
}

// Theme switching functionality
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  return { theme, toggleTheme };
};
```

### Responsive Design
```scss
// From packages/admin-ui/src/layout.scss
.main-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  min-height: 100vh;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
}

.sidebar {
  background: var(--bg-secondary);
  padding: 1rem;
  
  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: -250px;
    transition: left 0.3s ease;
    
    &.open {
      left: 0;
    }
  }
}
```

## 🧩 Key Components

### Dashboard Overview
```tsx
// From packages/admin-ui/src/pages/dashboard/
export function Dashboard() {
  const systemInfo = useApi.systemInfoGet();
  const packages = useApi.packagesGet();
  const chainData = useChainData();
  
  return (
    <div className="dashboard">
      <SystemHealthCard health={systemInfo.data?.health} />
      <PackageStatsCard packages={packages.data} />
      <ValidatorStatsCard chainData={chainData} />
      <RecentActivityCard />
    </div>
  );
}

function SystemHealthCard({ health }: { health?: SystemHealth }) {
  const statusColor = health?.status === 'healthy' ? 'success' : 'warning';
  
  return (
    <Card className="system-health-card">
      <Card.Header>
        <h5>System Health</h5>
        <Badge variant={statusColor}>{health?.status}</Badge>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={3}>
            <MetricDisplay 
              label="CPU Usage" 
              value={`${health?.cpu.usage}%`}
              trend={health?.cpu.trend} 
            />
          </Col>
          <Col md={3}>
            <MetricDisplay 
              label="Memory Usage" 
              value={`${health?.memory.usage}%`}
              trend={health?.memory.trend} 
            />
          </Col>
          <Col md={3}>
            <MetricDisplay 
              label="Disk Usage" 
              value={`${health?.disk.usage}%`}
              trend={health?.disk.trend} 
            />
          </Col>
          <Col md={3}>
            <MetricDisplay 
              label="Active Packages" 
              value={health?.packages.active.toString()}
              trend={health?.packages.trend} 
            />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
```

### Package Management Interface
```tsx
// From packages/admin-ui/src/pages/packages/
export function PackageManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const packages = useApi.packagesGet();
  const directory = useApi.directoryGet();
  
  const filteredPackages = useMemo(() => {
    return packages.data?.filter(pkg => {
      const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || pkg.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }) || [];
  }, [packages.data, searchTerm, categoryFilter]);
  
  return (
    <div className="package-manager">
      <div className="package-toolbar">
        <SearchInput 
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search packages..."
        />
        <CategoryFilter 
          value={categoryFilter}
          onChange={setCategoryFilter}
          categories={['all', 'blockchain', 'monitoring', 'storage']}
        />
        <Button onClick={() => setShowInstallModal(true)}>
          <Plus /> Install Package
        </Button>
      </div>
      
      <div className="package-grid">
        {filteredPackages.map(pkg => (
          <PackageCard 
            key={pkg.dnpName}
            package={pkg}
            onUpdate={() => handlePackageUpdate(pkg)}
            onRemove={() => handlePackageRemove(pkg)}
            onConfigure={() => handlePackageConfigure(pkg)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Staking Interface
```tsx
// From packages/admin-ui/src/pages/stakers/
export function StakingInterface() {
  const [selectedNetwork, setSelectedNetwork] = useState<Network>('ethereum');
  const stakerConfig = useApi.stakerConfigGet({ network: selectedNetwork });
  const validatorMetrics = useApi.validatorMetricsGet({ network: selectedNetwork });
  
  return (
    <div className="staking-interface">
      <NetworkSelector 
        value={selectedNetwork}
        onChange={setSelectedNetwork}
        networks={['ethereum', 'gnosis', 'lukso']}
      />
      
      <Tabs defaultActiveKey="overview">
        <Tab eventKey="overview" title="Overview">
          <ValidatorOverview 
            config={stakerConfig.data}
            metrics={validatorMetrics.data}
          />
        </Tab>
        
        <Tab eventKey="configuration" title="Configuration">
          <StakerConfiguration 
            network={selectedNetwork}
            config={stakerConfig.data}
            onUpdate={(config) => updateStakerConfig(selectedNetwork, config)}
          />
        </Tab>
        
        <Tab eventKey="validators" title="Validators">
          <ValidatorManagement 
            network={selectedNetwork}
            validators={validatorMetrics.data?.validators}
          />
        </Tab>
        
        <Tab eventKey="rewards" title="Rewards">
          <RewardsTracking 
            network={selectedNetwork}
            rewards={validatorMetrics.data?.rewards}
          />
        </Tab>
      </Tabs>
    </div>
  );
}
```

## 🔌 API Integration

### API Client Architecture
```typescript
// From packages/admin-ui/src/api/
interface ApiClient {
  // Package management
  packagesGet(): Promise<PackageInfo[]>;
  packageInstall(req: InstallRequest): Promise<void>;
  packageRemove(req: RemoveRequest): Promise<void>;
  
  // System management
  systemInfoGet(): Promise<SystemInfo>;
  systemResourcesGet(): Promise<ResourceUsage>;
  
  // Staking management
  stakerConfigGet(req: { network: Network }): Promise<StakerConfig>;
  stakerConfigSet(req: { network: Network; config: StakerConfig }): Promise<void>;
  
  // Notifications
  notificationsGet(): Promise<Notification[]>;
  notificationPreferencesGet(): Promise<NotificationPreferences>;
}
```

### SWR Integration for Data Fetching
```typescript
// From packages/admin-ui/src/api/useApi.ts
export const useApi = {
  packagesGet: () => useSWR('/api/packages', fetcher, {
    refreshInterval: 5000,        // Refresh every 5 seconds
    revalidateOnFocus: true,      // Refresh on window focus
    revalidateOnReconnect: true   // Refresh on network reconnect
  }),
  
  systemInfoGet: () => useSWR('/api/system/info', fetcher, {
    refreshInterval: 10000        // Refresh every 10 seconds
  }),
  
  validatorMetricsGet: (params: { network: Network }) => 
    useSWR(`/api/stakers/${params.network}/metrics`, fetcher, {
      refreshInterval: 30000      // Refresh every 30 seconds
    })
};

// Error handling and retry logic
const fetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = new Error('API request failed');
    error.status = response.status;
    error.info = await response.json();
    throw error;
  }
  
  return response.json();
};
```

### Real-time Updates with WebSocket
```typescript
// WebSocket integration for real-time updates
export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws');
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'package_updated':
          // Update package state
          mutate('/api/packages');
          break;
          
        case 'validator_alert':
          // Show validator notification
          showNotification(message.data);
          break;
          
        case 'system_metrics':
          // Update system metrics
          mutate('/api/system/info');
          break;
      }
    };
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, []);
  
  return socket;
}
```

## 🎯 User Experience Features

### Progressive Web App (PWA)
```typescript
// From packages/admin-ui/src/registerServiceWorker.js
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        // Service worker registered successfully
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  }
}
```

### Notification Support
```typescript
// Browser notification integration
export function useNotifications() {
  const [permission, setPermission] = useState(Notification.permission);
  
  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  };
  
  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/badge.png',
        ...options
      });
    }
  };
  
  return { permission, requestPermission, showNotification };
}
```

### Accessibility Features
```tsx
// Accessibility-focused components
export function AccessibleButton({ 
  children, 
  onClick, 
  disabled, 
  ariaLabel,
  ...props 
}: AccessibleButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="btn btn-primary"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}

// Screen reader announcements
export function useScreenReaderAnnouncement() {
  const announce = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };
  
  return announce;
}
```

## 📊 State Management

### Redux Store Configuration
```typescript
// From packages/admin-ui/src/store.ts
interface AppState {
  packages: PackageState;
  system: SystemState;
  stakers: StakerState;
  notifications: NotificationState;
  ui: UIState;
}

const store = configureStore({
  reducer: {
    packages: packagesReducer,
    system: systemReducer,
    stakers: stakersReducer,
    notifications: notificationsReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    }).concat(persistMiddleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Custom Hooks for State Management
```typescript
// Custom hooks for accessing state
export function usePackages() {
  const packages = useSelector((state: RootState) => state.packages.items);
  const loading = useSelector((state: RootState) => state.packages.loading);
  const error = useSelector((state: RootState) => state.packages.error);
  
  const dispatch = useDispatch<AppDispatch>();
  
  const refresh = useCallback(() => {
    dispatch(fetchPackages());
  }, [dispatch]);
  
  const install = useCallback((packageName: string) => {
    dispatch(installPackage(packageName));
  }, [dispatch]);
  
  return { packages, loading, error, refresh, install };
}
```

## 🧪 Testing Strategy

### Component Testing
```typescript
// From packages/admin-ui/src/__tests__/
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PackageCard } from '../components/PackageCard';

describe('PackageCard', () => {
  const mockPackage = {
    dnpName: 'geth.dnp.dappnode.eth',
    version: '1.10.0',
    status: 'running',
    description: 'Ethereum execution client'
  };
  
  it('renders package information correctly', () => {
    render(<PackageCard package={mockPackage} />);
    
    expect(screen.getByText('geth.dnp.dappnode.eth')).toBeInTheDocument();
    expect(screen.getByText('1.10.0')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
  });
  
  it('handles update action', async () => {
    const onUpdate = jest.fn();
    render(<PackageCard package={mockPackage} onUpdate={onUpdate} />);
    
    const updateButton = screen.getByRole('button', { name: /update/i });
    fireEvent.click(updateButton);
    
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(mockPackage);
    });
  });
});
```

### Integration Testing
```typescript
// Mock backend integration
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/packages', (req, res, ctx) => {
    return res(ctx.json([mockPackage]));
  }),
  
  rest.post('/api/packages/install', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## 🔗 Related Systems

- **[Architecture Overview](Architecture-Overview.md)**: Overall system design
- **[Package Installer & Repository](Package-Installer-Repository.md)**: Backend package management
- **[PoS in DAppNode](PoS-in-DAppNode.md)**: Staking interface details
- **[Notifications](Notifications.md)**: Alert system integration

---

> **Technical Implementation**: The Admin UI is implemented in `packages/admin-ui/` using React 18, Redux for state management, Bootstrap for styling, and SWR for data fetching. The interface provides comprehensive management capabilities for all DAppNode features through an intuitive web interface.