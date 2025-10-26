# Frontend Context Management

React Context providers for the Academia platform frontend, managing global state, user authentication, shopping cart, theming, and other application-wide concerns.

## 🏗️ Context Architecture

The context directory contains React Context providers that manage global application state and provide data to components throughout the application.

```
src/context/
├── README.md (this file)
├── UserContext.tsx (User authentication & profile)
├── CartContext.tsx (Shopping cart management)
├── ThemeContext.tsx (Theme & styling)
└── FontContext.tsx (Typography settings)
```

## 👤 User Context

### UserContext.tsx

**Purpose**: Manages user authentication state, profile data, and authentication operations.

**Features**:
- User authentication status
- Profile data management
- Login/logout operations
- User role management
- Authentication token handling

**Context Interface**:
```typescript
interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  isAuthenticated: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isAdmin: boolean;
}
```

**Usage**:
```typescript
import { useUser } from '@/context/UserContext';

const ProfilePage = () => {
  const { user, loading, updateProfile } = useUser();
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      <h1>Welcome, {user?.first_name}</h1>
      <button onClick={() => updateProfile({ first_name: 'New Name' })}>
        Update Profile
      </button>
    </div>
  );
};
```

**Provider Implementation**:
```typescript
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.post('/auth/login/', credentials);
      setUser(response.data.user);
      
      // Store authentication state
      localStorage.setItem('isAuthenticated', 'true');
    } catch (err) {
      setError('Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    // Clear any stored tokens
  };
  
  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/profiles/');
      setUser(response.data);
    } catch (err) {
      setError('Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };
  
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    fetchUser,
    updateProfile,
    isAuthenticated: !!user,
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
    isAdmin: user?.role === 'admin',
  };
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
```

## 🛒 Cart Context

### CartContext.tsx

**Purpose**: Manages shopping cart state, cart operations, and cart persistence.

**Features**:
- Cart item management
- Quantity updates
- Cart persistence
- Total calculations
- Cart synchronization

**Context Interface**:
```typescript
interface CartContextType {
  cart: CartItem[];
  loading: boolean;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  isInCart: (productId: string) => boolean;
  refreshCart: () => Promise<void>;
}
```

**Usage**:
```typescript
import { useCart } from '@/context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart, isInCart, getCartCount } = useCart();
  
  return (
    <div>
      <h3>{product.title}</h3>
      <p>${product.price}</p>
      <button 
        onClick={() => addToCart(product)}
        disabled={isInCart(product.id)}
      >
        {isInCart(product.id) ? 'In Cart' : 'Add to Cart'}
      </button>
      <span>Cart: {getCartCount()} items</span>
    </div>
  );
};
```

**Provider Implementation**:
```typescript
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const addToCart = (product: Product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevCart, { product, quantity, addedAt: new Date() }];
    });
  };
  
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };
  
  const clearCart = () => {
    setCart([]);
  };
  
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };
  
  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };
  
  const isInCart = (productId: string) => {
    return cart.some(item => item.product.id === productId);
  };
  
  const refreshCart = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/shop/cart/');
      setCart(response.data.items || []);
    } catch (error) {
      console.error('Failed to refresh cart:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const value = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    isInCart,
    refreshCart,
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
```

## 🎨 Theme Context

### ThemeContext.tsx

**Purpose**: Manages application theming, dark mode, and styling preferences.

**Features**:
- Theme switching (light/dark/system)
- Accent color management
- Theme persistence
- CSS variable updates
- System theme detection

**Context Interface**:
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setAccentColor: (color: string) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
}
```

**Usage**:
```typescript
import { useTheme } from '@/context/ThemeContext';

