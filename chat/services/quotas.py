"""
Tiered Subscription Quota Configuration
=======================================
Defines daily limits, context windows, and file upload caps per plan tier.
"""

# Quota configuration per subscription tier
TIER_QUOTAS = {
    'basic': {
        'max_tier': 1,
        'tier1_daily': 20,
        'tier2_daily': 0,
        'tier3_daily': 0,
        'pdf_daily': 1,
        'pdf_max_pages': 5,
        'image_daily': 3,
        'image_max_size_mb': 5,
        'context_window': 8000,
        'max_file_size_mb': 10,
    },
    'scholar': {
        'max_tier': 2,
        'tier1_daily': 100,
        'tier2_daily': 50,
        'tier3_daily': 10,
        'pdf_daily': 5,
        'pdf_max_pages': 50,
        'image_daily': 20,
        'image_max_size_mb': 10,
        'context_window': 32000,
        'max_file_size_mb': 50,
    },
    'genius': {
        'max_tier': 3,
        'tier1_daily': 500,
        'tier2_daily': 250,
        'tier3_daily': 100,
        'pdf_daily': 20,
        'pdf_max_pages': 500,
        'image_daily': 100,
        'image_max_size_mb': 20,
        'context_window': 128000,
        'max_file_size_mb': 200,
    },
}

# Model mapping per tier
TIER_MODELS = {
    1: {
        'name': 'gemini-2.0-flash-lite',
        'display_name': 'Gemini 2.0 Flash Lite',
        'description': 'سریع و کم‌هزینه برای سوالات ساده',
        'provider': 'google',
    },
    2: {
        'name': 'gemini-2.0-flash',
        'display_name': 'Gemini 2.0 Flash',
        'description': 'متعادل برای تکالیف و توضیحات',
        'provider': 'google',
    },
    3: {
        'name': 'gemini-2.5-pro',
        'display_name': 'Gemini 2.5 Pro',
        'description': 'پیشرفته برای مسائل پیچیده و تحلیل عمیق',
        'provider': 'google',
    },
}

# Educational system prompt (encouraging tutor)
EDUCATIONAL_SYSTEM_PROMPT = """\
شما یک دستیار آموزشی حرفه‌ای و مشوق هستید که به دانش‌آموزان کمک می‌کند مفاهیم را عمیقاً یاد بگیرند.

قوانین آموزشی:
1. **راهنمایی قبل از پاسخ مستقیم**: ابتدا سعی کنید با سوالات راهنما، دانش‌آموز را به سمت پاسخ هدایت کنید. فقط در صورتی که دانش‌آموز صریحاً درخواست پاسخ کامل کند، پاسخ کامل بدهید.
2. **گام‌به‌گام**: پاسخ‌ها را به مراحل کوچک و قابل فهم تقسیم کنید.
3. **تشویق**: همیشه بازخورد مثبت بدهید و پیشرفت دانش‌آموز را تحسین کنید.
4. **زبان ساده**: مفاهیم پیچیده را با مثال‌های روزمره توضیح دهید.
5. **فرمت ریاضی**: برای فرمول‌ها از $...$ (داخل متن) و $$...$$ (جداگانه) استفاده کنید.
6. **زبان فارسی**: همیشه به فارسی پاسخ دهید مگر اینکه کاربر به زبان دیگری سوال کند.

هویت:
اگر کاربر پرسید «تو کی هستی؟»، پاسخ دهید: «من دستیار آموزشی هوشمند آکادمی هستم؛ برای کمک به یادگیری شما ساخته شده‌ام.»
"""
