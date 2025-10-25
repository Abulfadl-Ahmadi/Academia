# Academia Development Guide

Comprehensive development guide for the Academia educational platform, covering development environment setup, coding standards, testing, and best practices.

## 🚀 Getting Started

### Prerequisites

**Required Software**:
- **Python**: 3.11+ (recommended: 3.11.7)
- **Node.js**: 18+ (recommended: 18.17.0)
- **Git**: Latest version
- **PostgreSQL**: 13+ or MySQL 8+
- **Redis**: 6+ (for development)

**Recommended IDEs**:
- **VS Code**: With Python, TypeScript, and Django extensions
- **PyCharm**: Professional or Community edition
- **WebStorm**: For frontend development

### Development Environment Setup

#### 1. Backend Setup

**Clone Repository**:
```bash
git clone https://github.com/your-org/academia.git
cd academia
```

**Create Virtual Environment**:
```bash
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

**Install Dependencies**:
```bash
pip install -r requirements.txt
```

**Environment Configuration**:
```bash
cp .env.example .env
# Edit .env with your development settings
```

**Database Setup**:
```bash
# PostgreSQL
createdb academia_dev
python manage.py migrate
python manage.py createsuperuser
```

**Run Development Server**:
```bash
python manage.py runserver
```

#### 2. Frontend Setup

**Navigate to Frontend**:
```bash
cd vite-project
```

**Install Dependencies**:
```bash
npm install
```

**Environment Configuration**:
```bash
cp .env.example .env
# Edit .env with your API URL
```

**Run Development Server**:
```bash
npm run dev
```

## 🏗️ Project Structure

### Backend Structure

```
api/
├── settings.py              # Django settings
├── urls.py                  # Main URL routing
├── wsgi.py                  # WSGI application
├── asgi.py                  # ASGI application
├── auth.py                  # Custom authentication
├── middleware.py            # Custom middleware
├── admin_config.py          # Admin configuration
├── accounts/                # User management
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   └── README.md
├── tests/                   # Test system
├── courses/                 # Course management
├── knowledge/               # Knowledge tree
├── shop/                    # E-commerce
├── finance/                 # Payment processing
├── contents/                # File storage
├── tickets/                 # Support system
├── blog/                    # Content management
├── chat/                    # Real-time chat
└── utils/                   # Shared utilities
```

### Frontend Structure

```
vite-project/
├── src/
│   ├── main.tsx             # Application entry point
│   ├── App.tsx              # Main app component
│   ├── AppWrapper.tsx       # App wrapper
│   ├── components/          # Shared components
│   │   ├── ui/              # UI components
│   │   ├── layout/          # Layout components
│   │   └── forms/           # Form components
│   ├── pages/               # Page components
│   │   ├── student/         # Student pages
│   │   ├── teacher/         # Teacher pages
│   │   └── public/          # Public pages
│   ├── context/             # React contexts
│   │   ├── UserContext.tsx  # User state
│   │   ├── CartContext.tsx  # Cart state
│   │   ├── ThemeContext.tsx # Theme state
│   │   └── FontContext.tsx  # Font state
│   ├── features/            # Feature modules
│   │   ├── knowledge/       # Knowledge tree
│   │   ├── tests/           # Test system
│   │   ├── tickets/         # Support tickets
│   │   └── chat/            # Real-time chat
│   ├── hooks/               # Custom hooks
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript types
│   └── styles/              # Global styles
├── public/                  # Static assets
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## 📝 Coding Standards

### Python/Django Standards

#### Code Style

**PEP 8 Compliance**:
```python
# Good
def calculate_test_score(answers, total_questions):
    """Calculate test score based on correct answers."""
    correct_answers = sum(1 for answer in answers if answer.is_correct)
    return (correct_answers / total_questions) * 100

# Bad
def calcScore(a,tq):
    return (a.count(True)/tq)*100
```

**Type Hints**:
```python
from typing import List, Optional, Dict, Any

def process_test_session(
    session_id: int,
    answers: List[Dict[str, Any]],
    timeout: Optional[int] = None
) -> Dict[str, Any]:
    """Process test session with type hints."""
    pass
```

**Docstrings**:
```python
def calculate_mastery_level(student: User, topic: Topic) -> str:
    """
    Calculate student mastery level for a topic.
    
    Args:
        student: User object representing the student
        topic: Topic object to calculate mastery for
        
    Returns:
        str: Mastery level ('beginner', 'intermediate', 'advanced', 'expert')
        
    Raises:
        ValueError: If student or topic is invalid
    """
    pass
```

