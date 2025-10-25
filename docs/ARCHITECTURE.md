# Academia Platform Architecture

Comprehensive architecture documentation for the Academia educational platform, covering system design, component interactions, data flows, and technical decisions.

## 🏗️ System Architecture Overview

The Academia platform follows a modern, scalable architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Academia Platform                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React)     │  Backend (Django)  │  Infrastructure │
│  ├─ React 19          │  ├─ Django 5.2.4   │  ├─ PostgreSQL   │
│  ├─ TypeScript        │  ├─ DRF            │  ├─ Redis        │
│  ├─ Vite              │  ├─ JWT Auth       │  ├─ S3 Storage   │
│  ├─ Tailwind CSS      │  ├─ Channels       │  ├─ CDN         │
│  └─ PWA               │  └─ Celery         │  └─ Nginx       │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Core Design Principles

### 1. Modular Architecture
- **Django Apps**: Each app handles a specific domain
- **React Components**: Reusable, composable components
- **API-First**: RESTful API design
- **Microservices Ready**: Scalable to microservices

### 2. Security First
- **JWT Authentication**: Secure token-based auth
- **HTTPS Everywhere**: Encrypted communication
- **Input Validation**: Comprehensive data validation
- **Access Control**: Role-based permissions

### 3. Performance Optimized
- **Database Indexing**: Strategic database optimization
- **Caching**: Multi-layer caching strategy
- **CDN**: Global content delivery
- **Code Splitting**: Frontend optimization

### 4. Scalability
- **Horizontal Scaling**: Multi-instance deployment
- **Database Scaling**: Read replicas and sharding
- **Load Balancing**: Traffic distribution
- **Auto-scaling**: Dynamic resource allocation

## 🏛️ Backend Architecture

### Django Project Structure

```
api/
├── settings.py          # Django configuration
├── urls.py              # Main URL routing
├── wsgi.py              # WSGI application
├── asgi.py              # ASGI application
├── auth.py              # Custom JWT authentication
├── middleware.py        # Custom middleware
├── admin_config.py      # Admin configuration
├── accounts/            # User management
├── tests/               # Test system
├── courses/             # Course management
├── knowledge/           # Knowledge tree
├── shop/                # E-commerce
├── finance/             # Payment processing
├── contents/            # File storage
├── tickets/             # Support system
├── blog/                # Content management
├── chat/                # Real-time chat
└── utils/               # Shared utilities
```

### Database Architecture

**Primary Database**: PostgreSQL
- **ACID Compliance**: Data integrity guarantees
- **JSON Support**: Flexible data structures
- **Full-text Search**: Advanced search capabilities
- **Replication**: High availability

**Cache Layer**: Redis
- **Session Storage**: User session management
- **API Caching**: Response caching
- **WebSocket Channels**: Real-time communication
- **Task Queue**: Background job processing

### API Architecture

**RESTful API Design**:
- **Resource-based URLs**: `/api/tests/`, `/api/courses/`
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Status Codes**: Proper HTTP status codes
- **Content Negotiation**: JSON responses

**API Features**:
- **Pagination**: Efficient data pagination
- **Filtering**: Query parameter filtering
- **Sorting**: Flexible data sorting
- **Throttling**: Rate limiting protection

## 🎨 Frontend Architecture

### React Application Structure

```
src/
├── main.tsx             # Application entry point
├── App.tsx              # Main app component
├── AppWrapper.tsx       # App wrapper with providers
├── components/          # Shared components
│   ├── ui/              # UI components
│   ├── layout/          # Layout components
│   └── forms/             # Form components
├── pages/               # Page components
│   ├── student/         # Student pages
│   ├── teacher/         # Teacher pages
│   └── public/          # Public pages
├── context/             # React contexts
│   ├── UserContext.tsx  # User state
│   ├── CartContext.tsx  # Cart state
│   ├── ThemeContext.tsx # Theme state
│   └── FontContext.tsx  # Font state
├── features/            # Feature modules
│   ├── knowledge/       # Knowledge tree
│   ├── tests/           # Test system
│   ├── tickets/         # Support tickets
│   └── chat/            # Real-time chat
├── hooks/               # Custom hooks
├── utils/               # Utility functions
├── types/               # TypeScript types
└── styles/              # Global styles
```

### State Management Architecture

**Context API Pattern**:
```typescript
// User state management
const UserContext = createContext<UserContextType | undefined>(undefined);

// Cart state management
const CartContext = createContext<CartContextType | undefined>(undefined);

// Theme state management
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
```

