import os
import json
import django

# ست کردن تنظیمات Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")
django.setup()

from tests.models import Question, Folder


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


def normalize_text(text):
    """متن را برای مقایسه نرمال کند"""
    import re
    # حذف فاصله‌های اضافی و کاراکترهای خاص
    text = re.sub(r'\s+', ' ', text.strip())
    # حذف LaTeX tags برای مقایسه بهتر
    text = re.sub(r'\$[^$]*\$', '', text)
    text = re.sub(r'\\[a-zA-Z]+\{[^}]*\}', '', text)
    return text.lower()


def find_question_by_text(question_text):
    """پیدا کردن سوال بر اساس متن"""
    normalized_input = normalize_text(question_text)
    
    # ابتدا جستجوی دقیق
    for question in Question.objects.all():
        if normalize_text(question.question_text) == normalized_input:
            return question
    
    # اگر پیدا نشد، جستجوی تطبیقی
    for question in Question.objects.all():
        normalized_db = normalize_text(question.question_text)
        if normalized_input in normalized_db or normalized_db in normalized_input:
            return question
    
    return None


def create_folder_hierarchy(folder_topics):
    """ایجاد سلسله مراتبی پوشه‌ها و بازگرداندن لیست همه پوشه‌ها"""
    parent = None
    created_folders = []
    
    for folder_name in folder_topics:
        # بررسی وجود پوشه با نام و parent مشخص
        if parent:
            folder = Folder.objects.filter(name=folder_name, parent=parent).first()
        else:
            folder = Folder.objects.filter(name=folder_name, parent__isnull=True).first()
        
        if not folder:
            folder = Folder.objects.create(name=folder_name, parent=parent)
            print(f"📁 پوشه جدید ایجاد شد: {folder_name}")
        
        created_folders.append(folder)
        parent = folder
    
    return created_folders


def update_question_folders(json_file_path):
    """بروزرسانی فولدرهای سوالات از فایل JSON"""
    
    if not os.path.exists(json_file_path):
        print(f"❌ فایل {json_file_path} یافت نشد!")
        return
    
    with open(json_file_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)
    
    # صاف کردن داده‌ها
    all_data = []
    for block in raw_data:
        if isinstance(block, list):
            all_data.extend(block)
        else:
            all_data.append(block)
    
    updated_count = 0
    not_found_count = 0
    
    print(f"🔍 در حال پردازش {len(all_data)} سوال...")
    
    for i, item in enumerate(all_data, 1):
        question_text = item.get("question", "").strip()
        if not question_text:
            print(f"⚠️  سوال {i}: متن سوال خالی است")
            continue
        
        # پیدا کردن سوال در دیتابیس
        question = find_question_by_text(question_text)
        
        if not question:
            print(f"❌ سوال {i}: پیدا نشد - {question_text[:50]}...")
            not_found_count += 1
            continue
        
        # استخراج فولدرها از topics
        source, publish_date, folder_topics = split_topics(item.get("topics", []))
        
        if not folder_topics:
            print(f"⚠️  سوال {i}: هیچ فولدری برای اضافه کردن یافت نشد")
            continue
        
        # ایجاد فولدرها
        folders = create_folder_hierarchy(folder_topics)
        
        # حذف فولدرهای قبلی و اضافه کردن فولدرهای جدید
        question.folders.clear()
        for folder in folders:
            question.folders.add(folder)
        
        # بروزرسانی سایر فیلدها در صورت نیاز
        if source and source != question.source:
            question.source = source
        if publish_date and publish_date != question.publish_date:
            question.publish_date = publish_date
        
        question.save()
        
        folder_names = [f.name for f in folders]
        print(f"✅ سوال {i}: بروزرسانی شد - {question.public_id}")
        print(f"   فولدرها: {' > '.join(folder_names)}")
        
        updated_count += 1
    
    print("\n" + "="*50)
    print(f"📊 گزارش نهایی:")
    print(f"   • کل سوالات: {len(all_data)}")
    print(f"   • بروزرسانی شده: {updated_count}")
    print(f"   • پیدا نشده: {not_found_count}")
    print("="*50)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("❌ نحوه استفاده:")
        print("python update_question_folders.py path/to/questions.json")
        sys.exit(1)
    
    json_file = sys.argv[1]
    update_question_folders(json_file)