#### Django Best Practices

**Model Design**:
```python
class Test(models.Model):
    """Test model with proper field definitions."""
    
    title = models.CharField(max_length=200, help_text="Test title")
    description = models.TextField(blank=True, help_text="Test description")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Test"
        verbose_name_plural = "Tests"
    
    def __str__(self):
        return self.title
```

**View Patterns**:
```python
class TestDetailView(RetrieveAPIView):
    """Retrieve test details with proper permissions."""
    
    queryset = Test.objects.all()
    serializer_class = TestSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrReadOnly]
    
    def get_queryset(self):
        """Filter queryset based on user role."""
        if self.request.user.role == 'teacher':
            return Test.objects.filter(created_by=self.request.user)
        return Test.objects.filter(is_active=True)
```

**Serializer Design**:
```python
class TestSerializer(serializers.ModelSerializer):
    """Test serializer with validation and custom fields."""
    
    questions_count = serializers.SerializerMethodField()
    duration_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = Test
        fields = [
            'id', 'title', 'description', 'test_type',
            'questions_count', 'duration_formatted', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_questions_count(self, obj):
        """Get number of questions in test."""
        return obj.questions.count()
    
    def get_duration_formatted(self, obj):
        """Format duration in human-readable format."""
        hours, minutes = divmod(obj.duration_minutes, 60)
        if hours:
            return f"{hours}h {minutes}m"
        return f"{minutes}m"
```

### TypeScript/React Standards

#### Code Style

**TypeScript Configuration**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Component Structure**:
```typescript
interface TestTakingProps {
  testId: number;
  onComplete: (score: number) => void;
  onExit: () => void;
}

const TestTakingPage: React.FC<TestTakingProps> = ({
  testId,
  onComplete,
  onExit
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Component logic here
  
  return (
    <div className="test-taking-container">
      {/* Component JSX */}
    </div>
  );
};

export default TestTakingPage;
```

**Custom Hooks**:
```typescript
interface UseTestSessionReturn {
  test: Test | null;
  loading: boolean;
  error: string | null;
  submitAnswer: (questionId: number, optionId: number) => Promise<void>;
  finishTest: () => Promise<void>;
}

const useTestSession = (testId: number): UseTestSessionReturn => {
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hook logic here
  
  return {
    test,
    loading,
    error,
    submitAnswer,
    finishTest
  };
};
```

#### React Best Practices