**TanStack Query Integration**:
```typescript
// Server state management
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  },
});
```

## 🔄 Data Flow Architecture

### Authentication Flow

```
1. User Login Request
   ↓
2. Credentials Validation
   ↓
3. JWT Token Generation
   ↓
4. Token Storage (HTTP-only cookies)
   ↓
5. Automatic Token Refresh
   ↓
6. User State Management
```

### Test Taking Flow

```
1. Test Selection
   ↓
2. Session Creation
   ↓
3. Device Fingerprinting
   ↓
4. Question Loading
   ↓
5. Answer Submission
   ↓
6. Progress Tracking
   ↓
7. Test Completion
   ↓
8. Score Calculation
```

### E-commerce Flow

```
1. Product Browsing
   ↓
2. Cart Management
   ↓
3. Checkout Process
   ↓
4. Payment Processing
   ↓
5. Order Creation
   ↓
6. Access Granting
   ↓
7. User Notification
```

## 🔐 Security Architecture

### Authentication & Authorization

**JWT Token System**:
- **Access Token**: Short-lived (15 minutes)
- **Refresh Token**: Long-lived (7 days)
- **HTTP-only Cookies**: XSS protection
- **Secure Cookies**: HTTPS-only in production

**Role-based Access Control**:
```python
# Permission levels
STUDENT_PERMISSIONS = ['view_courses', 'take_tests', 'purchase_products']
TEACHER_PERMISSIONS = ['create_courses', 'manage_tests', 'view_analytics']
ADMIN_PERMISSIONS = ['manage_users', 'system_config', 'view_reports']
```

### Data Protection

**Input Validation**:
- **Django Forms**: Server-side validation
- **DRF Serializers**: API validation
- **TypeScript**: Client-side type safety
- **Sanitization**: XSS prevention

**Database Security**:
- **ORM Protection**: SQL injection prevention
- **Encryption**: Sensitive data encryption
- **Backup Security**: Encrypted backups
- **Access Logging**: Audit trail

## 📊 Database Architecture

### Entity Relationship Diagram

```
User (1) ──── (1) UserProfile
  │
  ├── (M) StudentTestSession
  ├── (M) Order
  ├── (M) UserAccess
  └── (M) ChatMessage

Test (1) ──── (M) Question
  │              │
  ├── (M) StudentTestSession    ├── (M) Option
  └── (M) TestCollection        └── (M) QuestionImage

Course (1) ──── (M) CourseSession
  │
  ├── (M) CourseSchedule
  └── (M) Student (Many-to-Many)

Product (1) ──── (M) OrderItem
  │
  └── (M) UserAccess

Knowledge Tree:
Subject (1) ──── (M) Chapter (1) ──── (M) Section (1) ──── (M) Lesson (1) ──── (M) TopicCategory (1) ──── (M) Topic

New Folder System:
Folder (1) ──── (M) Folder (Self-referencing)
```

### Database Optimization

**Indexing Strategy**:
```sql
-- User authentication
CREATE INDEX idx_user_email ON accounts_user(email);
CREATE INDEX idx_user_username ON accounts_user(username);

-- Test sessions
CREATE INDEX idx_test_session_student ON tests_studenttestsession(student_id);
CREATE INDEX idx_test_session_test ON tests_studenttestsession(test_id);
CREATE INDEX idx_test_session_status ON tests_studenttestsession(status);

-- Course enrollment
CREATE INDEX idx_course_students ON courses_course_students(course_id, user_id);

-- E-commerce
CREATE INDEX idx_order_user ON finance_order(user_id);
CREATE INDEX idx_order_status ON finance_order(status);
CREATE INDEX idx_user_access_user ON finance_useraccess(user_id);
```

**Query Optimization**:
- **select_related**: Foreign key optimization
- **prefetch_related**: Many-to-many optimization
- **Database Views**: Complex query optimization
- **Connection Pooling**: Database connection management

## 🌐 API Architecture

### RESTful API Design

**Resource-based URLs**:
```
GET    /api/tests/                    # List tests
POST   /api/tests/                    # Create test
GET    /api/tests/{id}/               # Get test details
PUT    /api/tests/{id}/               # Update test
DELETE /api/tests/{id}/               # Delete test

GET    /api/tests/{id}/enter/        # Enter test session
POST   /api/tests/{id}/submit-answer/ # Submit answer
POST   /api/tests/{id}/finish/        # Finish test
```

