# Finance App

Payment processing and financial management system for the Academia platform, handling orders, transactions, payments, and user access control.

## 🏗️ Architecture Overview

The finance app provides a comprehensive financial management system with:

- **Order Management**: Order creation, processing, and fulfillment
- **Payment Processing**: Zarinpal payment gateway integration
- **Transaction Tracking**: Complete transaction history and auditing
- **Access Control**: User access management for purchased products
- **Financial Reporting**: Revenue tracking and analytics

## 📊 Models

### Order Model

**Location**: `finance/models.py`

```python
class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    order_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50, default='zarinpal')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Key Features**:
- Unique order numbering
- Status tracking
- Amount calculations
- Payment method tracking
- Timestamp management

### OrderItem Model

**Location**: `finance/models.py`

```python
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('shop.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Key Features**:
- Order-product relationship
- Quantity tracking
- Price calculations
- Item-level details

### Transaction Model

**Location**: `finance/models.py`

```python
class Transaction(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('payment', 'Payment'),
        ('refund', 'Refund'),
        ('partial_refund', 'Partial Refund'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('zarinpal', 'Zarinpal'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
```

**Key Features**:
- Transaction type tracking
- Payment method identification
- Reference ID management
- Status monitoring
- Completion tracking

### UserAccess Model

**Location**: `finance/models.py`

```python
class UserAccess(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey('shop.Product', on_delete=models.CASCADE)
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    access_type = models.CharField(max_length=20, default='purchase')
    granted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
```

**Key Features**:
- User-product access relationship
- Order-based access granting
- Access type classification
- Expiration management
- Active status tracking

### Payment Model

**Location**: `finance/models.py`

```python
class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    zarinpal_authority = models.CharField(max_length=100, blank=True)
    zarinpal_ref_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    callback_url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
```

**Key Features**:
- Zarinpal integration
- Payment status tracking
- Authority and reference ID management
- Callback URL handling
- Completion tracking

## 💳 Payment Gateway Integration

### Zarinpal Integration

**Payment Initialization**:
```python
def initiate_payment(order):
    """Initialize Zarinpal payment for order"""
    # Create payment request
    # Generate authority code
    # Return payment URL
    # Store payment details
```

**Payment Verification**:
```python
def verify_payment(authority, status):
    """Verify Zarinpal payment completion"""
    # Verify payment status
    # Get reference ID
    # Update order status
    # Grant user access
```

### Payment Flow

**Payment Process**:
1. **Order Creation**: Order is created with pending status
2. **Payment Initialization**: Zarinpal payment is initiated
3. **User Redirect**: User is redirected to Zarinpal
4. **Payment Processing**: User completes payment
5. **Callback Handling**: Payment callback is processed
6. **Verification**: Payment is verified
7. **Access Grant**: User gains product access

### Payment Security

**Security Features**:
- **HTTPS**: Secure payment communication
- **Validation**: Payment amount validation
- **Verification**: Payment status verification
- **Audit Trail**: Complete payment logging

## 📡 API Endpoints

### Order Management

**Base URL**: `/finance/orders/`

#### Order Operations
- **GET** `/orders/` - List user orders
- **POST** `/orders/` - Create new order
- **GET** `/orders/{id}/` - Get order details
- **PUT** `/orders/{id}/` - Update order status
- **DELETE** `/orders/{id}/` - Cancel order

#### Order Actions
- **POST** `/orders/{id}/update_status/` - Update order status
- **GET** `/orders/{id}/items/` - Get order items
- **POST** `/orders/{id}/refund/` - Process refund

### Transaction Management

**Base URL**: `/finance/transactions/`

#### Transaction Operations
- **GET** `/transactions/` - List user transactions
- **GET** `/transactions/{id}/` - Get transaction details
- **POST** `/transactions/` - Create transaction
- **PUT** `/transactions/{id}/` - Update transaction

### Payment Management

**Base URL**: `/finance/payments/`

#### Payment Operations
- **GET** `/payments/` - List payments
- **POST** `/payments/` - Create payment
- **GET** `/payments/{id}/` - Get payment details
- **POST** `/payments/{id}/verify/` - Verify payment

#### Payment Actions
- **POST** `/payments/initiate/` - Initiate payment
- **POST** `/payments/callback/` - Handle payment callback
- **GET** `/payments/{id}/status/` - Get payment status

### User Access Management

**Base URL**: `/finance/user-access/`

#### Access Operations
- **GET** `/user-access/` - List user access
- **GET** `/user-access/{id}/` - Get access details
- **POST** `/user-access/` - Grant access
- **PUT** `/user-access/{id}/` - Update access
- **DELETE** `/user-access/{id}/` - Revoke access

## 🔄 Order Workflow

### Order Creation

1. **Cart Review**
   - User reviews cart contents
   - Validates product availability
   - Checks pricing and discounts
   - Confirms order details

2. **Order Processing**
   - Order is created
   - Order items are added
   - Total amount is calculated
   - Order status is set to pending

3. **Payment Initiation**
   - Payment is initialized
   - User is redirected to payment gateway
   - Payment details are stored
   - Order status is updated

### Payment Processing

1. **Payment Gateway**
   - User completes payment
   - Payment gateway processes payment
   - Callback is triggered
   - Payment status is updated

2. **Payment Verification**
   - Payment is verified
   - Transaction is recorded
   - Order status is updated
   - User access is granted

3. **Order Completion**
   - Order is marked as completed
   - User receives confirmation
   - Product access is granted
   - Order is archived

### Access Management

1. **Access Granting**
   - User access is created
   - Product access is enabled
   - Access permissions are set
   - User is notified

2. **Access Monitoring**
   - Access is monitored
   - Usage is tracked
   - Expiration is managed
   - Access is maintained

## 💰 Financial Management

### Revenue Tracking

**Revenue Metrics**:
- Total revenue
- Revenue by product
- Revenue by time period
- Revenue by user segment

**Revenue Calculation**:
```python
def calculate_revenue(start_date, end_date):
    """Calculate revenue for date range"""
    # Get completed orders
    # Calculate total amounts
    # Return revenue data
```

### Transaction Analytics

**Analytics Features**:
- Transaction volume
- Payment success rates
- Average order value
- Payment method distribution

### Financial Reporting

**Report Types**:
- Daily revenue reports
- Monthly financial summaries
- Product performance reports
- User purchase analytics

## 🧪 Testing

### Unit Tests

**Test Coverage**:
- Order model validation
- Payment processing
- Transaction tracking
- Access management

**Running Tests**:
```bash
python manage.py test finance
```

### Integration Tests

**Test Coverage**:
- Complete payment flow
- Order processing
- Access granting
- API endpoints

### Payment Testing

**Test Scenarios**:
- Successful payments
- Failed payments
- Payment cancellations
- Refund processing

## 📈 Performance Optimization

### Database Optimization

- **Indexes**: Strategic indexing on order fields
- **Query Optimization**: select_related for order relationships
- **Caching**: Order and transaction caching
- **Connection Pooling**: Database connection optimization

### Payment Optimization

- **Async Processing**: Asynchronous payment processing
- **Caching**: Payment status caching
- **Retry Logic**: Payment retry mechanisms
- **Monitoring**: Payment performance monitoring

### API Optimization

- **Pagination**: Order and transaction pagination
- **Filtering**: Efficient order filtering
- **Serialization**: Optimized order serialization
- **Response Caching**: Cached order data

## 🔧 Configuration

### Finance Settings

**Default Configuration**:
```python
ORDER_NUMBER_PREFIX = 'ORD'
PAYMENT_TIMEOUT = 1800  # 30 minutes
REFUND_WINDOW_DAYS = 30
ACCESS_GRANT_DELAY = 0  # seconds
```

### Payment Settings

**Zarinpal Configuration**:
```python
ZARINPAL_MERCHANT_ID = 'your-merchant-id'
ZARINPAL_SANDBOX = False
ZARINPAL_CALLBACK_URL = 'https://yourdomain.com/payment/callback/'
ZARINPAL_VERIFY_URL = 'https://api.zarinpal.com/pg/v4/payment/verify.json'
```

### Access Settings

**Access Configuration**:
```python
DEFAULT_ACCESS_DURATION = None  # Permanent access
ACCESS_GRANT_NOTIFICATION = True
ACCESS_REVOKE_NOTIFICATION = True
ACCESS_AUDIT_LOGGING = True
```

## 🚀 Deployment Considerations

### Production Settings

- **Database**: PostgreSQL for production
- **Caching**: Redis for payment caching
- **Monitoring**: Payment performance monitoring
- **Backup**: Financial data backup

### Security Considerations

- **Payment Security**: Secure payment processing
- **Data Protection**: Financial data protection
- **Access Control**: Payment access restrictions
- **Audit Logging**: Financial activity logging

### Compliance

- **PCI DSS**: Payment card industry compliance
- **Data Protection**: Financial data protection
- **Audit Requirements**: Financial audit compliance
- **Regulatory**: Financial regulatory compliance

## 📚 Related Documentation

- [Shop App](shop/README.md) - Product management
- [Accounts App](accounts/README.md) - User management
- [Backend Architecture](api/README.md)
- [API Documentation](docs/API.md)
- [Payment Guide](docs/PAYMENT.md)

---

**Financial Management System** - Comprehensive payment processing and order management
