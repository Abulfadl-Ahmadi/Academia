from django.db import models
from django.conf import settings
from django.utils import timezone

class TicketStatus(models.TextChoices):
    OPEN = 'open', 'باز'
    IN_PROGRESS = 'in_progress', 'در حال بررسی'
    RESOLVED = 'resolved', 'حل شده'
    CLOSED = 'closed', 'بسته شده'

class TicketPriority(models.TextChoices):
    LOW = 'low', 'کم'
    MEDIUM = 'medium', 'متوسط'
    HIGH = 'high', 'زیاد'
    URGENT = 'urgent', 'فوری'

class TicketCategory(models.TextChoices):
    TECHNICAL = 'technical', 'مشکل فنی'
    CONTENT = 'content', 'محتوا'
    BILLING = 'billing', 'پرداخت'
    ACCOUNT = 'account', 'حساب کاربری'
    OTHER = 'other', 'سایر'

class Ticket(models.Model):
    title = models.CharField(max_length=255, verbose_name='عنوان')
    description = models.TextField(verbose_name='توضیحات')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_tickets',
        verbose_name='ایجاد کننده'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
        verbose_name='مسئول رسیدگی'
    )
    status = models.CharField(
        max_length=20,
        choices=TicketStatus.choices,
        default=TicketStatus.OPEN,
        verbose_name='وضعیت'
    )
    priority = models.CharField(
        max_length=20,
        choices=TicketPriority.choices,
        default=TicketPriority.MEDIUM,
        verbose_name='اولویت'
    )
    category = models.CharField(
        max_length=20,
        choices=TicketCategory.choices,
        default=TicketCategory.OTHER,
        verbose_name='دسته‌بندی'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاریخ بروزرسانی')
    
    class Meta:
        verbose_name = 'تیکت'
        verbose_name_plural = 'تیکت‌ها'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title

class TicketResponse(models.Model):
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='responses',
        verbose_name='تیکت'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ticket_responses',
        verbose_name='کاربر'
    )
    content = models.TextField(verbose_name='محتوا')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    
    class Meta:
        verbose_name = 'پاسخ تیکت'
        verbose_name_plural = 'پاسخ‌های تیکت'
        ordering = ['created_at']
    
    def __str__(self):
        return f'پاسخ به {self.ticket.title} توسط {self.user.username}'

class TicketAttachment(models.Model):
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name='تیکت',
        null=True,
        blank=True
    )
    response = models.ForeignKey(
        TicketResponse,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name='پاسخ',
        null=True,
        blank=True
    )
    file = models.FileField(upload_to='ticket_attachments/', verbose_name='فایل')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ آپلود')
    
    class Meta:
        verbose_name = 'پیوست تیکت'
        verbose_name_plural = 'پیوست‌های تیکت'
    
    def __str__(self):
        if self.ticket:
            return f'پیوست تیکت {self.ticket.id}'
        return f'پیوست پاسخ {self.response.id}'


class AIConversation(models.Model):
    """مدل گفتگو با هوش مصنوعی"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_conversations',
        verbose_name='کاربر'
    )
    title = models.CharField(max_length=255, verbose_name='عنوان گفتگو')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاریخ بروزرسانی')
    
    class Meta:
        verbose_name = 'گفتگو با هوش مصنوعی'
        verbose_name_plural = 'گفتگوهای هوش مصنوعی'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f'{self.title} - {self.user.username}'


class AIMessage(models.Model):
    """پیام‌های رد و بدل شده با هوش مصنوعی"""
    ROLE_CHOICES = [
        ('user', 'کاربر'),
        ('ai', 'هوش مصنوعی'),
    ]
    
    conversation = models.ForeignKey(
        AIConversation,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='گفتگو'
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, verbose_name='نقش')
    content = models.TextField(verbose_name='محتوا')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    
    class Meta:
        verbose_name = 'پیام هوش مصنوعی'
        verbose_name_plural = 'پیام‌های هوش مصنوعی'
        ordering = ['created_at']
    
    def __str__(self):
        return f'{self.role}: {self.content[:50]}...'
