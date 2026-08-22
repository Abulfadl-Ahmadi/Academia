from django.utils import timezone


def user_has_product_access(user, product) -> bool:
    """
    Check if a user already has active access/ownership of a digital product.
    Physical products always return False because they can be purchased multiple times.
    """
    if not user or not getattr(user, 'is_authenticated', False):
        return False

    # Physical products can be purchased multiple times
    if getattr(product, 'is_physical_product', False):
        return False

    from finance.models import UserAccess, OrderItem, Order

    # 1. Check UserAccess table
    user_access = UserAccess.objects.filter(
        user=user,
        product=product,
        is_active=True
    ).first()
    if user_access:
        if not user_access.is_expired:
            return True

    # 2. Check if product is in any PAID order of the user
    if OrderItem.objects.filter(
        order__user=user,
        order__status=Order.OrderStatus.PAID,
        product=product
    ).exists():
        return True

    # 3. Check Course enrollment if product is linked to a course
    if getattr(product, 'course', None):
        if product.course.students.filter(id=user.id).exists():
            return True

    # 4. Check Test enrollment if product is linked to a test collection
    if getattr(product, 'test', None):
        if product.test.students.filter(id=user.id).exists():
            return True

    return False
