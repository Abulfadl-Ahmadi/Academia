import os
import time
import google.generativeai as genai
from openai import OpenAI
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.conf import settings
from django.db import transaction
from requests.exceptions import RequestException, ConnectionError

from .models import AIConversation, AIMessage
from .serializers import AIConversationSerializer, AIConversationListSerializer, AIMessageSerializer

# گرفتن API Keys
GOOGLE_API_KEY = getattr(settings, 'GOOGLE_API_KEY', os.getenv('GOOGLE_API_KEY', ''))
LIARA_API_KEY = getattr(settings, 'LIARA_API_KEY', os.getenv('LIARA_API_KEY', ''))

# انتخاب مدل و کلاینت بر اساس API Key موجود
if LIARA_API_KEY:
    MODEL = "google/gemini-2.0-flash-001"
    client = OpenAI(
        base_url="https://ai.liara.ir/api/v1/689c3350a8b1b6944da510b2",
        api_key=LIARA_API_KEY,
    )
    USE_LIARA = True
    print("Using Liara API")
elif GOOGLE_API_KEY:
    MODEL = "gemini-1.5-flash"
    genai.configure(api_key=GOOGLE_API_KEY)
    client = None
    USE_LIARA = False
    print("Using Google API")
else:
    MODEL = None
    client = None
    USE_LIARA = False
    print("No API key configured")

def generate_ai_response(question, context_messages=None, max_retries=2):
    """
    تابع مشترک برای تولید پاسخ هوش مصنوعی
    """
    if not MODEL:
        raise ValueError("هیچ کلید API تنظیم نشده است")
    
    # System prompt برای فرمت صحیح ریاضی
    math_formatting_instructions = """
شما یک استاد ریاضی هستید. لطفاً در پاسخ‌هایتان قوانین زیر را رعایت کنید:

**برای فرمول‌های ریاضی:**
- برای فرمول‌های inline (درون متن): از $فرمول$ استفاده کنید
- برای فرمول‌های block (جداگانه): از $$فرمول$$ استفاده کنید
- برای توان: از ^ استفاده کنید، مثال: $x^2$ یا $x^{2n+1}$
- برای زیرنویس: از _ استفاده کنید، مثال: $x_1$ یا $x_{max}$
- برای انتگرال: $\\int$ یا $\\int_{a}^{b}$
- برای انتگرال دوگانه: $\\iint$ یا $\\iint_{S}$
- برای انتگرال سطحی: $\\iint_{S} f(x,y,z) \\, dS$
- برای مشتق جزئی: $\\frac{\\partial f}{\\partial x}$
- برای رادیکال: $\\sqrt{x}$ یا $\\sqrt[n]{x}$
- برای کسر: $\\frac{صورت}{مخرج}$

**مثال‌های صحیح:**
- متن معمولی با $x^2 + y^2 = r^2$ فرمول درون متن
- فرمول جداگانه: $$\\int_{0}^{\\pi/2} \\sin^2(\\theta) \\, d\\theta$$
- انتگرال سطحی: $$\\iint_{S} (x^2 + xy) \\, dS$$

**اشتباهات رایج که نباید کنید:**
- استفاده از HTML tags مثل <sub> یا <sup>
- نوشتن فرمول بدون $ یا $$
- استفاده از x² بجای $x^2$

لطفاً هر پاسخ ریاضی‌تان را طبق این قوانین فرمت کنید.
"""
    
    retry_count = 0
    
    while retry_count <= max_retries:
        try:
            if USE_LIARA:
                # استفاده از Liara API با OpenAI client
                messages = [
                    {"role": "system", "content": math_formatting_instructions}
                ]
                
                # اضافه کردن بافت گفتگو اگر موجود باشد
                if context_messages:
                    for msg in context_messages:
                        role = "user" if msg['role'] == 'user' else "assistant"
                        messages.append({"role": role, "content": msg['content']})
                
                # اضافه کردن سوال جدید
                messages.append({"role": "user", "content": question})
                
                completion = client.chat.completions.create(
                    model=MODEL,
                    messages=messages
                )
                return completion.choices[0].message.content
                
            else:
                # استفاده از Google Gemini مستقیم
                model = genai.GenerativeModel(MODEL)
                
                # اگر بافت موجود باشد، آن را به سوال اضافه کنیم
                prompt = f"{math_formatting_instructions}\n\n"
                
                if context_messages:
                    context = []
                    for msg in context_messages:
                        context.append(f"{msg['role']}: {msg['content']}")
                    context_text = '\n'.join(context)
                    prompt += f"با توجه به گفتگوی قبلی:\n\n{context_text}\n\nسوال جدید: {question}"
                else:
                    prompt += f"سوال: {question}"
                
                response = model.generate_content(prompt)
                return response.text
                
        except (RequestException, ConnectionError) as e:
            retry_count += 1
            print(f"Network error (attempt {retry_count}/{max_retries}): {str(e)}")
            if retry_count <= max_retries:
                time.sleep(2)  # صبر قبل از تلاش مجدد
            else:
                raise ConnectionError("خطا در ارتباط با سرویس هوش مصنوعی")
        except Exception as e:
            print(f"AI API Error: {str(e)}")
            raise Exception("خطا در دریافت پاسخ از هوش مصنوعی")


class GeminiAIView(APIView):
    """
    API برای ارتباط با Gemini (گوگل یا لیارا)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        question = request.data.get('question')
        
        if not question:
            return Response(
                {'error': 'لطفاً سوال خود را وارد کنید'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            answer = generate_ai_response(question)
            return Response({
                'answer': answer,
                'generated_by_ai': True,
                'provider': 'Liara' if USE_LIARA else 'Google'
            })
            
        except ConnectionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AIConversationViewSet(viewsets.ModelViewSet):
    """
    ویوست برای مدیریت گفتگوهای هوش مصنوعی
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AIConversationSerializer
    
    def get_queryset(self):
        """فقط گفتگوهای کاربر جاری"""
        return AIConversation.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """انتخاب سریالایزر مناسب"""
        if self.action == 'list':
            return AIConversationListSerializer
        return AIConversationSerializer
    
    @transaction.atomic
    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        """اضافه کردن پیام جدید به گفتگو"""
        conversation = self.get_object()
        content = request.data.get('content')
        
        if not content:
            return Response(
                {'error': 'لطفاً متن پیام را وارد کنید'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ایجاد پیام کاربر
        user_message = AIMessage.objects.create(
            conversation=conversation,
            role='user',
            content=content
        )
        
        try:
            # دریافت 10 پیام آخر برای بافت گفتگو
            previous_messages = list(
                conversation.messages.order_by('-created_at')[:10]
                .values('role', 'content')
            )
            # معکوس کردن ترتیب برای درست بودن تاریخچه
            context_messages = list(reversed(previous_messages))
            
            # تولید پاسخ هوش مصنوعی
            ai_response = generate_ai_response(content, context_messages)
            
            # ایجاد پیام هوش مصنوعی
            ai_message = AIMessage.objects.create(
                conversation=conversation,
                role='ai',
                content=ai_response
            )
            
            # بروزرسانی زمان آخرین بروزرسانی گفتگو
            conversation.save()
            
            print(f"AI Response: {ai_response}")
            
            return Response({
                'user_message': AIMessageSerializer(user_message).data,
                'ai_message': AIMessageSerializer(ai_message).data,
                'provider': 'Liara' if USE_LIARA else 'Google'
            })
            
        except ConnectionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            print(f"AI API Error: {str(e)}")
            return Response(
                {'error': 'خطا در دریافت پاسخ از هوش مصنوعی'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )