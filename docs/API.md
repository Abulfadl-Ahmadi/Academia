# Academia API Documentation

Comprehensive API documentation for the Academia educational platform, covering all endpoints, authentication, request/response formats, and integration examples.

## 🔗 Base URL

```
Production: https://api.academia.com
Development: http://localhost:8000/api
```

## 🔐 Authentication

### JWT Token Authentication

The API uses JWT tokens stored in HTTP-only cookies for enhanced security.

**Authentication Flow**:
1. **Login**: `POST /auth/login/` - Returns access and refresh tokens
2. **Token Storage**: Tokens stored in HTTP-only cookies
3. **Automatic Refresh**: Middleware handles token refresh
4. **Logout**: `POST /auth/logout/` - Invalidates tokens

**Headers**:
```http
Cookie: access_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### User Roles

- **Student**: Access to courses, tests, and purchased content
- **Teacher**: Course creation, test management, student monitoring
- **Admin**: Full system access and management

## 📚 API Endpoints

### Authentication Endpoints

#### User Registration
```http
POST /auth/register/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response**:
```json
{
  "message": "Registration successful. Please verify your email.",
  "user_id": 123
}
```

#### User Login
```http
POST /auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response**:
```json
{
  "message": "Login successful",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student"
  }
}
```

#### Token Refresh
```http
POST /auth/refresh/
```

**Response**:
```json
{
  "message": "Token refreshed successfully"
}
```

#### User Logout
```http
POST /auth/logout/
```

**Response**:
```json
{
  "message": "Logout successful"
}
```

### User Profile Endpoints

#### Get User Profile
```http
GET /profiles/
```

**Response**:
```json
{
  "id": 123,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student",
  "is_email_verified": true,
  "is_phone_verified": false,
  "profile": {
    "national_id": "1234567890",
    "phone_number": "09123456789",
    "birth_date": "1990-01-01",
    "grade": "12"
  }
}
```

#### Update User Profile
```http
PUT /profiles/
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "profile": {
    "national_id": "1234567890",
    "phone_number": "09123456789",
    "birth_date": "1990-01-01",
    "grade": "12"
  }
}
```

### Test Management Endpoints

#### List Tests
```http
GET /tests/
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20)
- `status`: Filter by status (`active`, `inactive`)
- `type`: Filter by type (`scheduled`, `topic_based`, `practice`)
- `search`: Search in title and description

**Response**:
```json
{
  "count": 50,
  "next": "http://api.academia.com/tests/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Mathematics Test",
      "description": "Basic mathematics concepts",
      "test_type": "scheduled",
      "content_type": "typed",
      "start_time": "2024-01-15T10:00:00Z",
      "end_time": "2024-01-15T12:00:00Z",
      "duration_minutes": 120,
      "max_attempts": 1,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Test
```http
POST /tests/
Content-Type: application/json

{
  "title": "New Test",
  "description": "Test description",
  "test_type": "scheduled",
  "content_type": "typed",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T12:00:00Z",
  "duration_minutes": 120,
  "max_attempts": 1,
  "questions": [1, 2, 3]
}
```

#### Enter Test Session
```http
POST /tests/{id}/enter/
```

**Response**:
```json
{
  "session_id": 456,
  "test": {
    "id": 1,
    "title": "Mathematics Test",
    "duration_minutes": 120,
    "questions": [
      {
        "id": 1,
        "text": "What is 2 + 2?",
        "options": [
          {"id": 1, "text": "3"},
          {"id": 2, "text": "4"},
          {"id": 3, "text": "5"},
          {"id": 4, "text": "6"}
        ]
      }
    ]
  },
  "time_left": 7200
}
```

#### Submit Answer
```http
POST /tests/{id}/submit-answer/
Content-Type: application/json