**Component Organization**:
```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children
}) => {
  const baseClasses = 'font-medium rounded-md transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

**State Management**:
```typescript
// context/UserContext.tsx
interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/login/', credentials);
      setUser(response.data.user);
    } catch (error) {
      throw new Error('Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    // Clear cookies, etc.
  };
  
  return (
    <UserContext.Provider value={{ user, loading, login, logout, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};
```

## 🧪 Testing

### Backend Testing

#### Unit Tests

**Model Tests**:
```python
# tests/test_models.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from tests.models import Test, Question, Option

User = get_user_model()

class TestModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='teacher@example.com',
            password='testpass123',
            role='teacher'
        )
        self.test = Test.objects.create(
            title='Sample Test',
            description='Test description',
            created_by=self.user
        )
    
    def test_test_creation(self):
        """Test test creation."""
        self.assertEqual(self.test.title, 'Sample Test')
        self.assertEqual(self.test.created_by, self.user)
        self.assertTrue(self.test.is_active)
    
    def test_test_str_representation(self):
        """Test test string representation."""
        self.assertEqual(str(self.test), 'Sample Test')
```

**View Tests**:
```python
# tests/test_views.py
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class TestViewSetTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='teacher@example.com',
            password='testpass123',
            role='teacher'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_test(self):
        """Test test creation via API."""
        data = {
            'title': 'New Test',
            'description': 'Test description',
            'test_type': 'scheduled',
            'content_type': 'typed'
        }
        response = self.client.post('/api/tests/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Test.objects.count(), 1)
    
    def test_list_tests(self):
        """Test test listing."""
        Test.objects.create(
            title='Test 1',
            created_by=self.user
        )
        response = self.client.get('/api/tests/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
```

#### Integration Tests

**API Integration Tests**:
```python
# tests/test_integration.py
class TestTakingIntegrationTest(APITestCase):
    def test_complete_test_flow(self):
        """Test complete test taking flow."""
        # Create test
        test = Test.objects.create(
            title='Integration Test',
            created_by=self.user
        )
        
        # Create questions
        question = Question.objects.create(
            text='What is 2+2?',
            test=test
        )
        
        # Enter test session
        response = self.client.post(f'/api/tests/{test.id}/enter/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Submit answer
        response = self.client.post(
            f'/api/tests/{test.id}/submit-answer/',
            {'question_id': question.id, 'selected_option_id': 1}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Finish test
        response = self.client.post(f'/api/tests/{test.id}/finish/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
```

### Frontend Testing

#### Component Tests

**React Testing Library**:
```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../components/ui/Button';

describe('Button Component', () => {
  it('renders button with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('applies correct variant classes', () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('bg-red-600');
  });
});
```

**Hook Tests**:
```typescript
// __tests__/hooks/useTestSession.test.tsx
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTestSession } from '../hooks/useTestSession';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useTestSession Hook', () => {
  it('fetches test data on mount', async () => {
    const { result } = renderHook(() => useTestSession(1), {
      wrapper: createWrapper(),
    });
    
    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.test).toBeDefined();
  });
});
```

#### E2E Tests

**Playwright Tests**:
```typescript
// e2e/test-taking.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Test Taking Flow', () => {
  test('user can take a test', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'student@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to test
    await page.goto('/student/tests/1');
    await expect(page.locator('[data-testid="test-title"]')).toBeVisible();
    
    // Answer questions
    await page.click('[data-testid="option-1"]');
    await page.click('[data-testid="next-question"]');
    
    // Submit test
    await page.click('[data-testid="finish-test"]');
    await expect(page.locator('[data-testid="test-results"]')).toBeVisible();
  });
});
```

### Running Tests

**Backend Tests**:
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test tests

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

**Frontend Tests**:
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🔧 Development Tools

### Code Quality Tools

**Backend Tools**:
```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Code formatting
black .
isort .

# Linting
flake8 .
pylint .

# Type checking
mypy .

# Security scanning
bandit -r .
```

**Frontend Tools**:
```bash
# Code formatting
npm run format

# Linting
npm run lint

# Type checking
npm run type-check

# Security scanning
npm audit
```

### Git Workflow

**Branch Naming**:
- `feature/test-taking-interface`
- `bugfix/login-validation`
- `hotfix/security-patch`
- `refactor/user-authentication`

**Commit Messages**:
```
feat: add test taking interface
fix: resolve login validation issue
docs: update API documentation
style: format code with prettier
refactor: improve user authentication
test: add unit tests for test models
chore: update dependencies
```

**Pull Request Template**:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

## 🐛 Debugging

### Backend Debugging

**Django Debug Toolbar**:
```python
# settings.py
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
    INTERNAL_IPS = ['127.0.0.1']
```

**Logging Configuration**:
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'academia': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

### Frontend Debugging

**React Developer Tools**:
- Install React Developer Tools browser extension
- Use React Profiler for performance debugging
- Inspect component state and props

**Debug Configuration**:
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});
```

## 📚 Best Practices

### Security

**Backend Security**:
- Always validate input data
- Use parameterized queries
- Implement proper authentication
- Sanitize user input
- Use HTTPS in production

**Frontend Security**:
- Sanitize user input
- Use Content Security Policy
- Implement proper authentication
- Validate data on client and server
- Use secure cookies

### Performance

**Backend Performance**:
- Use database indexes
- Implement caching
- Optimize queries
- Use connection pooling
- Monitor performance

**Frontend Performance**:
- Implement code splitting
- Use lazy loading
- Optimize images
- Minimize bundle size
- Use CDN for static assets

### Code Organization

**Backend Organization**:
- Keep apps focused on single responsibility
- Use proper model relationships
- Implement clean API design
- Follow Django conventions
- Document complex logic

**Frontend Organization**:
- Use component composition
- Implement proper state management
- Follow React best practices
- Use TypeScript for type safety
- Organize code by feature

## 📚 Related Documentation

- [Architecture Documentation](ARCHITECTURE.md)
- [API Documentation](API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Security Guide](SECURITY.md)

---

**Development Guide** - Comprehensive development workflow and best practices
