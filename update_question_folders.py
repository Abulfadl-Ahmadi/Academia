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
    
    # حذف فاصله‌های اضافی
    text = re.sub(r'\s+', ' ', text.strip())
    
    # نرمال‌سازی LaTeX commands
    # تبدیل \\ به \ (برای LaTeX line breaks)
    text = re.sub(r'\\\\+', r'\\', text)
    
    # نرمال‌سازی فاصله‌گذاری در LaTeX
    text = re.sub(r'\\\s+', r'\\', text)  # حذف فاصله بعد از بک‌اسلش
    text = re.sub(r'\s+\\', r'\\', text)  # حذف فاصله قبل از بک‌اسلش
    
    # نرمال‌سازی matrix و aligned environments
    text = re.sub(r'\\begin\s*\{\s*matrix\s*\}', r'\\begin{matrix}', text)
    text = re.sub(r'\\end\s*\{\s*matrix\s*\}', r'\\end{matrix}', text)
    text = re.sub(r'\\begin\s*\{\s*aligned\s*\}', r'\\begin{aligned}', text)
    text = re.sub(r'\\end\s*\{\s*aligned\s*\}', r'\\end{aligned}', text)
    
    # حذف LaTeX tags برای مقایسه بهتر (اختیاری - فقط برای محاسبه شباهت)
    text_for_comparison = re.sub(r'\$[^$]*\$', ' [MATH] ', text)
    text_for_comparison = re.sub(r'\\[a-zA-Z]+\{[^}]*\}', ' [LATEX] ', text_for_comparison)
    text_for_comparison = re.sub(r'\\[a-zA-Z]+', ' [CMD] ', text_for_comparison)
    
    # نرمال‌سازی کلمات فارسی متصل/جدا
    # "بهصورت" و "به صورت"
    text = re.sub(r'به\s*صورت', 'بهصورت', text)
    text = re.sub(r'بصورت', 'بهصورت', text)
    
    # "درصورت" و "در صورت"
    text = re.sub(r'در\s*صورت', 'درصورت', text)
    
    # "بهعنوان" و "به عنوان"
    text = re.sub(r'به\s*عنوان', 'بهعنوان', text)
    
    # "درنظر" و "در نظر"
    text = re.sub(r'در\s*نظر', 'درنظر', text)
    
    # حذف علامات نگارشی متداول
    punctuation_chars = '،؛:؟!.;:?!()[]{}«»""\'`'
    for char in punctuation_chars:
        text = text.replace(char, '')
    
    # حذف فاصله‌های اضافی مجدد بعد از حذف علامات
    text = re.sub(r'\s+', ' ', text.strip())
    
    # تبدیل ی/ي و ک/ك به حالت استاندارد
    text = text.replace('ي', 'ی').replace('ك', 'ک')
    
    # حذف اعراب فارسی (اختیاری)
    arabic_diacritics = 'َُِّْٰٱٲٳٴٵٶٷٸٹٺٻټٽپٿڀځڂڃڄڅچڇڈډڊڋڌڍڎڏڐڑڒړڔڕږڗژڙښڛڜڝڞڟڠڡڢڣڤڥڦڧڨکڪګڬڭڮگڰڱڲڳڴڵڶڷڸڹںڻڼڽھڿ'
    for char in arabic_diacritics:
        text = text.replace(char, '')
    
    return text.lower()


def test_normalization(text1, text2):
    """تست نرمال‌سازی دو متن و نمایش تفاوت‌ها"""
    print("=== تست نرمال‌سازی ===")
    print(f"متن اول (اصلی): {text1[:100]}...")
    print(f"متن دوم (اصلی): {text2[:100]}...")
    print()
    
    norm1 = normalize_text(text1)
    norm2 = normalize_text(text2)
    
    print(f"متن اول (نرمال): {norm1[:100]}...")
    print(f"متن دوم (نرمال): {norm2[:100]}...")
    print()
    
    similarity = calculate_similarity(norm1, norm2)
    print(f"شباهت: {similarity:.2f}%")
    
    if norm1 == norm2:
        print("✅ تطابق کامل!")
    else:
        print("❌ تطابق کامل نیست")
        
        # نمایش تفاوت‌ها
        from difflib import unified_diff
        diff = list(unified_diff(
            norm1.splitlines(keepends=True),
            norm2.splitlines(keepends=True),
            fromfile='JSON',
            tofile='DB',
            lineterm=''
        ))
        if diff:
            print("\nتفاوت‌ها:")
            for line in diff[:10]:  # فقط 10 خط اول
                print(line.rstrip())
    
    print("=" * 50)


def calculate_similarity(text1, text2):
    """محاسبه شباهت دو متن (0 تا 100)"""
    from difflib import SequenceMatcher
    return SequenceMatcher(None, text1, text2).ratio() * 100


