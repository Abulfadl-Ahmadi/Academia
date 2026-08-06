from django.db import models
from django.conf import settings
from django.utils import timezone
from courses.models import Course


class SubscriptionTier(models.TextChoices):
    """3-Tier subscription plan."""
    BASIC = 'basic', 'Basic'
    SCHOLAR = 'scholar', 'Scholar'
    GENIUS = 'genius', 'Genius'


class ChatMessage(models.Model):
    """Legacy course chat message (kept for backward compatibility)."""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='chat_messages')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Message from {self.user.username if self.user else "Anonymous"} in {self.course.title} at {self.timestamp}'

    class Meta:
        ordering = ['timestamp']


class AIConversation(models.Model):
    """AI chat conversation with a student."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_chat_conversations',
        verbose_name='کاربر'
    )
    title = models.CharField(max_length=255, verbose_name='عنوان گفتگو', default='گفتگوی جدید')
    is_pinned = models.BooleanField(default=False, verbose_name='پین شده')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاریخ بروزرسانی')

    class Meta:
        verbose_name = 'گفتگوی هوش مصنوعی'
        verbose_name_plural = 'گفتگوهای هوش مصنوعی'
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.title} - {self.user.username}'


class AIMessage(models.Model):
    """Message within an AI conversation."""
    ROLE_CHOICES = [
        ('user', 'کاربر'),
        ('assistant', 'هوش مصنوعی'),
        ('system', 'سیستم'),
    ]

    conversation = models.ForeignKey(
        AIConversation,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='گفتگو'
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, verbose_name='نقش')
    content = models.TextField(verbose_name='محتوا')
    model_tier = models.PositiveSmallIntegerField(default=2, verbose_name='تییر مدل')
    model_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='نام مدل')
    reasoning = models.TextField(blank=True, null=True, verbose_name='استدلال مدل')
    tokens_used = models.PositiveIntegerField(default=0, verbose_name='توکن مصرفی')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')

    class Meta:
        verbose_name = 'پیام هوش مصنوعی'
        verbose_name_plural = 'پیام‌های هوش مصنوعی'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.role}: {self.content[:50]}...'


class AIAttachment(models.Model):
    """File attachment (image/PDF) for an AI message."""
    ATTACHMENT_TYPES = [
        ('image', 'تصویر'),
        ('pdf', 'PDF'),
        ('text', 'متن'),
    ]

    message = models.ForeignKey(
        AIMessage,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name='پیام'
    )
    file = models.FileField(upload_to='ai_attachments/', verbose_name='فایل')
    attachment_type = models.CharField(max_length=10, choices=ATTACHMENT_TYPES, verbose_name='نوع فایل')
    original_name = models.CharField(max_length=255, blank=True, verbose_name='نام اصلی')
    file_size = models.PositiveIntegerField(default=0, verbose_name='حجم فایل')
    page_count = models.PositiveIntegerField(default=0, verbose_name='تعداد صفحات')
    extracted_text = models.TextField(blank=True, verbose_name='متن استخراج شده')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ آپلود')

    class Meta:
        verbose_name = 'پیوست هوش مصنوعی'
        verbose_name_plural = 'پیوست‌های هوش مصنوعی'

    def __str__(self):
        return f'{self.original_name or self.file.name} ({self.attachment_type})'


class UserSubscription(models.Model):
    """User's current subscription tier and quota state."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_subscription',
        verbose_name='کاربر'
    )
    tier = models.CharField(
        max_length=10,
        choices=SubscriptionTier.choices,
        default=SubscriptionTier.BASIC,
        verbose_name='پلن اشتراک'
    )
    # Daily usage counters (reset via cron / middleware)
    daily_tier1_used = models.PositiveIntegerField(default=0, verbose_name='مصرف روزانه Tier 1')
    daily_tier2_used = models.PositiveIntegerField(default=0, verbose_name='مصرف روزانه Tier 2')
    daily_tier3_used = models.PositiveIntegerField(default=0, verbose_name='مصرف روزانه Tier 3')
    daily_pdf_used = models.PositiveIntegerField(default=0, verbose_name='مصرف روزانه PDF')
    daily_image_used = models.PositiveIntegerField(default=0, verbose_name='مصرف روزانه تصویر')
    last_reset_date = models.DateField(default=timezone.now, verbose_name='تاریخ آخرین ریست')
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ انقضا')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاریخ بروزرسانی')

    class Meta:
        verbose_name = 'اشتراک هوش مصنوعی'
        verbose_name_plural = 'اشتراک‌های هوش مصنوعی'

    def __str__(self):
        return f'{self.user.username} - {self.get_tier_display()}'

    @property
    def is_active(self):
        if not self.expires_at:
            return True  # Basic is always active
        return timezone.now() <= self.expires_at

    def reset_daily_if_needed(self):
        """Reset daily counters if the date changed."""
        today = timezone.localdate()
        if self.last_reset_date != today:
            self.daily_tier1_used = 0
            self.daily_tier2_used = 0
            self.daily_tier3_used = 0
            self.daily_pdf_used = 0
            self.daily_image_used = 0
            self.last_reset_date = today
            self.save(update_fields=[
                'daily_tier1_used', 'daily_tier2_used', 'daily_tier3_used',
                'daily_pdf_used', 'daily_image_used', 'last_reset_date'
            ])

    def get_quota(self):
        """Return quota limits for the current tier."""
        from .services.quotas import TIER_QUOTAS
        return TIER_QUOTAS[self.tier]

    def get_usage(self):
        """Return current usage for the tier."""
        self.reset_daily_if_needed()
        return {
            'tier1': self.daily_tier1_used,
            'tier2': self.daily_tier2_used,
            'tier3': self.daily_tier3_used,
            'pdf': self.daily_pdf_used,
            'image': self.daily_image_used,
        }

    def get_remaining(self):
        """Return remaining quota for the tier."""
        quota = self.get_quota()
        usage = self.get_usage()
        return {
            'tier1': max(0, quota['tier1_daily'] - usage['tier1']),
            'tier2': max(0, quota['tier2_daily'] - usage['tier2']),
            'tier3': max(0, quota['tier3_daily'] - usage['tier3']),
            'pdf': max(0, quota['pdf_daily'] - usage['pdf']),
            'image': max(0, quota['image_daily'] - usage['image']),
        }

    def can_use_tier(self, tier: int) -> tuple[bool, str | None]:
        """Check if user can use a given model tier."""
        self.reset_daily_if_needed()
        quota = self.get_quota()
        usage = self.get_usage()

        # Check tier access
        max_tier = quota['max_tier']
        if tier > max_tier:
            return False, f"پلن شما به مدل Tier {tier} دسترسی ندارد. برای ارتقا به پلن بالاتر اقدام کنید."

        # Check daily quota for that tier
        tier_key = f'tier{tier}'
        if usage[tier_key] >= quota[f'{tier_key}_daily']:
            return False, f"سهمیه روزانه مدل Tier {tier} شما به پایان رسیده است. فردا دوباره تلاش کنید یا پلن خود را ارتقا دهید."

        return True, None

    def record_usage(self, tier: int, pdf_count: int = 0, image_count: int = 0):
        """Record usage after a successful AI call."""
        self.reset_daily_if_needed()
        if tier == 1:
            self.daily_tier1_used += 1
        elif tier == 2:
            self.daily_tier2_used += 1
        elif tier == 3:
            self.daily_tier3_used += 1
        self.daily_pdf_used += pdf_count
        self.daily_image_used += image_count
        self.save(update_fields=[
            'daily_tier1_used', 'daily_tier2_used', 'daily_tier3_used',
            'daily_pdf_used', 'daily_image_used', 'updated_at'
        ])