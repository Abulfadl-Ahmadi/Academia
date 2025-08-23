import os
import google.generativeai as genai
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.conf import settings
from django.db import transaction

from .models import AIConversation, AIMessage
from .serializers import AIConversationSerializer, AIConversationListSerializer, AIMessageSerializer

# تنظیم کلید API گوگل (بهتر است در settings.py تنظیم شود)
GOOGLE_API_KEY = getattr(settings, 'GOOGLE_API_KEY', os.getenv('GOOGLE_API_KEY', ''))
genai.configure(api_key=GOOGLE_API_KEY)

class GeminiAIView(APIView):
	"""
	API برای ارتباط با Gemini 2.0 Flash بدون ذخیره گفتگوها
	این نسخه برای سازگاری با کد قبلی حفظ شده است
	"""
	permission_classes = [IsAuthenticated]

	def post(self, request):
		question = request.data.get('question')
        
		if not question:
			return Response(
				{'error': 'لطفاً سوال خود را وارد کنید'},
				status=status.HTTP_400_BAD_REQUEST
			)
        
		# بررسی اعتبار کلید API
		if not GOOGLE_API_KEY:
			return Response(
				{'error': 'کلید API گوگل تنظیم نشده است'},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR
			)
            
		# تلاش مجدد در صورت شکست
		import requests
		from requests.exceptions import RequestException, ConnectionError
		import time
        
		max_retries = 2
		retry_count = 0
        
		while retry_count <= max_retries:
			try:
				# فراخوانی API گوگل
				model = genai.GenerativeModel('gemini-1.5-flash')
				response = model.generate_content(question)
                
				return Response({
					'answer': response.text,
					'generated_by_ai': True
				})
                
			except (RequestException, ConnectionError) as e:
				# در صورت خطای شبکه
				retry_count += 1
				print(f"Network error (attempt {retry_count}/{max_retries}): {str(e)}")
				if retry_count <= max_retries:
					# قبل از تلاش مجدد کمی صبر کن
					time.sleep(2)
				else:
					# اگر همه تلاش‌ها شکست خورد، خطا برگردان
					return Response(
						{'error': 'خطا در ارتباط با سرویس هوش مصنوعی'},
						status=status.HTTP_503_SERVICE_UNAVAILABLE
					)
			except Exception as e:
				# سایر خطاها
				print(f"Gemini API Error: {str(e)}")
				return Response(
					{'error': 'خطا در دریافت پاسخ از هوش مصنوعی'},
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
			# فراخوانی API گوگل
			import requests
			from requests.exceptions import RequestException, ConnectionError
			import time
            
			# بررسی اعتبار کلید API
			if not GOOGLE_API_KEY:
				return Response(
					{'error': 'کلید API گوگل تنظیم نشده است'},
					status=status.HTTP_500_INTERNAL_SERVER_ERROR
				)
                
			# تلاش مجدد در صورت شکست
			max_retries = 2
			retry_count = 0
            
			while retry_count <= max_retries:
				try:
					model = genai.GenerativeModel('gemini-1.5-flash')
                    
					# برای حفظ بافت گفتگو، تمام پیام‌های قبلی را به عنوان بافت می‌فرستیم (حداکثر 10 پیام آخر)
					previous_messages = conversation.messages.order_by('-created_at')[:10].values('role', 'content')
					context = []
					for msg in reversed(list(previous_messages)):
						context.append(f"{msg['role']}: {msg['content']}")
                    
					# اگر بافت موجود باشد، آن را به سوال اضافه می‌کنیم
					prompt = content
					if context:
						prompt = f"با توجه به گفتگوی قبلی:\n\n{'\n'.join(context)}\n\nسوال جدید: {content}"
                    
					# تلاش برای دریافت پاسخ
					response = model.generate_content(prompt)
					# اگر موفق بود، از حلقه خارج شو
					break
                    
				except (RequestException, ConnectionError) as e:
					# در صورت خطای شبکه
					retry_count += 1
					print(f"Network error (attempt {retry_count}/{max_retries}): {str(e)}")
					if retry_count <= max_retries:
						# قبل از تلاش مجدد کمی صبر کن
						time.sleep(2)
					else:
						# اگر همه تلاش‌ها شکست خورد، خطا برگردان
						return Response(
							{'error': 'خطا در ارتباط با سرویس هوش مصنوعی'},
							status=status.HTTP_503_SERVICE_UNAVAILABLE
						)
				except Exception as e:
					# سایر خطاها
					print(f"Gemini API Error: {str(e)}")
					return Response(
						{'error': 'خطا در دریافت پاسخ از هوش مصنوعی'},
						status=status.HTTP_500_INTERNAL_SERVER_ERROR
					)
            
			# ایجاد پیام هوش مصنوعی
			ai_message = AIMessage.objects.create(
				conversation=conversation,
				role='ai',
				content=response.text
			)
            
			# بروزرسانی زمان آخرین بروزرسانی گفتگو
			conversation.save()  # این خط بطور خودکار updated_at را بروز می‌کند
            
			return Response({
				'user_message': AIMessageSerializer(user_message).data,
				'ai_message': AIMessageSerializer(ai_message).data,
			})
            
		except Exception as e:
			# در صورت بروز خطا در هوش مصنوعی، پیام کاربر را حفظ می‌کنیم
			print(f"Gemini API Error: {str(e)}")
			return Response(
				{'error': 'خطا در دریافت پاسخ از هوش مصنوعی'},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR
			)
