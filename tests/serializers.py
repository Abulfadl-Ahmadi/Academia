from rest_framework import serializers

from contents.models import File
from .models import Test, PrimaryKey, StudentTestSession, StudentAnswer
from courses.models import Course


class PrimaryKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = PrimaryKey
        fields = ['question_number', 'answer']

class CourseNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "title"]

class TestCreateSerializer(serializers.ModelSerializer):
    keys = PrimaryKeySerializer(many=True, required=False)
    pdf_file = serializers.PrimaryKeyRelatedField(queryset=File.objects.filter(content_type=File.ContentType.TEST))
    status = serializers.SerializerMethodField()
    course = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        write_only=True
    )

    course_detail = CourseNestedSerializer(source="course", read_only=True)

    class Meta:
        model = Test
        fields = ["id", 'name', 'status', 'course_detail', 'description', 'course', 'pdf_file', 'start_time', 'end_time', 'duration', 'frequency', 'keys']
        read_only_fields = ['teacher']

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None

        keys_data = validated_data.pop('keys', None)
        test = Test.objects.create(teacher=user, **validated_data)

        for key in keys_data:
            PrimaryKey.objects.create(test=test, **key)
        return test

    def get_status(self, validated_data):
        request = self.context.get('request')
        user = request.user
        sessions = StudentTestSession.objects.filter(user=user, test=validated_data.id).order_by("-id")
        if len(sessions) == 0:
            return ""
        else:
            return sessions.first().status


class TestUpdateSerializer(serializers.ModelSerializer):
    keys = PrimaryKeySerializer(many=True, required=False)
    pdf_file = serializers.PrimaryKeyRelatedField(queryset=File.objects.filter(content_type=File.ContentType.TEST))

    class Meta:
        model = Test
        fields = ['name', 'description', 'course', 'pdf_file', 'start_time', 'end_time', 'duration', 'frequency', 'keys']

    def update(self, instance, validated_data):
        keys_data = validated_data.pop('keys', None)

        # ابتدا خود آزمون رو آپدیت کن
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if keys_data is not None:

            # کلیدهای جدید رو ذخیره کن
            for key in keys_data:
                PrimaryKey.objects.update_or_create(test=instance, question_number=key["question_number"],defaults={"answer": key["answer"]}
                )

        return instance

class TestDetailSerializer(serializers.ModelSerializer):
    # pdf_file = serializers.SerializerMethodField()
    class Meta:
        model = Test
        fields = ["id", 'name', 'description', 'course', 'start_time', 'end_time', 'duration', 'frequency']
        read_only_fields = ['teacher']

    # def get_pdf_file(self, obj):
    #     request = self.context.get('request')
    #     if obj.pdf_file:
    #         return request.build_absolute_uri(obj.pdf_file.file.url) if request else obj.pdf_file.file.url
    #     return None