{
  "question_id": 1,
  "selected_option_id": 2,
  "time_spent_seconds": 30
}
```

**Response**:
```json
{
  "message": "Answer submitted successfully",
  "next_question": 2,
  "progress": {
    "answered": 1,
    "total": 10
  }
}
```

#### Finish Test
```http
POST /tests/{id}/finish/
```

**Response**:
```json
{
  "message": "Test completed successfully",
  "score": 85.5,
  "total_questions": 10,
  "correct_answers": 8,
  "time_taken": 3600,
  "results": {
    "pass": true,
    "grade": "B+"
  }
}
```

### Course Management Endpoints

#### List Courses
```http
GET /courses/
```

**Query Parameters**:
- `page`: Page number
- `page_size`: Items per page
- `category`: Filter by category
- `teacher`: Filter by teacher
- `search`: Search in title and description

**Response**:
```json
{
  "count": 25,
  "next": "http://api.academia.com/courses/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Advanced Mathematics",
      "description": "Comprehensive mathematics course",
      "teacher": {
        "id": 10,
        "first_name": "Dr. Smith",
        "last_name": "Johnson"
      },
      "students_count": 45,
      "is_live": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Course
```http
POST /courses/
Content-Type: application/json

{
  "title": "New Course",
  "description": "Course description",
  "category": 1,
  "vod_channel_id": "channel123",
  "rtmp_url": "rtmp://stream.example.com/live",
  "rtmp_key": "streamkey123"
}
```

#### Enroll Student
```http
POST /courses/{id}/enroll-student/
Content-Type: application/json

{
  "student_id": 123
}
```

#### Start Live Session
```http
POST /courses/{id}/start-live/
```

**Response**:
```json
{
  "message": "Live session started",
  "stream_url": "https://stream.example.com/live/channel123",
  "chat_enabled": true
}
```

### E-commerce Endpoints

#### List Products
```http
GET /shop/products/
```

**Query Parameters**:
- `type`: Filter by product type (`file`, `course`, `test`, `book`)
- `category`: Filter by category
- `price_min`: Minimum price
- `price_max`: Maximum price
- `search`: Search in title and description

**Response**:
```json
{
  "count": 100,
  "next": "http://api.academia.com/shop/products/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Mathematics Textbook",
      "description": "Comprehensive mathematics textbook",
      "product_type": "book",
      "price": "29.99",
      "current_price": "24.99",
      "is_digital": false,
      "is_physical": true,
      "stock_quantity": 50,
      "is_active": true
    }
  ]
}
```

#### Add to Cart
```http
POST /shop/products/{id}/add_to_cart/
Content-Type: application/json

{
  "quantity": 1
}
```

#### Get Cart
```http
GET /shop/cart/
```

**Response**:
```json
{
  "items": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "title": "Mathematics Textbook",
        "price": "29.99",
        "current_price": "24.99"
      },
      "quantity": 1,
      "total_price": "24.99"
    }
  ],
  "total_amount": "24.99",
  "item_count": 1
}
```

### Payment Endpoints

#### Create Order
```http
POST /finance/orders/
Content-Type: application/json

{
  "items": [
    {
      "product_id": 1,
      "quantity": 1
    }
  ],
  "discount_code": "SAVE10"
}
```

**Response**:
```json
{
  "order_id": 789,
  "order_number": "ORD-2024-001",
  "total_amount": "24.99",
  "discount_amount": "2.50",
  "final_amount": "22.49",
  "payment_url": "https://zarinpal.com/pg/StartPay/authority123"
}
```

#### Process Payment
```http
POST /finance/payments/
Content-Type: application/json

{
  "order_id": 789,
  "payment_method": "zarinpal"
}
```

### Knowledge Tree Endpoints

#### Get Knowledge Tree
```http
GET /knowledge/subjects/
```

**Response**:
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "name": "Mathematics",
      "description": "Mathematical concepts and applications",
      "chapters": [
        {
          "id": 1,
          "title": "Algebra",
          "sections": [
            {
              "id": 1,
              "title": "Linear Equations",
              "lessons": [
                {
                  "id": 1,
                  "title": "Solving Linear Equations",
                  "topics": [
                    {
                      "id": 1,
                      "title": "Basic Linear Equations",
                      "difficulty": "beginner",
                      "estimated_study_time": 30
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

#### Get Student Progress
```http
GET /knowledge/student-progress/
```

**Response**:
```json
{
  "subjects": [
    {
      "id": 1,
      "name": "Mathematics",
      "progress_percentage": 75.5,
      "topics_completed": 15,
      "total_topics": 20,
      "mastery_level": "intermediate"
    }
  ],
  "overall_progress": 68.2
}
```

### Support Ticket Endpoints

#### Create Ticket
```http
POST /tickets/
Content-Type: application/json

{
  "title": "Login Issue",
  "description": "I cannot log into my account",
  "category": "technical",
  "priority": "high"
}
```

#### Get AI Response
```http
POST /tickets/ai/chat/
Content-Type: application/json

{
  "message": "How do I reset my password?",
  "context": "user_help"
}
```

**Response**:
```json
{
  "response": "To reset your password, please follow these steps...",
  "confidence": 0.95,
  "suggestions": [
    "Check your email for reset link",
    "Contact support if issues persist"
  ]
}
```

## 📊 Response Formats

### Success Response
```json
{
  "status": "success",
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": ["This field is required"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

### Pagination Response
```json
{
  "count": 100,
  "next": "http://api.academia.com/endpoint/?page=3",
  "previous": "http://api.academia.com/endpoint/?page=1",
  "results": [
    // Array of results
  ]
}
```

## 🔒 Error Codes

### HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Custom Error Codes

- **VALIDATION_ERROR**: Input validation failed
- **AUTHENTICATION_ERROR**: Invalid credentials
- **PERMISSION_ERROR**: Insufficient permissions
- **RESOURCE_NOT_FOUND**: Resource doesn't exist
- **RATE_LIMIT_EXCEEDED**: Too many requests
- **PAYMENT_ERROR**: Payment processing failed
- **SESSION_EXPIRED**: Test session expired

## 🚀 Rate Limiting

### Rate Limits

- **Authentication**: 5 requests per minute
- **API Endpoints**: 100 requests per hour
- **File Upload**: 10 requests per hour
- **Payment**: 5 requests per hour

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 📱 Mobile API

### Mobile-specific Endpoints

```http
GET /mobile/dashboard/
GET /mobile/notifications/
POST /mobile/device-token/
```

### Push Notifications

```http
POST /notifications/send/
Content-Type: application/json

{
  "user_id": 123,
  "title": "New Test Available",
  "body": "Mathematics test is now available",
  "data": {
    "test_id": 1,
    "type": "test_notification"
  }
}
```

## 🔧 SDK Examples

### JavaScript/TypeScript

```typescript
// API client setup
const apiClient = axios.create({
  baseURL: 'https://api.academia.com',
  withCredentials: true
});

// Authentication
const login = async (email: string, password: string) => {
  const response = await apiClient.post('/auth/login/', {
    email,
    password
  });
  return response.data;
};

// Get tests
const getTests = async (page = 1) => {
  const response = await apiClient.get(`/tests/?page=${page}`);
  return response.data;
};

// Submit test answer
const submitAnswer = async (testId: number, questionId: number, optionId: number) => {
  const response = await apiClient.post(`/tests/${testId}/submit-answer/`, {
    question_id: questionId,
    selected_option_id: optionId
  });
  return response.data;
};
```

### Python

```python
import requests

class AcademiaAPI:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
    
    def login(self, email, password):
        response = self.session.post(f"{self.base_url}/auth/login/", {
            "email": email,
            "password": password
        })
        return response.json()
    
    def get_tests(self, page=1):
        response = self.session.get(f"{self.base_url}/tests/?page={page}")
        return response.json()
    
    def submit_answer(self, test_id, question_id, option_id):
        response = self.session.post(f"{self.base_url}/tests/{test_id}/submit-answer/", {
            "question_id": question_id,
            "selected_option_id": option_id
        })
        return response.json()
```

## 📚 Related Documentation

- [Architecture Documentation](ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Development Guide](DEVELOPMENT.md)
- [Security Guide](SECURITY.md)

---

**API Documentation** - Comprehensive API reference for Academia platform
