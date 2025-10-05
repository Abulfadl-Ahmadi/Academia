import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage
from courses.models import Course
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.course_id = self.scope['url_route']['kwargs']['course_id']
        self.course_group_name = f'chat_{self.course_id}'
        self.user = self.scope['user']

        # Allow anonymous users for chat
        # if not self.user.is_authenticated:
        #     await self.close()
        #     return

        # Check if user is part of the course (either teacher or student) - skip for anonymous
        if self.user.is_authenticated and not await self.is_user_in_course():
            await self.close()
            return

        # Join room group
        await self.channel_layer.group_add(
            self.course_group_name,
            self.channel_name
        )

        await self.accept()

        # Send last 50 messages
        messages = await self.get_last_50_messages()
        await self.send(text_data=json.dumps({
            'type': 'last_50_messages',
            'messages': messages
        }))


    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.course_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        if not message:
            return

        # Save message to database
        new_message = await self.save_message(message)

        # Send message to room group
        await self.channel_layer.group_send(
            self.course_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': new_message.id,
                    'user': self.user.username if self.user.is_authenticated else 'Anonymous',
                    'user_id': self.user.id if self.user.is_authenticated else None,
                    'first_name': self.user.first_name if self.user.is_authenticated else '',
                    'last_name': self.user.last_name if self.user.is_authenticated else '',
                    'message': new_message.message,
                    'timestamp': new_message.timestamp.isoformat()
                }
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        
        # Check if user should see this message based on chat mode
        should_show_message = await self.should_show_message(message)
        
        if should_show_message:
            # Send message to WebSocket
            await self.send(text_data=json.dumps({
                'type': 'chat_message',
                'message': message
            }))

    @database_sync_to_async
    def should_show_message(self, message):
        try:
            course = Course.objects.get(id=self.course_id)
            
            # اگر کاربر معلم است، همیشه همه پیام‌ها را می‌بیند
            if self.user.is_authenticated and self.user == course.teacher:
                return True
            
            # اگر mode public است، همه می‌توانند همه پیام‌ها را ببینند
            if course.chat_mode == 'public':
                return True
            
            # اگر mode private است، دانش‌آموزان فقط پیام‌های خودشان و معلم را می‌بینند
            if course.chat_mode == 'private':
                # اگر پیام از معلم است یا از خود کاربر است (برای authenticated)
                if message['user_id'] == course.teacher.id or (self.user.is_authenticated and message['user_id'] == self.user.id):
                    return True
                return False
            
            return True  # default: نمایش پیام
        except Course.DoesNotExist:
            return False

    @database_sync_to_async
    def is_user_in_course(self):
        try:
            course = Course.objects.get(id=self.course_id)
            if self.user == course.teacher or self.user in course.students.all():
                return True
        except Course.DoesNotExist:
            return False
        return False

    @database_sync_to_async
    def get_last_50_messages(self):
        try:
            course = Course.objects.get(id=self.course_id)
            messages = ChatMessage.objects.filter(course_id=self.course_id).order_by('-timestamp')[:50]
            
            filtered_messages = []
            for msg in reversed(messages):
                message_data = {
                    'id': msg.id,
                    'user': msg.user.username,
                    'user_id': msg.user.id,
                    'first_name': msg.user.first_name,
                    'last_name': msg.user.last_name,
                    'message': msg.message,
                    'timestamp': msg.timestamp.isoformat()
                }
                
                # بررسی اینکه آیا کاربر باید این پیام را ببیند یا نه
                should_show = True
                if course.chat_mode == 'private' and self.user.is_authenticated and self.user != course.teacher:
                    # در حالت private، دانش‌آموزان فقط پیام‌های خودشان و معلم را می‌بینند
                    if msg.user and msg.user.id != course.teacher.id and msg.user.id != self.user.id:
                        should_show = False
                
                if should_show:
                    filtered_messages.append(message_data)
                    
            return filtered_messages
        except Course.DoesNotExist:
            return []

    @database_sync_to_async
    def save_message(self, message):
        return ChatMessage.objects.create(
            course_id=self.course_id,
            user=self.user if self.user.is_authenticated else None,
            message=message
        )
