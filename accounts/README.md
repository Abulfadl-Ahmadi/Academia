# Accounts App

User management and authentication system for the Academia platform, handling user registration, authentication, verification, and profile management.

## 🏗️ Architecture Overview

The accounts app provides a comprehensive user management system with:

- **Custom User Model**: Extended Django User with roles and verification status
- **JWT Authentication**: Secure token-based authentication with cookie storage
- **Multi-factor Verification**: Email and SMS verification systems
- **Profile Management**: Extended user profiles with addresses
- **Role-based Access**: Student, teacher, and admin roles

## 📊 Models

### User Model

**Location**: `accounts/models.py`

```python
class User(AbstractUser):
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
```

**Key Features**:
- Custom user model extending Django's AbstractUser
- Role-based access control (student, teacher, admin)
- Email and phone verification status tracking
- Custom user manager for handling user creation

### UserProfile Model

**Location**: `accounts/models.py`

```python
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    national_id = models.CharField(max_length=10, validators=[validate_iranian_national_id])
    phone_number = models.CharField(max_length=11)
    birth_date = models.DateField()
    grade = models.CharField(max_length=50)
```

**Key Features**:
- One-to-one relationship with User
- Iranian national ID validation
- Phone number and birth date tracking
- Grade/education level information

### VerificationCode Model

**Location**: `accounts/models.py`

```python
class VerificationCode(models.Model):
    code = models.CharField(max_length=6)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code_type = models.CharField(max_length=10, choices=CODE_TYPE_CHOICES)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
```

**Key Features**:
- 6-digit verification codes
- Support for email and phone verification
- Automatic expiration (5 minutes)
- One-time use enforcement

### UserAddress Model

**Location**: `accounts/models.py`

```python
class UserAddress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    address = models.TextField()
    postal_code = models.CharField(max_length=10)
    city = models.CharField(max_length=100)
    province = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False)
```

**Key Features**:
- Multiple addresses per user
- Default address designation
- Complete address information
- City and province tracking

## 🔐 Authentication System

### JWT Authentication

**Location**: `api/auth.py`

The system uses custom JWT authentication with HTTP-only cookies:

```python
class CookieJWTAuthentication(JWTAuthentication):
    def get_header(self, request):
        return request.COOKIES.get('access_token')
```

**Security Features**:
- HTTP-only cookies prevent XSS attacks
- Secure cookie settings for production
- Same-site cookie protection
- Automatic token refresh

### Token Refresh Middleware

**Location**: `api/middleware.py`

```python
class RefreshTokenMiddleware:
    def __call__(self, request):
        # Automatically refresh expired access tokens
        # using refresh token from HTTP-only cookie
```

**Features**:
- Automatic token refresh
- Seamless user experience
- Security token rotation
- Error handling for invalid tokens

## 📡 API Endpoints

### Authentication Endpoints

**Base URL**: `/auth/`

#### User Registration
- **POST** `/auth/register/` - Register new user
- **POST** `/auth/complete-registration/` - Complete user profile

#### Authentication
- **POST** `/auth/login/` - User login
- **POST** `/auth/logout/` - User logout
- **POST** `/auth/refresh/` - Refresh access token

#### Verification
- **POST** `/auth/send-verification-code/` - Send email verification
- **POST** `/auth/send-phone-verification-code/` - Send SMS verification
- **POST** `/auth/verify-email/` - Verify email code
- **POST** `/auth/verify-phone/` - Verify phone code

### User Management Endpoints

**Base URL**: `/profiles/`

#### User Profile
- **GET** `/profiles/` - Get user profile
- **PUT** `/profiles/` - Update user profile
- **PATCH** `/profiles/` - Partial profile update

#### Address Management
- **GET** `/profiles/addresses/` - List user addresses
- **POST** `/profiles/addresses/` - Create new address
- **PUT** `/profiles/addresses/{id}/` - Update address
- **DELETE** `/profiles/addresses/{id}/` - Delete address

## 🔒 Security Features

### Password Security
- **Hashing**: Django's built-in PBKDF2 password hashing
- **Validation**: Strong password requirements
- **Reset**: Secure password reset functionality

### Verification Security
- **Code Generation**: Cryptographically secure random codes
- **Expiration**: 5-minute code expiration
- **Rate Limiting**: Prevention of code spam
- **One-time Use**: Codes become invalid after use