**API Features**:
- **Pagination**: `?page=1&page_size=20`
- **Filtering**: `?status=active&category=math`
- **Sorting**: `?ordering=-created_at`
- **Search**: `?search=algebra`

### API Security

**Authentication**:
```python
# JWT Authentication
class CookieJWTAuthentication(JWTAuthentication):
    def get_header(self, request):
        return request.COOKIES.get('access_token')
```

**Permission System**:
```python
# Role-based permissions
class IsTeacherOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == 'teacher'
```

## 🔄 Real-time Architecture

### WebSocket Implementation

**Django Channels**:
```python
# WebSocket consumer
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        # Process message
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )
```

**Real-time Features**:
- **Live Chat**: Course chat rooms
- **Presence Tracking**: Online/offline status
- **Typing Indicators**: Real-time typing status
- **Notifications**: Push notifications

### Message Broadcasting

**Channel Layers**:
```python
# Redis channel layer
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}
```

## 🚀 Deployment Architecture

### Production Environment

**Load Balancer**: Nginx
- **SSL Termination**: HTTPS handling
- **Static Files**: Static asset serving
- **Proxy Pass**: Backend routing
- **Rate Limiting**: Request throttling

**Application Servers**: Gunicorn + Django
- **WSGI Application**: Django WSGI
- **Process Management**: Gunicorn workers
- **Health Checks**: Application monitoring
- **Auto-scaling**: Dynamic scaling

**Database**: PostgreSQL
- **Primary Database**: Write operations
- **Read Replicas**: Read operations
- **Connection Pooling**: Database connections
- **Backup Strategy**: Automated backups

**Cache Layer**: Redis
- **Session Storage**: User sessions
- **API Caching**: Response caching
- **WebSocket Channels**: Real-time communication
- **Task Queue**: Background jobs

### CDN Architecture

**Content Delivery Network**:
- **Static Assets**: CSS, JS, images
- **Media Files**: Videos, documents
- **Global Distribution**: Worldwide CDN
- **Caching Strategy**: Edge caching

## 📈 Performance Architecture

### Caching Strategy

**Multi-layer Caching**:
```
Browser Cache
    ↓
CDN Cache
    ↓
Application Cache (Redis)
    ↓
Database Cache
    ↓
Database
```

**Cache Implementation**:
```python
# Redis caching
@cache_page(60 * 15)  # 15 minutes
def get_tests(request):
    return Test.objects.all()
```

### Database Optimization

**Query Optimization**:
- **Indexes**: Strategic database indexing
- **Query Analysis**: Performance monitoring
- **Connection Pooling**: Database connections
- **Read Replicas**: Read operation distribution

**Database Scaling**:
- **Horizontal Scaling**: Database sharding
- **Vertical Scaling**: Hardware upgrades
- **Partitioning**: Table partitioning
- **Archiving**: Historical data management

## 🔧 Monitoring Architecture

### Application Monitoring

**Performance Metrics**:
- **Response Time**: API response times
- **Throughput**: Requests per second
- **Error Rate**: Error percentage
- **Availability**: Uptime monitoring

**Monitoring Tools**:
- **Application Performance**: APM tools
- **Database Monitoring**: Database performance
- **Server Monitoring**: System metrics
- **Log Aggregation**: Centralized logging

### Security Monitoring

**Security Metrics**:
- **Authentication Failures**: Login attempts
- **Suspicious Activity**: Anomaly detection
- **Access Patterns**: User behavior analysis
- **Threat Detection**: Security threats

## 🔄 Integration Architecture

### External Services

**Payment Gateway**: Zarinpal
- **Payment Processing**: Secure payments
- **Webhook Handling**: Payment callbacks
- **Transaction Tracking**: Payment history
- **Refund Processing**: Refund handling

**Storage Service**: S3-compatible
- **File Storage**: Media and documents
- **CDN Integration**: Content delivery
- **Backup Storage**: Data backups
- **Archive Storage**: Long-term storage

**AI Service**: Google Gemini
- **Ticket Categorization**: AI-powered categorization
- **Response Generation**: Automated responses
- **Content Analysis**: Content understanding
- **Learning System**: Continuous improvement

## 📚 Related Documentation

- [API Documentation](API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Development Guide](DEVELOPMENT.md)
- [Security Guide](SECURITY.md)

---

**System Architecture** - Comprehensive technical architecture documentation
