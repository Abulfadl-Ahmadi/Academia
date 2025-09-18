from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import requests
import json


def send_verification_email(email, verification_code, user_name):
    """
    Send verification email with the provided code
    """
    subject = 'کد تایید ایمیل - آرین تفضلی‌زاده'
    
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


def send_verification_sms(phone_number, verification_code):
    """
    Send verification SMS using sms.ir API
    """
    if not settings.SMS_IR_API_KEY:
        print("SMS_IR_API_KEY not configured")
        return False
        
    try:
        url = "https://api.sms.ir/v1/send/verify"
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'text/plain',
            'x-api-key': settings.SMS_IR_API_KEY
        }
        payload = {
            "mobile": phone_number,
            "templateId": 123456,
            "parameters": [
                {
                    "name": "Code",
                    "value": verification_code
                }
            ]
        }
        
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        
        if response.status_code == 200:
            result = response.json()
            # Assuming success if status is 1 based on sms.ir documentation
            if result.get('status') == 1:
                return True
            else:
                print(f"SMS sending failed: {result}")
                return False
        else:
            print(f"SMS API error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Error sending SMS: {e}")
        return False
