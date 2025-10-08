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


def process_json_file(file_path):
    """پردازش یک فایل JSON"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
        
        # صاف کردن داده‌ها
        all_data = []
        for block in raw_data:
            if isinstance(block, list):
                all_data.extend(block)
            else:
                all_data.append(block)
        
        return all_data
    except Exception as e:
        print(f"❌ خطا در خواندن فایل {file_path}: {str(e)}")
        return []


def get_json_files(path):
    """دریافت تمام فایل‌های JSON از مسیر داده شده"""
    json_files = []
    
    if os.path.isfile(path):
        # اگر یک فایل است
        if path.lower().endswith('.json'):
            json_files.append(path)
        else:
            print(f"❌ فایل {path} یک فایل JSON نیست!")
    elif os.path.isdir(path):
        # اگر یک پوشه است
        for root, dirs, files in os.walk(path):
            for file in files:
                if file.lower().endswith('.json'):
                    json_files.append(os.path.join(root, file))
    else:
        print(f"❌ مسیر {path} یافت نشد!")
    
    return json_files


def update_question_folders(path):
    """بروزرسانی فولدرهای سوالات از فایل یا پوشه JSON"""
    
    if not os.path.exists(path):
        print(f"❌ مسیر {path} یافت نشد!")
        return
    
    # دریافت تمام فایل‌های JSON
    json_files = get_json_files(path)
    
    if not json_files:
        print(f"❌ هیچ فایل JSON در مسیر {path} یافت نشد!")
        return
    
    print(f"📁 پیدا شده: {len(json_files)} فایل JSON")
    for file in json_files:
        print(f"   • {os.path.basename(file)}")
    print()
    
    # پردازش تمام فایل‌ها
    all_questions = []
    for json_file in json_files:
        print(f"📄 در حال پردازش: {os.path.basename(json_file)}")
        file_data = process_json_file(json_file)
        all_questions.extend(file_data)
        print(f"   ✅ {len(file_data)} سوال بارگذاری شد")
    
    print(f"\n🔍 در حال پردازش {len(all_questions)} سوال از {len(json_files)} فایل...")
    
    updated_count = 0
    not_found_count = 0
    processed_files = {}
    
    for i, item in enumerate(all_questions, 1):
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
    
    print("\n" + "="*60)
    print(f"📊 گزارش نهایی:")
    print(f"   • فایل‌های پردازش شده: {len(json_files)}")
    print(f"   • کل سوالات: {len(all_questions)}")
    print(f"   • بروزرسانی شده: {updated_count}")
    print(f"   • پیدا نشده: {not_found_count}")
    print("="*60)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("❌ نحوه استفاده:")
        print("python update_question_folders.py path/to/questions.json")
        print("یا:")
        print("python update_question_folders.py path/to/questions_folder/")
        print("\nمثال‌ها:")
        print("python update_question_folders.py data/50.json")
        print("python update_question_folders.py data/questions/")
        print("python update_question_folders.py C:\\Users\\Username\\Downloads\\questions\\")
        sys.exit(1)
    
    path = sys.argv[1]
    update_question_folders(path)