def find_question_by_text(question_text, similarity_threshold=85):
    """پیدا کردن سوال بر اساس متن با قابلیت تطبیق تقریبی"""
    normalized_input = normalize_text(question_text)
    
    # مرحله 1: جستجوی دقیق
    for question in Question.objects.all():
        normalized_db = normalize_text(question.question_text)
        if normalized_db == normalized_input:
            return question, 100  # تطابق کامل
    
    # مرحله 2: جستجوی تطبیقی با محاسبه شباهت
    candidates = []
    
    for question in Question.objects.all():
        normalized_db = normalize_text(question.question_text)
        
        # محاسبه شباهت
        similarity = calculate_similarity(normalized_input, normalized_db)
        
        if similarity >= similarity_threshold:
            candidates.append((question, similarity))
    
    # مرتب‌سازی بر اساس بیشترین شباهت
    if candidates:
        candidates.sort(key=lambda x: x[1], reverse=True)
        best_match = candidates[0]
        print(f"🔍 تطابق تقریبی پیدا شد با {best_match[1]:.1f}% شباهت")
        return best_match[0], best_match[1]
    
    # مرحله 3: جستجوی بر اساس کلمات کلیدی (برای موارد شدیداً تغییر یافته)
    input_words = set(normalized_input.split())
    if len(input_words) < 3:  # اگر متن خیلی کوتاه باشد این مرحله را رد کن
        return None, 0
    
    for question in Question.objects.all():
        normalized_db = normalize_text(question.question_text)
        db_words = set(normalized_db.split())
        
        # محاسبه درصد کلمات مشترک
        if len(db_words) == 0:
            continue
            
        common_words = input_words.intersection(db_words)
        similarity = (len(common_words) / max(len(input_words), len(db_words))) * 100
        
        if similarity >= 70:  # حداقل 70% کلمات مشترک
            print(f"🔍 تطابق بر اساس کلمات کلیدی پیدا شد با {similarity:.1f}% کلمات مشترک")
            return question, similarity
    
    return None, 0


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


def update_question_folders(path, similarity_threshold=85, debug_mode=False):
    """بروزرسانی فولدرهای سوالات از فایل یا پوشه JSON"""
    
    if not os.path.exists(path):
        print(f"❌ مسیر {path} یافت نشد!")
        return
    
    print(f"🎯 حد آستانه شباهت: {similarity_threshold}%")
    if debug_mode:
        print("🐛 حالت دیباگ فعال است")
    print("   (برای تنظیم: python script.py path --threshold 80)")
    print()
    
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
        result = find_question_by_text(question_text, similarity_threshold)
        if result[0] is None:  # اگر سوال پیدا نشد
            print(f"❌ سوال {i}: پیدا نشد - {question_text[:50]}...")
            if debug_mode:
                print(f"   متن کامل: {question_text}")
                # جستجوی محدود برای نمایش نزدیک‌ترین موارد
                print("   🔍 نزدیک‌ترین موارد:")
                candidates = []
                for q in Question.objects.all()[:10]:  # فقط 10 سوال اول برای تست
                    similarity = calculate_similarity(normalize_text(question_text), normalize_text(q.question_text))
                    if similarity > 50:
                        candidates.append((q, similarity))
                candidates.sort(key=lambda x: x[1], reverse=True)
                for q, sim in candidates[:3]:
                    print(f"     - {sim:.1f}%: {q.question_text[:60]}...")
            not_found_count += 1
            continue
        
        question, similarity = result
        if similarity < 100:
            print(f"📝 سوال {i}: تطابق تقریبی با {similarity:.1f}% شباهت")
            if debug_mode:
                print(f"   JSON: {question_text[:80]}...")
                print(f"   DB:   {question.question_text[:80]}...")
                test_normalization(question_text, question.question_text)
        
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
    import argparse
    
    parser = argparse.ArgumentParser(description="بروزرسانی فولدرهای سوالات از فایل یا پوشه JSON")
    parser.add_argument("path", help="مسیر فایل JSON یا پوشه حاوی فایل‌های JSON")
    parser.add_argument("--threshold", "-t", type=int, default=85, 
                       help="حد آستانه شباهت برای تطابق تقریبی (پیش‌فرض: 85)")
    parser.add_argument("--debug", "-d", action="store_true",
                       help="فعال‌سازی حالت دیباگ برای نمایش جزئیات بیشتر")
    
    # Parse arguments but also support old style for backwards compatibility
    if len(sys.argv) == 2 and not sys.argv[1].startswith('-'):
        # Old style: just path
        path = sys.argv[1]
        threshold = 85
        debug_mode = False
    elif len(sys.argv) >= 2:
        args = parser.parse_args()
        path = args.path
        threshold = args.threshold
        debug_mode = args.debug
    else:
        parser.print_help()
        print("\nمثال‌ها:")
        print("python update_question_folders.py data/50.json")
        print("python update_question_folders.py data/questions/ --threshold 80")
        print("python update_question_folders.py \"C:\\Users\\Username\\Downloads\\questions\\\" -t 90 --debug")
        sys.exit(1)
    
    update_question_folders(path, threshold, debug_mode)