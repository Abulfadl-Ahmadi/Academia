from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings


def send_verification_email(email, verification_code, user_name):
    """
    Send verification email with the provided code
    """
    subject = 'کد تایید ایمیل - آکادمی'
    
    # Render HTML template
    html_message = render_to_string('accounts/email_verification.html', {
        'verification_code': verification_code,
        'user_name': user_name,
    })
    
    # Create plain text version
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
