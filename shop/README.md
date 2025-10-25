# Shop App

E-commerce system for the Academia platform, handling product management, pricing, discounts, and cart functionality for both digital and physical products.

## 🏗️ Architecture Overview

The shop app provides a comprehensive e-commerce solution with:

- **Product Management**: Digital and physical product catalog
- **Pricing System**: Dynamic pricing with discount support
- **Cart Management**: Session-based and user-based cart functionality
- **Product Types**: Multiple product categories and types
- **Access Control**: Product access management and restrictions

## 📊 Models

### Product Model

**Location**: `shop/models.py`

```python
class Product(models.Model):
    PRODUCT_TYPE_CHOICES = [
        ('file', 'File'),
        ('course', 'Course'),
        ('test', 'Test'),
        ('book', 'Book'),
        ('notebook', 'Notebook'),
        ('pamphlet', 'Pamphlet'),
        ('stationery', 'Stationery'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    product_type = models.CharField(max_length=20, choices=PRODUCT_TYPE_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_digital = models.BooleanField(default=True)
    is_physical = models.BooleanField(default=False)
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Key Features**:
- Multiple product types
- Digital and physical product support
- Stock management
- Dynamic pricing
- Active status tracking

### Product Properties

**Digital Products**:
- **Files**: PDFs, documents, media files
- **Courses**: Online course access
- **Tests**: Test collections and assessments
- **Books**: Digital books and e-books

**Physical Products**:
- **Books**: Physical textbooks and materials
- **Notebooks**: Study notebooks and workbooks
- **Pamphlets**: Educational pamphlets
- **Stationery**: Study supplies and materials

### Discount Model

**Location**: `shop/models.py`

```python
class Discount(models.Model):
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    ]
    
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    min_purchase_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    used_count = models.PositiveIntegerField(default=0)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
```

**Key Features**:
- Multiple discount types
- Usage limits and tracking
- Minimum purchase requirements
- Time-based validity
- Code-based discounts

## 💰 Pricing System

### Dynamic Pricing

**Current Price Calculation**:
```python
@property
def current_price(self):
    """Calculate current price considering active discounts"""
    # Apply active discounts
    # Calculate final price
    # Return discounted price
```

**Pricing Features**:
- Base price management
- Discount application
- Tax calculation
- Currency support

### Discount Application

**Discount Logic**:
```python
def apply_discount(product, discount_code):
    """Apply discount to product price"""
    # Validate discount code
    # Check eligibility
    # Calculate discounted price
    # Return final price
```

**Discount Types**:
- **Percentage**: Percentage-based discounts
- **Fixed Amount**: Fixed amount discounts
- **Bulk Discounts**: Quantity-based discounts
- **Category Discounts**: Product category discounts

## 🛒 Cart Management

### Session-based Cart

**For Unauthenticated Users**:
```python
def add_to_cart(request, product_id, quantity=1):
    """Add product to session-based cart"""
    # Get or create session cart
    # Add product to cart
    # Update session
    # Return cart data
```

**Session Cart Features**:
- Temporary cart storage
- Product persistence
- Quantity management
- Cart expiration

### User-based Cart

**For Authenticated Users**:
```python
def add_to_cart(request, product_id, quantity=1):
    """Add product to user cart"""
    # Get user cart
    # Add product to cart
    # Save to database
    # Return cart data
