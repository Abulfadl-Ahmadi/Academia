from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
from .models import UserProfile, VerificationCode, UserAddress
from .validators import validate_iranian_national_id
from rest_framework.validators import UniqueValidator

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'role']

    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError("گذرواژه‌ها با هم مطابقت ندارند")
        return data


class SendVerificationCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    # username = serializers.CharField()
    # first_name = serializers.CharField(required=False, allow_blank=True)
    # last_name = serializers.CharField(required=False, allow_blank=True)


class SendPhoneVerificationCodeSerializer(serializers.Serializer):
    phone_number = serializers.CharField(validators=[RegexValidator(r'^09\d{9}$', 'Enter a valid 11-digit Iranian phone number')])


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)


class VerifyPhoneSerializer(serializers.Serializer):
    phone_number = serializers.CharField(validators=[RegexValidator(r'^09\d{9}$', 'Enter a valid 11-digit Iranian phone number')])
    code = serializers.CharField(max_length=6, min_length=6)


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'national_id', 'phone_number', 'birth_date', 'grade']

    def create(self, validated_data):
        user_data = validated_data.pop('user')

        # Extract and hash the password
        password = user_data.pop('password')
        user_data.pop('password_confirm', None)  # Remove password_confirm from user_data
        
        # Set default role as 'student' if not provided
        if 'role' not in user_data or not user_data['role']:
            user_data['role'] = User.STUDENT
        
        user = User(**user_data)
        user.set_password(password)
        user.save()

        # Create the profile
        profile = UserProfile.objects.create(user=user, **validated_data)
        return profile

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        # Update user fields (excluding password)
        for attr, value in user_data.items():
            if attr == 'password':
                user.set_password(value)
            else:
                setattr(user, attr, value)
        user.save()

        # Update profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance


class CompleteRegistrationSerializer(serializers.Serializer):
    phone_number = serializers.CharField(validators=[RegexValidator(r'^09\d{9}$', 'Enter a valid 11-digit Iranian phone number')])
    username = serializers.CharField()
    password = serializers.CharField(min_length=6)
    password_confirm = serializers.CharField(min_length=6)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    national_id = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    # birth_date = serializers.DateField(required=False)
    grade = serializers.CharField(required=False, allow_blank=True)
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("این نام کاربری قبلاً استفاده شده است. لطفاً نام کاربری دیگری انتخاب کنید.")
        return value
    
    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("این ایمیل قبلاً استفاده شده است. لطفاً ایمیل دیگری وارد کنید.")
        return value
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("گذرواژه‌ها با هم مطابقت ندارند")
        return data


class UserAddressSerializer(serializers.ModelSerializer):
    is_complete = serializers.ReadOnlyField()
    formatted_address = serializers.ReadOnlyField()
    
    class Meta:
        model = UserAddress
        fields = [
            'id', 'full_name', 'phone_number', 'province', 'city', 
            'postal_code', 'address_line', 'is_complete', 'formatted_address',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SendResetPasswordCodeSerializer(serializers.Serializer):
    phone_number = serializers.CharField(validators=[RegexValidator(r'^09\d{9}$', 'Enter a valid 11-digit Iranian phone number')])


class VerifyResetPasswordCodeSerializer(serializers.Serializer):
    phone_number = serializers.CharField(validators=[RegexValidator(r'^09\d{9}$', 'Enter a valid 11-digit Iranian phone number')])
    code = serializers.CharField(max_length=6, min_length=6)


class ResetPasswordSerializer(serializers.Serializer):
    phone_number = serializers.CharField(validators=[RegexValidator(r'^09\d{9}$', 'Enter a valid 11-digit Iranian phone number')])
    code = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(min_length=6)
    new_password_confirm = serializers.CharField(min_length=6)
    
    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError("گذرواژه‌ها با هم مطابقت ندارند")
        return data
