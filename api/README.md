# Academia Backend

Django-based backend API for the Academia educational platform, providing comprehensive functionality for test management, course delivery, e-commerce, and knowledge management.

## 🏗️ Architecture Overview

The backend is built using Django 5.2.4 with Django REST Framework, following a modular app-based architecture. Each app handles a specific domain of functionality while maintaining loose coupling through well-defined APIs.

### Core Components

- **Django Framework**: Core web framework
- **Django REST Framework**: API development
- **JWT Authentication**: Secure token-based authentication
- **Database**: PostgreSQL/MySQL support
- **Storage**: AWS S3 compatible storage
- **Real-time**: Django Channels for WebSockets
- **Payment**: Zarinpal integration

## 📁 Apps Structure

```
api/
├── settings.py (Django configuration)
├── urls.py (Main URL routing)
├── auth.py (Custom JWT authentication)
├── middleware.py (Token refresh middleware)
├── admin_config.py (Custom admin configuration)
├── accounts/ (User management & authentication)
├── tests/ (Test system & question management)
├── courses/ (Course management & live streaming)
├── knowledge/ (Knowledge tree & progress tracking)
├── shop/ (E-commerce & product management)
├── finance/ (Payment processing & orders)
├── contents/ (File storage & media management)
├── tickets/ (Support system & AI integration)
├── blog/ (Content management)
├── chat/ (Real-time chat system)
└── utils/ (Shared utilities)
```

## 🚀 Setup & Installation

### Prerequisites

- Python 3.11+
- PostgreSQL or MySQL
- Virtual environment

### Installation Steps

1. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

5. **Run development server**
   ```bash
   python manage.py runserver
   ```

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

```bash
# Django Settings
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=academia
DB_USER=your-username
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=your-bucket
AWS_S3_ENDPOINT_URL=your-s3-endpoint

# External Services
GOOGLE_AI_API_KEY=your-google-ai-key
SMS_API_KEY=your-sms-api-key
ZARINPAL_MERCHANT_ID=your-merchant-id
```

### Database Configuration

The system supports multiple database backends:

- **PostgreSQL** (recommended for production)
- **MySQL** (with charset configuration)
- **SQLite** (default for development)

## 🔐 Authentication & Authorization

### JWT Authentication

The system uses JWT tokens stored in HTTP-only cookies for enhanced security:

- **Access Token**: Short-lived (15 minutes)
- **Refresh Token**: Long-lived (7 days)
- **Automatic Refresh**: Middleware handles token refresh
- **Cookie Security**: HTTP-only, secure, same-site cookies

### User Roles

- **Student**: Access to courses, tests, and purchased content
- **Teacher**: Course creation, test management, student monitoring
- **Admin**: Full system access and management

### Permission System

- **IsAuthenticated**: Basic authentication required
- **IsTeacher**: Teacher role required
- **IsAdmin**: Admin role required
- **Custom Permissions**: App-specific permissions

## 📊 API Design Patterns

### ViewSets

Most functionality is implemented using Django REST Framework ViewSets:

- **ModelViewSet**: Full CRUD operations
- **ReadOnlyModelViewSet**: Read-only operations
- **Custom Actions**: Business logic methods

### Serializers

- **Model Serializers**: Automatic field serialization
- **Custom Serializers**: Complex business logic
- **Nested Serializers**: Related object handling
- **Validation**: Custom field and object validation

### Pagination

- **Page Number Pagination**: Default pagination
- **Custom Page Size**: Configurable per endpoint
- **Cursor Pagination**: For large datasets

## 🗄️ Database Schema

### Key Models

- **User**: Custom user model with roles
- **Test**: Test management and sessions
- **Course**: Course and session management
- **Product**: E-commerce products
- **Order**: Payment and access control
- **Knowledge**: Hierarchical knowledge tree

### Relationships

- **One-to-One**: User ↔ UserProfile
- **One-to-Many**: Course → Sessions, Test → Questions
- **Many-to-Many**: Course ↔ Students, Test ↔ Folders

## 🧪 Testing

### Running Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test accounts
python manage.py test tests

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

### Test Structure

- **Unit Tests**: Model and utility function tests
- **Integration Tests**: API endpoint tests
- **Authentication Tests**: Security and permission tests
- **Performance Tests**: Load and stress testing

## 📈 Performance Optimization

### Database Optimization

- **Indexes**: Strategic database indexing
- **Query Optimization**: select_related and prefetch_related
- **Caching**: Redis caching for frequently accessed data
- **Connection Pooling**: Database connection optimization

### API Optimization

- **Pagination**: Limit result sets
- **Filtering**: Query parameter filtering
- **Throttling**: Rate limiting for API endpoints
- **Compression**: Response compression

## 🔒 Security Features

### Authentication Security

- **JWT Tokens**: Secure token-based authentication
- **Cookie Security**: HTTP-only, secure cookies
- **Token Rotation**: Automatic refresh token rotation
- **Session Management**: Secure session handling

### Data Protection

- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: ORM-based queries
- **XSS Protection**: Content Security Policy
- **CSRF Protection**: Cross-site request forgery protection

### Test Security

- **Device Fingerprinting**: Unique device identification
- **Session Validation**: Time and device-based validation
- **Anti-cheating**: Multiple security measures
- **Audit Logging**: Comprehensive activity logging

## 🚀 Deployment

### Production Settings

- **DEBUG=False**: Disable debug mode
- **ALLOWED_HOSTS**: Configure allowed hosts
- **SECURE_SSL_REDIRECT**: Force HTTPS
- **SECURE_COOKIES**: Secure cookie settings

### Static Files

- **AWS S3**: Static file storage
- **CDN**: Content delivery network
- **Collectstatic**: Django static file collection

### Database Migration

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Backup database
python manage.py dumpdata > backup.json
```

## 📚 App Documentation

- [Accounts App](accounts/README.md) - User management and authentication
- [Tests App](tests/README.md) - Test system and question management
- [Courses App](courses/README.md) - Course management and live streaming
- [Knowledge App](knowledge/README.md) - Knowledge tree and progress tracking
- [Shop App](shop/README.md) - E-commerce and product management
- [Finance App](finance/README.md) - Payment processing and orders
- [Contents App](contents/README.md) - File storage and media management
- [Tickets App](tickets/README.md) - Support system and AI integration
- [Blog App](blog/README.md) - Content management
- [Chat App](chat/README.md) - Real-time chat system

## 🛠️ Development

### Code Standards

- **PEP 8**: Python style guide compliance
- **Type Hints**: Type annotations for better code clarity
- **Docstrings**: Comprehensive function documentation
- **Error Handling**: Proper exception handling

### Git Workflow

1. **Feature Branches**: Create feature branches for new development
2. **Code Review**: All changes require code review
3. **Testing**: All changes must include tests
4. **Documentation**: Update documentation for new features

### Debugging

- **Django Debug Toolbar**: Development debugging
- **Logging**: Comprehensive logging system
- **Error Tracking**: Production error monitoring
- **Performance Monitoring**: API performance tracking

## 🔄 Maintenance

### Regular Tasks

- **Database Backups**: Automated daily backups
- **Log Rotation**: Log file management
- **Security Updates**: Regular dependency updates
- **Performance Monitoring**: System performance tracking

### Monitoring

- **Health Checks**: API health monitoring
- **Error Tracking**: Production error monitoring
- **Performance Metrics**: Response time and throughput
- **User Analytics**: Usage pattern analysis

---

**Backend API Documentation** - Comprehensive Django REST API for educational platform
