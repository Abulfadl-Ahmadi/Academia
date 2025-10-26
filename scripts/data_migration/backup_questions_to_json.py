import os
import sys
import django
import json

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from tests.models import Question, Option
from knowledge.models import Folder
from accounts.models import User
from django.core.serializers.json import DjangoJSONEncoder

OUTPUT_FILE = 'questions_backup.json'


def backup_questions():
    print('در حال تهیه بکاپ از تمام سوالات...')
    questions = Question.objects.all().select_related('created_by', 'correct_option').prefetch_related('folders')
    data = []
    
    for q in questions:
        # دریافت نام کاربری
        created_by_username = None
        if q.created_by:
            created_by_username = q.created_by.username
        
        # دریافت متن گزینه صحیح
        correct_option_text = None
        if q.correct_option:
            correct_option_text = q.correct_option.option_text
        
        # دریافت نام پوشه‌ها
        folder_names = []
        for folder in q.folders.all():
            folder_names.append(folder.name)
        
        # دریافت تمام گزینه‌های سوال
        options_info = []
        for option in q.options.all():
            options_info.append({
                'id': option.id,
                'option_text': option.option_text
            })
        
        # تبدیل به دیکشنری کامل
        item = {
            'id': q.id,
            'public_id': q.public_id,
            'question_text': q.question_text,
            'created_at': q.created_at.isoformat() if q.created_at else None,
            'updated_at': q.updated_at.isoformat() if q.updated_at else None,
            'created_by': created_by_username,
            'publish_date': q.publish_date,
            'source': q.source,
            'difficulty_level': q.difficulty_level,
            'detailed_solution': q.detailed_solution,
            'is_active': q.is_active,
            'correct_option': correct_option_text,
            'folders': folder_names,
            'all_options': options_info
        }
        data.append(item)
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2, cls=DjangoJSONEncoder)
    
    print(f'✅ بکاپ با موفقیت در فایل {OUTPUT_FILE} ذخیره شد.')
    print(f'📊 تعداد سوالات: {len(data)}')
    print('📋 اطلاعات شامل:')
    print('   - نام کاربری سازنده')
    print('   - نام پوشه‌ها')
    print('   - متن گزینه صحیح')
    print('   - تمام گزینه‌های سوال')


if __name__ == '__main__':
    backup_questions()
