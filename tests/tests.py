import os
import sys
import django
import datetime

# Set up Django environment
if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
    django.setup()

    from tests.models import TestCollection, Test

    collection = TestCollection.objects.get(id=5)

    for i in range(10):
        test = Test(
            name=f"مرحله {i+1}",
            description=f"آزمون مرحله {i+1} - تست خودکار",
            test_collection=collection,
            pdf_file_id=34,  # فرض بر این است که فایل PDF با ID 34 وجود دارد
            duration="01:00:00",
            frequency="once",
            start_time=datetime.datetime.now() + datetime.timedelta(days=i),
            end_time=datetime.datetime.now() + datetime.timedelta(days=i, hours=25),
            keys=[
                {"question_number": 1, "answer": 1},
                {"question_number": 2, "answer": 2},
                {"question_number": 3, "answer": 3},
                {"question_number": 4, "answer": 4},
                {"question_number": 5, "answer": 3},
                {"question_number": 6, "answer": 2},
                {"question_number": 7, "answer": 1},
                {"question_number": 8, "answer": 2},
                {"question_number": 9, "answer": 3},
                {"question_number": 10, "answer": 4}
            ]
        )
        test.save()
        print(f"آزمون {test.name} با موفقیت ایجاد شد.")
