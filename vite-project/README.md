# Academia Frontend

React-based frontend application for the Academia educational platform, built with modern web technologies and providing a comprehensive user interface for students, teachers, and administrators.

## 🏗️ Architecture Overview

The frontend is built using modern React technologies with:

- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern UI component library
- **React Router**: Client-side routing
- **TanStack Query**: Data fetching and caching
- **Context API**: State management

## 📁 Project Structure

```
vite-project/
├── README.md (this file)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── main.tsx (entry point)
│   ├── App.tsx (main app component)
│   ├── AppWrapper.tsx (app wrapper)
│   ├── components/ (shared components)
│   ├── pages/ (page components)
│   ├── context/ (React contexts)
│   ├── features/ (feature modules)
│   ├── hooks/ (custom hooks)
│   ├── utils/ (utility functions)
│   ├── types/ (TypeScript types)
│   ├── styles/ (global styles)
│   └── assets/ (static assets)
```

## 🚀 Setup & Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation Steps

1. **Navigate to frontend directory**
   ```bash
   cd vite-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

**Required Variables**:
```bash
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Academia
VITE_APP_VERSION=1.0.0
```

**Optional Variables**:
```bash
VITE_DEBUG=true
VITE_ANALYTICS_ID=your-analytics-id
VITE_SENTRY_DSN=your-sentry-dsn
```

### Vite Configuration

**vite.config.ts**:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

## 🎨 Styling System

### Tailwind CSS

**Configuration**:
- **Utility-first**: Rapid UI development
- **Custom Design System**: Brand-specific styling
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Theme switching support

**Custom Configuration**:
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#f59e0b'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
}
```

### shadcn/ui Components

**Component Library**:
- **Modern Design**: Clean and modern components
- **Accessibility**: WCAG compliant components
- **Customizable**: Easy customization
- **TypeScript**: Full TypeScript support

**Available Components**:
- Button, Input, Select, Checkbox
- Dialog, Sheet, Popover, Tooltip
- Table, Card, Badge, Avatar
- Form, Label, Textarea, Switch

## 🧩 Component Architecture

### Shared Components

**Location**: `src/components/`

**Component Types**:
- **UI Components**: Reusable UI elements
- **Layout Components**: Page layout components
- **Form Components**: Form input components
- **Navigation Components**: Navigation elements

**Key Components**:
- **Navbar**: Main navigation bar
- **Footer**: Site footer
- **Sidebar**: Side navigation
- **Modal**: Modal dialogs
- **Toast**: Notification toasts

### Page Components

**Location**: `src/pages/`

**Page Structure**:
- **Student Pages**: Student dashboard and features
- **Teacher Pages**: Teacher dashboard and tools
- **Public Pages**: Landing and authentication pages
- **Shared Pages**: Common page components

**Key Pages**:
- **Dashboard**: Main dashboard pages
- **Authentication**: Login, register, profile
- **Tests**: Test taking and management
- **Courses**: Course viewing and management
- **Shop**: E-commerce functionality

### Feature Modules

**Location**: `src/features/`

**Feature Organization**:
- **Knowledge Tree**: Knowledge navigation
- **Test Collections**: Test management
- **Tickets**: Support ticket system
- **Chat**: Real-time chat

## 🔄 State Management

### React Context API

**Context Providers**:
- **UserContext**: User authentication and profile
- **CartContext**: Shopping cart management
- **ThemeContext**: Theme and styling
- **FontContext**: Typography settings

**UserContext**:
```typescript
interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}
```

**CartContext**:
```typescript
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}
```

### TanStack Query

**Data Fetching**:
- **Server State**: API data management
- **Caching**: Intelligent data caching
- **Synchronization**: Background data sync
- **Optimistic Updates**: UI updates before server response

**Query Configuration**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

## 🛣️ Routing System

### React Router DOM

**Route Structure**:
- **Public Routes**: Authentication and landing pages
- **Protected Routes**: User-specific pages
- **Role-based Routes**: Role-based access control
- **Nested Routes**: Hierarchical page structure

**Route Configuration**:
```typescript
const routes = [
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/student',
    element: <StudentDashboard />,
    children: [
      { path: 'dashboard', element: <StudentDashboard /> },
      { path: 'tests', element: <StudentTests /> },
      { path: 'courses', element: <StudentCourses /> },
    ],
  },
];
```

### Route Guards

**Protection Levels**:
- **Authentication Guard**: Requires user login
- **Profile Guard**: Requires complete profile
- **Role Guard**: Requires specific user role
- **Permission Guard**: Requires specific permissions