```

**User Cart Features**:
- Persistent cart storage
- User-specific carts
- Cart synchronization
- Purchase history

### Cart Operations

**Cart Functions**:
- **Add to Cart**: Add products to cart
- **Remove from Cart**: Remove products from cart
- **Update Quantity**: Modify product quantities
- **Clear Cart**: Empty cart contents
- **Get Cart Total**: Calculate cart total
- **Get Cart Count**: Count cart items

## 📡 API Endpoints

### Product Management

**Base URL**: `/shop/`

#### Product Operations
- **GET** `/products/` - List products
- **POST** `/products/` - Create product (admin only)
- **GET** `/products/{id}/` - Get product details
- **PUT** `/products/{id}/` - Update product (admin only)
- **DELETE** `/products/{id}/` - Delete product (admin only)

#### Product Actions
- **POST** `/products/{id}/add_to_cart/` - Add to cart
- **GET** `/products/{id}/reviews/` - Get product reviews
- **POST** `/products/{id}/reviews/` - Add product review

### Cart Management

**Base URL**: `/shop/cart/`

#### Cart Operations
- **GET** `/cart/` - Get cart contents
- **POST** `/cart/` - Add item to cart
- **PUT** `/cart/{id}/` - Update cart item
- **DELETE** `/cart/{id}/` - Remove cart item
- **DELETE** `/cart/` - Clear cart

#### Cart Actions
- **GET** `/cart/total/` - Get cart total
- **GET** `/cart/count/` - Get cart item count
- **POST** `/cart/apply-discount/` - Apply discount code

### Discount Management

**Base URL**: `/shop/discounts/`

#### Discount Operations
- **GET** `/discounts/` - List discounts
- **POST** `/discounts/` - Create discount (admin only)
- **GET** `/discounts/{id}/` - Get discount details
- **PUT** `/discounts/{id}/` - Update discount (admin only)
- **DELETE** `/discounts/{id}/` - Delete discount (admin only)

#### Discount Actions
- **POST** `/discounts/validate-code/` - Validate discount code
- **GET** `/discounts/active/` - Get active discounts

## 🏪 Product Types

### Digital Products

#### File Products
- **PDFs**: Educational documents and materials
- **Media**: Videos, audio files, presentations
- **Documents**: Text files, spreadsheets, presentations
- **Software**: Educational software and tools

#### Course Products
- **Online Courses**: Complete course access
- **Course Materials**: Course-specific resources
- **Live Sessions**: Live streaming access
- **VOD Content**: Video-on-demand access

#### Test Products
- **Test Collections**: Complete test packages
- **Practice Tests**: Self-assessment tests
- **Mock Exams**: Exam preparation tests
- **Question Banks**: Question collections

### Physical Products

#### Books
- **Textbooks**: Educational textbooks
- **Reference Books**: Study references
- **Workbooks**: Practice workbooks
- **Guides**: Study guides and manuals

#### Study Materials
- **Notebooks**: Study notebooks
- **Pamphlets**: Educational pamphlets
- **Stationery**: Study supplies
- **Materials**: Physical study materials

## 💳 Payment Integration

### Order Processing

**Order Flow**:
1. **Cart Review**: User reviews cart contents
2. **Checkout**: User proceeds to checkout
3. **Payment**: Payment processing
4. **Order Creation**: Order is created
5. **Access Grant**: User gains product access

### Access Control

**Digital Product Access**:
- **Immediate Access**: Instant access after payment
- **Course Access**: Course enrollment
- **Test Access**: Test collection access
- **File Access**: File download access

**Physical Product Access**:
- **Shipping**: Physical product shipping
- **Tracking**: Shipping tracking
- **Delivery**: Product delivery
- **Returns**: Return and refund process

## 🔄 Cart Workflow

### Adding to Cart

1. **Product Selection**
   - User browses products
   - Selects desired product
   - Chooses quantity
   - Adds to cart

2. **Cart Update**
   - Cart is updated
   - Total is recalculated
   - User is notified
   - Cart persists

### Cart Management

1. **Cart Review**
   - User views cart contents
   - Reviews product details
   - Checks quantities
   - Verifies pricing

2. **Cart Modification**
   - Update quantities
   - Remove products
   - Apply discounts
   - Recalculate totals

### Checkout Process

1. **Checkout Initiation**
   - User proceeds to checkout
   - Cart is validated
   - Payment method selected
   - Order is prepared

2. **Payment Processing**
   - Payment is processed
   - Order is created
   - Access is granted
   - User is notified

## 🧪 Testing

### Unit Tests

**Test Coverage**:
- Product model validation
- Cart functionality
- Discount calculation
- Pricing logic

**Running Tests**:
```bash
python manage.py test shop
```

### Integration Tests

**Test Coverage**:
- Complete cart workflow
- Payment integration
- Access control
- API endpoints

### Performance Tests

**Scenarios**:
- High-volume cart operations
- Concurrent user carts
- Discount calculation
- Database performance

## 📈 Performance Optimization

### Database Optimization

- **Indexes**: Strategic indexing on product fields
- **Query Optimization**: select_related for product relationships
- **Caching**: Product and cart caching
- **Connection Pooling**: Database connection optimization

### Cart Optimization

- **Session Management**: Efficient session handling
- **Cart Persistence**: Optimized cart storage
- **Synchronization**: Cart synchronization
- **Cleanup**: Automatic cart cleanup

### API Optimization

- **Pagination**: Product list pagination
- **Filtering**: Efficient product filtering
- **Serialization**: Optimized product serialization
- **Response Caching**: Cached product data

## 🔧 Configuration

### Shop Settings

**Default Configuration**:
```python
CART_SESSION_KEY = 'cart'
CART_EXPIRY_DAYS = 30
MAX_CART_ITEMS = 100
DISCOUNT_VALIDATION_ENABLED = True
```

### Product Settings

**Product Configuration**:
```python
DEFAULT_PRODUCT_TYPE = 'file'
STOCK_MANAGEMENT_ENABLED = True
DIGITAL_PRODUCT_ACCESS = 'immediate'
PHYSICAL_PRODUCT_SHIPPING = True
```

### Discount Settings

**Discount Configuration**:
```python
MAX_DISCOUNT_PERCENTAGE = 100
DISCOUNT_CODE_LENGTH = 8
DISCOUNT_VALIDATION_STRICT = True
BULK_DISCOUNT_ENABLED = True
```

## 🚀 Deployment Considerations

### Production Settings

- **Database**: PostgreSQL for production
- **Caching**: Redis for cart caching
- **CDN**: Product image delivery
- **Monitoring**: E-commerce performance monitoring

### Security Considerations

- **Access Control**: Product access restrictions
- **Payment Security**: Secure payment processing
- **Data Protection**: Customer data protection
- **Audit Logging**: E-commerce activity logging

### Scaling Considerations

- **Horizontal Scaling**: Multiple server instances
- **Load Balancing**: Cart distribution
- **Database Scaling**: Read replicas
- **CDN Scaling**: Global product delivery

## 📚 Related Documentation

- [Finance App](finance/README.md) - Payment processing
- [Contents App](contents/README.md) - File management
- [Backend Architecture](api/README.md)
- [API Documentation](docs/API.md)
- [Payment Guide](docs/PAYMENT.md)

---

**E-commerce System** - Comprehensive product management and shopping cart functionality
