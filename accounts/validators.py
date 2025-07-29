from django.core.exceptions import ValidationError

def validate_iranian_national_id(value):
    """
    Validates Iranian national ID (کد ملی)
    """
    if not value or len(value) != 10 or value == value[0] * 10:
        raise ValidationError("invalid national ID")

    try:
        digits = [int(c) for c in value]
    except ValueError:
        raise ValidationError("national ID must be numeric")

    check = digits.pop()
    s = sum([digits[i] * (10 - i) for i in range(9)])
    r = s % 11
    valid_check = r if r < 2 else 11 - r

    if check != valid_check:
        raise ValidationError("invalid national ID")