**ProfileGuard Component**:
```typescript
const ProfileGuard: React.FC<ProfileGuardProps> = ({
  children,
  requireProfile = true,
}) => {
  const { user } = useUser();
  
  if (requireProfile && !user?.profile_complete) {
    return <Navigate to="/complete-profile" />;
  }
  
  return <>{children}</>;
};
```

## 🎯 Key Features

### Test Taking Interface

**Features**:
- **Question Navigation**: Easy question navigation
- **Timer Display**: Countdown timer
- **Answer Submission**: Answer selection and submission
- **Progress Tracking**: Test progress indication
- **Auto-save**: Automatic answer saving

**Implementation**:
```typescript
const StudentTestTakingPage: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(test.duration);
  
  // Test taking logic
};
```

### Knowledge Tree Navigation

**Features**:
- **Hierarchical Navigation**: Tree-based navigation
- **Progress Tracking**: Student progress visualization
- **Topic Management**: Topic organization and access
- **Search Functionality**: Topic search and filtering

### Live Streaming

**Features**:
- **Video Player**: HLS.js video player
- **Chat Integration**: Real-time chat during streams
- **Quality Selection**: Video quality options
- **Fullscreen Support**: Fullscreen video playback

### Payment Flow

**Features**:
- **Cart Management**: Shopping cart functionality
- **Checkout Process**: Secure checkout flow
- **Payment Integration**: Zarinpal payment gateway
- **Order Confirmation**: Order confirmation and tracking

## 🔧 Development

### Development Server

**Start Development**:
```bash
npm run dev
```

**Development Features**:
- **Hot Reload**: Instant code updates
- **TypeScript**: Type checking
- **ESLint**: Code linting
- **Prettier**: Code formatting

### Build Process

**Production Build**:
```bash
npm run build
```

**Build Features**:
- **Code Splitting**: Automatic code splitting
- **Tree Shaking**: Dead code elimination
- **Minification**: Code and asset minification
- **Source Maps**: Debug information

### Testing

**Test Commands**:
```bash
npm run test        # Run tests
npm run test:watch  # Watch mode
npm run test:coverage # Coverage report
```

**Testing Setup**:
- **Vitest**: Fast unit testing
- **React Testing Library**: Component testing
- **Jest**: Test framework
- **Coverage**: Code coverage reporting

## 📱 Progressive Web App

### PWA Features

**Service Worker**:
- **Offline Support**: Offline functionality
- **Caching**: Resource caching
- **Background Sync**: Background data sync
- **Push Notifications**: Push notification support

**Manifest Configuration**:
```json
{
  "name": "Academia",
  "short_name": "Academia",
  "description": "Educational Platform",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff"
}
```

### PWA Implementation

**Service Worker Registration**:
```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

## 🚀 Deployment

### Production Build

**Build Commands**:
```bash
npm run build
npm run preview
```

**Build Output**:
- **Static Files**: Optimized static assets
- **HTML**: Generated HTML files
- **CSS**: Compiled and minified CSS
- **JavaScript**: Bundled and minified JS

### Deployment Options

**Static Hosting**:
- **Vercel**: Easy deployment with Vercel
- **Netlify**: Static site hosting
- **GitHub Pages**: Free hosting option
- **AWS S3**: Scalable cloud hosting

**Server Deployment**:
- **Nginx**: Web server configuration
- **Apache**: Alternative web server
- **Docker**: Containerized deployment
- **CDN**: Content delivery network

## 📈 Performance Optimization

### Code Splitting

**Route-based Splitting**:
```typescript
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
```

**Component Splitting**:
```typescript
const HeavyComponent = lazy(() => import('./components/HeavyComponent'));
```

### Bundle Optimization

**Optimization Techniques**:
- **Tree Shaking**: Remove unused code
- **Minification**: Compress code and assets
- **Compression**: Gzip/Brotli compression
- **CDN**: Content delivery network

### Performance Monitoring

**Monitoring Tools**:
- **Web Vitals**: Core web vitals tracking
- **Bundle Analyzer**: Bundle size analysis
- **Performance Profiler**: Runtime performance
- **Error Tracking**: Error monitoring

## 🔧 Configuration

### TypeScript Configuration

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### ESLint Configuration

**eslint.config.js**:
```javascript
export default [
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },
];
```

## 📚 Related Documentation

- [Backend Architecture](api/README.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Development Guide](docs/DEVELOPMENT.md)

---

**Frontend Application** - Modern React-based educational platform interface