### Session Security
- **HTTP-only Cookies**: Prevent XSS attacks
- **Secure Cookies**: HTTPS-only in production
- **Same-site Protection**: CSRF protection
- **Token Rotation**: Automatic refresh token rotation

## 📱 Verification System

### Email Verification

**Process**:
1. User requests email verification
2. System generates 6-digit code
3. Email sent via Django's send_mail
4. User enters code to verify
5. User email marked as verified

**Implementation**:
```python
def send_verification_email(user, code):
    # Render HTML email template
    # Send via Django's email backend
```

### SMS Verification

**Process**:
1. User requests phone verification
2. System generates 6-digit code
3. SMS sent via sms.ir API
4. User enters code to verify
5. User phone marked as verified

**Implementation**:
```python
def send_verification_sms(phone_number, code):
    # Send SMS via sms.ir API
    # Handle API responses and errors
```

## 🛠️ Utilities

### Email Utilities

**Location**: `accounts/utils.py`

```python
def send_verification_email(user, code):
    """Send verification email with HTML template"""
    # Render email template
    # Send via Django's email backend
```

### SMS Utilities

**Location**: `accounts/utils.py`

```python
def send_verification_sms(phone_number, code):
    """Send verification SMS via sms.ir API"""
    # API integration with sms.ir
    # Error handling and logging
```

### Validation Utilities

**Location**: `accounts/validators.py`

```python
def validate_iranian_national_id(value):
    """Validate Iranian national ID format and checksum"""
    # National ID validation algorithm
    # Checksum verification
```

## 🔄 User Flow

### Registration Flow

1. **Initial Registration**
   - User provides email/phone
   - System creates user account
   - Verification codes sent

2. **Email Verification**
   - User receives email with code
   - User enters code
   - Email marked as verified

3. **Phone Verification**
   - User receives SMS with code
   - User enters code
   - Phone marked as verified

4. **Profile Completion**
   - User fills profile information
   - National ID validation
   - Address information (optional)

### Login Flow

1. **Authentication**
   - User provides credentials
   - System validates credentials
   - JWT tokens generated

2. **Token Storage**
   - Access token in HTTP-only cookie
   - Refresh token in HTTP-only cookie
   - Secure cookie settings

3. **Automatic Refresh**
   - Middleware checks token validity
   - Automatic refresh when needed
   - Seamless user experience

## 🧪 Testing

### Unit Tests

**Test Coverage**:
- User model creation and validation
- Verification code generation and validation
- Authentication flow testing
- Profile management testing

**Running Tests**:
```bash
python manage.py test accounts
```

### Integration Tests

**Test Coverage**:
- Complete registration flow
- Authentication and authorization
- API endpoint functionality
- Error handling scenarios

## 📈 Performance Considerations

### Database Optimization

- **Indexes**: Strategic indexing on frequently queried fields
- **Query Optimization**: select_related for user profiles
- **Caching**: User session caching
- **Connection Pooling**: Database connection optimization

### API Optimization

- **Pagination**: User list pagination
- **Filtering**: Efficient user filtering
- **Serialization**: Optimized serializer fields
- **Response Caching**: Cached user profile data

## 🔧 Configuration

### Settings

**Required Settings**:
```python
AUTH_USER_MODEL = 'accounts.User'
AUTHENTICATION_BACKENDS = ['api.auth.CookieJWTAuthentication']
```

**Email Configuration**:
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
```

**SMS Configuration**:
```python
SMS_API_KEY = 'your-sms-api-key'
SMS_API_URL = 'https://api.sms.ir/v1/send/verify'
```

## 🚀 Deployment Considerations

### Production Settings

- **Secure Cookies**: HTTPS-only cookie settings
- **CORS Configuration**: Proper CORS settings
- **Rate Limiting**: API rate limiting
- **Monitoring**: User authentication monitoring

### Security Hardening

- **Password Policies**: Strong password requirements
- **Account Lockout**: Brute force protection
- **Audit Logging**: Authentication event logging
- **Security Headers**: Proper security headers

## 📚 Related Documentation

- [Backend Architecture](api/README.md)
- [API Documentation](docs/API.md)
- [Security Guide](docs/SECURITY.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

---

**User Management & Authentication** - Comprehensive user system for educational platform
