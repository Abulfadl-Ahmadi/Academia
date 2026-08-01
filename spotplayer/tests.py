from unittest import mock

from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from courses.models import ClassCategory, Course
from .models import SpotPlayerLicense
from .services import SpotPlayerError, SpotPlayerService, provision_license_for_course

API_KEY = "test-api-key"


@override_settings(
    SPOTPLAYER_API_KEY=API_KEY,
    SPOTPLAYER_API_BASE_URL="https://panel.spotplayer.ir",
    SPOTPLAYER_TEST_MODE=False,
)
class SpotPlayerServiceTests(TestCase):
    def setUp(self):
        self.category = ClassCategory.objects.create(name="Cat")

    @mock.patch("spotplayer.services.requests.post")
    def test_create_license_builds_valid_payload_and_returns_parsed(self, mock_post):
        mock_post.return_value = mock.Mock(
            status_code=200,
            json=lambda: {
                "_id": "5dcab540796f5d4d48a6570f",
                "key": "0001...",
                "url": "/5e0796ae55fb7a18e83b3554/91d0726373dd525f9d3f57f688299a00/",
            },
            raise_for_status=lambda: None,
        )

        result = SpotPlayerService.create_license(
            course_ids=["5d2ee35bcddc092a304ae5eb"],
            user_name="ali",
            watermark_text="09121112266",
            test=True,
        )

        self.assertEqual(result["_id"], "5dcab540796f5d4d48a6570f")
        self.assertTrue(result["test"])
        self.assertEqual(result["course_ids"], ["5d2ee35bcddc092a304ae5eb"])

        _, kwargs = mock_post.call_args
        sent = kwargs["json"]
        self.assertEqual(sent["course"], ["5d2ee35bcddc092a304ae5eb"])
        self.assertEqual(sent["name"], "ali")
        self.assertTrue(sent["test"])
        self.assertEqual(sent["watermark"]["texts"][0]["text"], "09121112266")

        self.assertEqual(kwargs["headers"]["$API"], API_KEY)
        self.assertEqual(kwargs["headers"]["$LEVEL"], "-1")

    @mock.patch("spotplayer.services.requests.post")
    def test_create_license_raises_on_error_payload(self, mock_post):
        mock_post.return_value = mock.Mock(
            status_code=200,
            json=lambda: {"ex": {"msg": "invalid data"}},
            raise_for_status=lambda: None,
        )
        with self.assertRaises(SpotPlayerError):
            SpotPlayerService.create_license(
                course_ids=["abc"], user_name="ali", watermark_text="09"
            )

    def test_create_license_requires_api_key(self):
        with override_settings(SPOTPLAYER_API_KEY=""):
            with self.assertRaises(SpotPlayerError):
                SpotPlayerService.create_license(
                    course_ids=["abc"], user_name="ali", watermark_text="09"
                )

    @mock.patch("spotplayer.services.requests.post")
    def test_provision_license_for_course_persists(self, mock_post):
        mock_post.return_value = mock.Mock(
            status_code=200,
            json=lambda: {"_id": "L1", "key": "KEY1", "url": "/abc/def/"},
            raise_for_status=lambda: None,
        )
        from accounts.models import User

        user = User.objects.create_user(username="student")
        course = Course.objects.create(
            title="C",
            category=self.category,
            spotplayer_course_id="5d2ee35bcddc092a304ae5eb",
        )

        lic, created, error = provision_license_for_course(user, course, test=True)
        self.assertTrue(created)
        self.assertIsNone(error)
        self.assertEqual(lic.spotplayer_license_id, "L1")
        self.assertEqual(lic.spotplayer_license_key, "KEY1")
        self.assertTrue(lic.test_mode)

        lic2, created2, _ = provision_license_for_course(user, course, test=True)
        self.assertFalse(created2)
        self.assertEqual(lic2.pk, lic.pk)


class CourseLicenseViewTests(TestCase):
    def setUp(self):
        self.category = ClassCategory.objects.create(name="Cat")
        from accounts.models import User

        self.student = User.objects.create_user(username="student", role="student")
        self.other = User.objects.create_user(username="other", role="student")
        self.course = Course.objects.create(
            title="C", category=self.category, spotplayer_course_id="COURSE_X"
        )
        self.client = APIClient()
        self.url = f"/api/spotplayer/courses/{self.course.id}/license/"

    @mock.patch(
        "spotplayer.views.provision_license_for_course",
        return_value=(
            SpotPlayerLicense(
                id=1,
                spotplayer_license_id="L1",
                spotplayer_license_key="KEY1",
                spotplayer_url="/x/y/",
                watermark_text="09121112266",
            ),
            True,
            None,
        ),
    )
    def test_non_enrolled_user_is_forbidden(self, _mock):
        self.client.force_authenticate(self.other)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    @mock.patch(
        "spotplayer.views.provision_license_for_course",
        return_value=(
            SpotPlayerLicense(
                id=1,
                spotplayer_license_id="L1",
                spotplayer_license_key="KEY1",
                spotplayer_url="/x/y/",
                watermark_text="09121112266",
            ),
            True,
            None,
        ),
    )
    def test_enrolled_user_gets_license(self, mock_provision):
        self.course.students.add(self.student)
        self.client.force_authenticate(self.student)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["license"]["spotplayer_license_key"], "KEY1")
        mock_provision.assert_called_once()

    def test_requires_authentication(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


@override_settings(
    SPOTPLAYER_API_KEY=API_KEY,
    SPOTPLAYER_APP_URL="https://app.spotplayer.ir",
)
class SpotXProxyViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @mock.patch("spotplayer.views.requests.head")
    def test_syncs_new_cookie(self, mock_head):
        mock_head.return_value.status_code = 200
        mock_head.return_value.headers = {
            "Set-Cookie": "X=abcd1234efab; Max-Age=3153600000; Path=/"
        }
        resp = self.client.get("/api/spotplayer/spotx/", HTTP_COOKIE="X=deadbeef")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(resp.cookies.get("X").value, "abcd1234efab")



class CourseLicensesListViewTests(TestCase):
    def setUp(self):
        self.category = ClassCategory.objects.create(name="Cat")
        from accounts.models import User

        self.teacher = User.objects.create_user(username="teacher", role="teacher")
        self.student = User.objects.create_user(username="student", role="student")
        self.course = Course.objects.create(
            title="C", category=self.category, teacher=self.teacher,
            spotplayer_course_id="COURSE_X",
        )
        self.license = SpotPlayerLicense.objects.create(
            user=self.student, course=self.course,
            spotplayer_license_id="L1", spotplayer_license_key="KEY1",
        )
        self.client = APIClient()
        self.url = f"/api/spotplayer/courses/{self.course.id}/licenses/"

    def test_student_cannot_list_licenses(self):
        self.client.force_authenticate(self.student)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_can_list_licenses(self):
        self.client.force_authenticate(self.teacher)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.data["licenses"]
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["student_name"], "student")
        self.assertEqual(data[0]["spotplayer_license_key"], "KEY1")

    def test_teacher_cannot_list_other_teachers_course(self):
        from accounts.models import User

        other = User.objects.create_user(username="teacher2", role="teacher")
        self.client.force_authenticate(other)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

