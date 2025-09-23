import os
import re
import json
import django

# --- تنظیم جنگو ---
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")
django.setup()

from django.contrib.auth import get_user_model
from tests.models import Question, Option, Folder  # اگر اپ‌تان tests نیست، این خط را مطابق اپ خودتان تغییر دهید.

User = get_user_model()

OUT_FILE = "data/out.json"
DEFAULT_USER_ID = 5  # آیدی کاربری که می‌خواهید created_by روی او ست شود


# --- نگاشت دشواری ---
DIFFICULTY_MAP = {
    "easy": "easy", "ساده": "easy", "آسان": "easy",
    "medium": "medium", "متوسط": "medium",
    "hard": "hard", "دشوار": "hard", "سخت": "hard",
}

def map_difficulty(val: str) -> str:
    if not val:
        return "medium"
    return DIFFICULTY_MAP.get(val.strip(), "medium")


# --- نرمال‌سازی نام پوشه (جلوگیری از پوشه‌های تکراری ظاهری) ---
ZWNJ = "\u200c"
def normalize_name(name: str) -> str:
    if not name:
        return ""
    # یکنواخت‌سازی حروف عربی/فارسی و حذف نیم‌فاصله
    name = name.replace("ي", "ی").replace("ك", "ک").replace(ZWNJ, "")
    # حذف فاصله‌های ابتدا/انتهای رشته
    name = name.strip()
    # تبدیل چند فاصله به یک فاصله
    name = re.sub(r"\s+", " ", name)
    return name


# --- تبدیل topic (رشته) به زنجیره پوشه‌ها ---
def split_topic_to_chain(topic_str: str) -> list[str]:
    """
    مثال: 'فصل دوم : مقاطع مخروطی | انواع مقاطع | دایره | معادله دایره'
    -> ['فصل دوم : مقاطع مخروطی', 'انواع مقاطع', 'دایره', 'معادله دایره']
    """
    if not topic_str:
        return []
    parts = [normalize_name(p) for p in topic_str.split("|")]
    # حذف آیتم‌های خالی بعد از نرمال‌سازی
    parts = [p for p in parts if p]
    return parts


def import_from_out():
    with open(OUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        if not isinstance(data, list):
            raise ValueError("ساختار out.json باید یک آرایه از آیتم‌ها باشد.")

    default_user = User.objects.filter(id=DEFAULT_USER_ID).first()

    for item in data:
        # استخراج فیلدها از JSON
        q_text = item.get("question_text", "") or ""
        difficulty = map_difficulty(item.get("difficulty"))
        solution = (item.get("solution") or "").strip()
        if not solution:
            continue
        topic_str = item.get("topic") or ""

        # ایجاد/بروزرسانی سوال بر اساس question_text
        question, created = Question.objects.get_or_create(
            question_text=q_text,
            defaults={
                "created_by": default_user,
                "difficulty_level": difficulty,
                "detailed_solution": solution,
                # اگر می‌خواهید از topic برای source هم استفاده کنید، خط زیر را باز کنید:
                # "source": split_topic_to_chain(topic_str)[0] if split_topic_to_chain(topic_str) else None,
            },
        )

        if not created:
            question.difficulty_level = difficulty
            question.detailed_solution = solution
            # اگر می‌خواهید source را هم از topic پر کنید، خط زیر را باز کنید:
            # chain = split_topic_to_chain(topic_str)
            # question.source = chain[0] if chain else None
            question.save()
            # جایگزینی گزینه‌ها (پاک‌کردن قبلی‌ها برای هم‌خوانی کامل)
            question.options.all().delete()
            print(f"🔄 بروزرسانی شد: {question.public_id} - {q_text[:40]}")
        else:
            print(f"✅ ایجاد شد: {question.public_id} - {q_text[:40]}")

        # ساخت گزینه‌ها و ست‌کردن correct_option
        options = item.get("options", []) or []
        correct_index = item.get("correct_option_index", None)
        correct_option_obj = None

        for idx, opt in enumerate(options, start=1):
            opt_text = (opt or {}).get("option_text", "") or ""
            opt_obj = Option.objects.create(
                question=question,
                option_text=opt_text,
                order=idx
            )
            if correct_index is not None and (idx - 1) == correct_index:
                correct_option_obj = opt_obj

        if correct_option_obj:
            question.correct_option = correct_option_obj
            question.save()

        # ساخت و اتصال زنجیره پوشه‌ها (همه سطوح)
        chain = split_topic_to_chain(topic_str)
        parent = None
        attached = []
        for raw_name in chain:
            name = normalize_name(raw_name)
            folder, _ = Folder.objects.get_or_create(name=name, parent=parent)
            attached.append(folder)
            parent = folder

        # اتصال همه سطوح پوشه به سوال (نه فقط آخرین سطح)
        for f in attached:
            question.folders.add(f)


if __name__ == "__main__":
    import_from_out()
