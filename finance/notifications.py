from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .models import Order, OrderItem


def send_purchase_notification_email(order: Order):
    """
    Send email notification to admin when a student makes a purchase
    """
    try:
        # Get order details
        order_items = OrderItem.objects.filter(order=order).select_related('product')
        
        # Prepare email context
        context = {
            'order': order,
            'order_items': order_items,
            'student': order.user,
            'total_amount': order.total_amount,
        }
        
        # Render email templates
        html_message = render_to_string('finance/emails/purchase_notification.html', context)
        plain_message = strip_tags(html_message)
        
        # Email subject
        subject = f'سفارش جدید - دانش‌آموز: {order.user.username}'
        
        # Send email to admin
        if hasattr(settings, 'ADMIN_EMAIL'):
            admin_email = settings.ADMIN_EMAIL
        else:
            admin_email = 'admin@academia.com'  # Default admin email
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[admin_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return True
        
    except Exception as e:
        print(f"Error sending purchase notification email: {e}")
        return False


def send_payment_confirmation_email(order: Order):
    """
    Send email confirmation to student when payment is confirmed
    """
    try:
        # Get order details
        order_items = OrderItem.objects.filter(order=order).select_related('product')
        
        # Prepare email context
        context = {
            'order': order,
            'order_items': order_items,
            'student': order.user,
            'total_amount': order.total_amount,
        }
        
        # Render email templates
        html_message = render_to_string('finance/emails/payment_confirmation.html', context)
        plain_message = strip_tags(html_message)
        
        # Email subject
        subject = f'تأیید پرداخت - سفارش #{order.id}'
        
        # Send email to student
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return True
        
    except Exception as e:
        print(f"Error sending payment confirmation email: {e}")
        return False


def send_product_access_granted_email(order: Order):
    """
    Send email to student when product access is granted
    """
    try:
        # Get order details
        order_items = OrderItem.objects.filter(order=order).select_related('product')
        
        # Prepare email context
        context = {
            'order': order,
            'order_items': order_items,
            'student': order.user,
        }
        
        # Render email templates
        html_message = render_to_string('finance/emails/product_access_granted.html', context)
        plain_message = strip_tags(html_message)
        
        # Email subject
        subject = f'دسترسی به محصولات - سفارش #{order.id}'
        
        # Send email to student
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return True
        
    except Exception as e:
        print(f"Error sending product access granted email: {e}")
        return False