const ThemeToggle = () => {
  const { theme, setTheme, toggleTheme, isDark } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {isDark ? '☀️' : '🌙'} {theme}
    </button>
  );
};
```

**Provider Implementation**:
```typescript
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  
  const isDark = useMemo(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme === 'dark';
  }, [theme]);
  
  const isLight = !isDark;
  
  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };
  
  useEffect(() => {
    // Update CSS variables
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.documentElement.style.setProperty('--accent-color', accentColor);
  }, [isDark, accentColor]);
  
  useEffect(() => {
    // Persist theme preference
    localStorage.setItem('theme', theme);
    localStorage.setItem('accent-color', accentColor);
  }, [theme, accentColor]);
  
  const value = {
    theme,
    accentColor,
    setTheme,
    setAccentColor,
    toggleTheme,
    isDark,
    isLight,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
```

## 🔤 Font Context

### FontContext.tsx

**Purpose**: Manages typography settings and font preferences.

**Features**:
- Font family selection
- Font size management
- Font weight preferences
- Typography persistence
- Accessibility options

**Context Interface**:
```typescript
interface FontContextType {
  fontFamily: string;
  fontSize: 'sm' | 'md' | 'lg';
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  setFontFamily: (family: string) => void;
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
  setFontWeight: (weight: 'normal' | 'medium' | 'semibold' | 'bold') => void;
  resetFonts: () => void;
}
```

**Usage**:
```typescript
import { useFont } from '@/context/FontContext';

const FontSettings = () => {
  const { fontFamily, fontSize, setFontFamily, setFontSize } = useFont();
  
  return (
    <div>
      <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
        <option value="Ravi">Ravi</option>
        <option value="Arial">Arial</option>
        <option value="Helvetica">Helvetica</option>
      </select>
      
      <select value={fontSize} onChange={(e) => setFontSize(e.target.value)}>
        <option value="sm">Small</option>
        <option value="md">Medium</option>
        <option value="lg">Large</option>
      </select>
    </div>
  );
};
```

## 🔧 Context Utilities

### Custom Hooks

**useAuth Hook**:
```typescript
// Custom hook for authentication
export const useAuth = () => {
  const { user, loading, login, logout, isAuthenticated } = useUser();
  
  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
    isAdmin: user?.role === 'admin',
  };
};
```

**useCart Hook**:
```typescript
// Custom hook for cart operations
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
```

### Context Composition

**App Providers**:
```typescript
// Main app providers
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  return (
    <UserProvider>
      <CartProvider>
        <ThemeProvider>
          <FontProvider>
            {children}
          </FontProvider>
        </ThemeProvider>
      </CartProvider>
    </UserProvider>
  );
};
```

## 📊 Context Performance

### Optimization Techniques

**Memoization**:
```typescript
// Memoize context values
const value = useMemo(() => ({
  user,
  loading,
  login,
  logout,
  // ... other values
}), [user, loading, login, logout]);
```

**Context Splitting**:
```typescript
// Split large contexts into smaller ones
const UserAuthContext = createContext<AuthContextType>();
const UserProfileContext = createContext<ProfileContextType>();
```

### Performance Monitoring

**Context Usage Tracking**:
```typescript
// Track context usage
export const useContextAnalytics = (contextName: string) => {
  useEffect(() => {
    analytics.track('context_usage', { context: contextName });
  }, [contextName]);
};
```

## 🧪 Context Testing

### Testing Context Providers

**Provider Test Setup**:
```typescript
// Test context providers
const renderWithProviders = (
  ui: React.ReactElement,
  options?: RenderOptions
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <UserProvider>
        <CartProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </CartProvider>
      </UserProvider>
    );
  };
  
  return render(ui, { wrapper: AllTheProviders, ...options });
};
```

**Context Hook Testing**:
```typescript
// Test custom hooks
describe('useAuth', () => {
  it('returns authentication state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: UserProvider,
    });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(true);
  });
});
```

## 📚 Related Documentation

- [Frontend Architecture](../README.md)
- [Component Library](../components/README.md)
- [Feature Modules](../features/README.md)
- [State Management Guide](../hooks/README.md)

---

**Frontend Context Management** - Global state management for educational platform
