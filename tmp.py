import os
import json
import django

# ست کردن تنظیمات Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")
django.setup()

from tests.models import Question, Option, Folder, User

MERGED_FILE = "data/merged.json"
DEFAULT_USER_ID = 1  # یوزری که می‌خوای سوال‌ها به نامش ثبت بشه

# نگاشت سطح دشواری
difficulty_map = {
    "ساده": "easy",
    "آسان": "easy",
    "medium": "medium",
    "متوسط": "medium",
    "دشوار": "hard",
    "سخت": "hard",
}


def build_solution(item):
    """ترکیب explanation و answer_text"""
    explanation = item.get("explanation", "") or ""
    answer_text = item.get("answer_text", "")
    if answer_text:
        return f"{explanation}\n\nپاسخ صحیح: {answer_text}"
    return explanation


def split_topics(topics):
    """تجزیه topics به source, publish_date, folders"""
    source_parts, folder_parts = [], []
    publish_date = None

    for t in topics:
        if t.isdigit() and len(t) == 4:  # سال
            publish_date = t
        elif any(kw in t for kw in ["کنکور", "خارج", "نوبت", "علوی", "آزمون"]):
            source_parts.append(t)
        else:
            folder_parts.append(t)

    source = " / ".join(source_parts) if source_parts else None
    return source, publish_date, folder_parts


def import_questions():
    with open(MERGED_FILE, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    # صاف کردن لیست‌های تو در تو
    all_data = []
    for block in raw_data:
        if isinstance(block, list):
            all_data.extend(block)
        else:
            all_data.append(block)

    default_user = User.objects.filter(id=DEFAULT_USER_ID).first()

    for item in all_data:
        source, publish_date, folder_topics = split_topics(item.get("topics", []))

        # ایجاد یا بروزرسانی سوال
        question, created = Question.objects.get_or_create(
            question_text=item.get("question", ""),
            defaults={
                "created_by": default_user,
                "difficulty_level": difficulty_map.get(item.get("difficulty", "").strip(), "medium"),
                "detailed_solution": build_solution(item),
                "source": source,
                "publish_date": publish_date,
            },
        )

        if not created:
            question.difficulty_level = difficulty_map.get(item.get("difficulty", "").strip(), "medium")
            question.detailed_solution = build_solution(item)
            question.source = source
            question.publish_date = publish_date
            question.save()
            question.options.all().delete()
            print(f"🔄 بروزرسانی شد: {question.public_id} - {question.question_text[:30]}")
        else:
            print(f"✅ ایجاد شد: {question.public_id} - {question.question_text[:30]}")

        # گزینه‌ها
        options = item.get("options", [])
        correct_index = item.get("answer_index", None)
        correct_option_obj = None

        for idx, opt_text in enumerate(options, start=1):
            option = Option.objects.create(
                question=question,
                option_text=opt_text,
                order=idx
            )
            if correct_index is not None and idx - 1 == correct_index:
                correct_option_obj = option

        if correct_option_obj:
            question.correct_option = correct_option_obj
            question.save()

        # پوشه‌ها (ساخت سلسله مراتبی بدون تکرار)
        parent = None
        attached_folders = []
        for folder_name in folder_topics:
            if Folder.objects.filter(name=folder_name).exists():
                folder = Folder.objects.get(name=folder_name)
                if folder not in attached_folders:
                    attached_folders.append(folder)
                parent = folder
                continue
            folder = Folder.objects.create(name=folder_name, parent=parent)
            parent = folder
            attached_folders.append(folder)

        # اتصال همه پوشه‌ها به سوال
        for folder in attached_folders:
            question.folders.add(folder)


if __name__ == "__main__":
    import_questions()
