"""
SpotPlayer API service layer.

All SpotPlayer panel calls MUST go through this server-side module: the API
cannot be called directly from the browser due to CORS.

Reference: https://panel.spotplayer.ir/license/edit/
Headers:  $API: <key>  ,  $LEVEL: -1
"""
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class SpotPlayerError(Exception):
    """Raised when the SpotPlayer API returns an error or is unreachable."""


class SpotPlayerService:
    """
    Unit-testable client for the SpotPlayer licensing API.

    The panel base URL, API key and timeouts are read from Django settings so
    they can be overridden easily in tests.
    """

    BASE_URL = None  # override in tests if needed

    # ------------------------------------------------------------------ #
    # Config helpers
    # ------------------------------------------------------------------ #
    @classmethod
    def _api_key(cls):
        return getattr(settings, "SPOTPLAYER_API_KEY", "")

    @classmethod
    def _base_url(cls):
        default = getattr(settings, "SPOTPLAYER_API_BASE_URL", "https://panel.spotplayer.ir")
        return (cls.BASE_URL or default).rstrip("/")

    @classmethod
    def _headers(cls):
        return {
            "Content-Type": "application/json",
            "$API": cls._api_key(),
            "$LEVEL": "-1",
        }

    @classmethod
    def _timeout(cls):
        return getattr(settings, "SPOTPLAYER_API_TIMEOUT", 15)

    @classmethod
    def _test_mode(cls):
        return getattr(settings, "SPOTPLAYER_TEST_MODE", False)

    # ------------------------------------------------------------------ #
    # Watermark builder
    # ------------------------------------------------------------------ #
    @staticmethod
    def build_watermark(text, position=511, reposition=15, margin=40):
        """Build a watermark object. 'text' (user phone/name) is mandatory."""
        return {
            "position": position,
            "reposition": reposition,
            "margin": margin,
            "texts": [{"text": text}],
        }

    @classmethod
    def create_license(
        cls,
        course_ids,
        user_name,
        watermark_text=None,
        test=None,
        offline=None,
        device=None,
        payload=None,
        data=None,
        watermark=None,
    ):
        """
        Create a license on SpotPlayer.

        course_ids:  list[str] -- SpotPlayer course IDs
        user_name:   str       -- license owner name (e.g. username)
        watermark_text: str    -- text burned onto video (e.g. user phone)
        test:        bool      -- test license (defaults to SPOTPLAYER_TEST_MODE)
        offline:     int       -- offline cache seconds
        device:      dict      -- per-platform device limits (p0..p6)
        payload:     str       -- opaque value returned to your support page
        data:        dict      -- e.g. {"confs":0,"limit":{...}}
        watermark:   dict      -- full watermark object (takes precedence)

        Returns dict with keys: _id, key, url, test, course_ids
        """
        if not cls._api_key():
            raise SpotPlayerError("SPOTPLAYER_API_KEY is not configured.")

        if test is None:
            test = cls._test_mode()

        payload_obj = {
            "course": list(course_ids),
            "name": user_name,
            "test": bool(test),
        }
        if watermark_text:
            payload_obj["watermark"] = cls.build_watermark(watermark_text)
        elif watermark:
            payload_obj["watermark"] = watermark
        if offline is not None:
            payload_obj["offline"] = offline
        if device is not None:
            payload_obj["device"] = device
        if payload:
            payload_obj["payload"] = payload
        if data is not None:
            payload_obj["data"] = data

        url = f"{cls._base_url()}/license/edit/"
        body = cls._post(url, payload_obj)

        if not body.get("_id") or not body.get("key"):
            raise SpotPlayerError("SpotPlayer response missing license id/key.")

        body["test"] = bool(test)
        body["course_ids"] = list(course_ids)
        return body

    @classmethod
    def update_license(cls, license_id, **fields):
        """Update an existing license (only provided fields are changed)."""
        if not license_id:
            raise SpotPlayerError("license_id is required.")
        if not cls._api_key():
            raise SpotPlayerError("SPOTPLAYER_API_KEY is not configured.")

        url = f"{cls._base_url()}/license/edit/{license_id}"
        return cls._post(url, fields)

    @classmethod
    def _post(cls, url, payload_obj):
        """Shared, validated POST. Raises SpotPlayerError on any failure."""
        try:
            resp = requests.post(
                url, json=payload_obj, headers=cls._headers(), timeout=cls._timeout()
            )
            try:
                body = resp.json()
            except ValueError:
                body = None

            if isinstance(body, dict) and "ex" in body:
                msg = body["ex"].get("msg", "Unknown SpotPlayer error")
                logger.error("SpotPlayer API error: %s", msg)
                raise SpotPlayerError(msg)

            resp.raise_for_status()

            if body is None:
                raise SpotPlayerError("SpotPlayer returned invalid JSON response.")

            return body

        except SpotPlayerError:
            raise
        except requests.Timeout as exc:
            logger.error("SpotPlayer request timeout: %s", exc)
            raise SpotPlayerError(f"SpotPlayer API timeout: {exc}") from exc
        except requests.RequestException as exc:
            logger.error("SpotPlayer request failed: %s", exc)
            raise SpotPlayerError(f"SpotPlayer API request failed: {exc}") from exc

# --------------------------------------------------------------------------- #
# High-level provisioning helpers (used by views / order flow)
# --------------------------------------------------------------------------- #
def get_watermark_for_user(user):
    """Best-effort watermark: user phone number, else username."""
    phone = ""
    profile = getattr(user, "profile", None)
    if profile is not None:
        phone = getattr(profile, "phone_number", "") or ""
    return phone or getattr(user, "username", "") or user.get_username()


def provision_license_for_course(user, course, test=None, force=False):
    """
    Create (if missing) and persist a SpotPlayer license for a user+course combo.

    Args:
        force: when True, a fresh license is requested from SpotPlayer even if a
               record already exists (used for "Regenerate").

    Returns (license_obj, created, error). Never raises: failures are returned
    as an error string so the purchase/enrollment flow never crashes.
    """
    from spotplayer.models import SpotPlayerLicense

    existing = SpotPlayerLicense.objects.filter(user=user, course=course).first()
    if existing and not force:
        return existing, False, None

    if force and existing:
        existing.delete()

    spot_course_id = getattr(course, "spotplayer_course_id", None)
    if not spot_course_id:
        return None, False, "Course has no spotplayer_course_id configured."

    if test is None:
        test = getattr(settings, "SPOTPLAYER_TEST_MODE", False)
    watermark_text = get_watermark_for_user(user)
    user_name = getattr(user, "username", "") or user.get_username()

    try:
        result = SpotPlayerService.create_license(
            course_ids=[spot_course_id],
            user_name=user_name,
            watermark_text=watermark_text,
            test=test,
        )
    except SpotPlayerError as exc:
        logger.error(
            "SpotPlayer provisioning failed (user=%s course=%s): %s",
            user.id, course.id, exc,
        )
        return None, False, str(exc)

    license_obj, created = SpotPlayerLicense.objects.update_or_create(
        user=user,
        course=course,
        defaults={
            "spotplayer_license_id": result.get("_id"),
            "spotplayer_license_key": result.get("key"),
            "spotplayer_url": result.get("url"),
            "watermark_text": watermark_text,
            "test_mode": bool(result.get("test", test)),
            "metadata": {"course_ids": result.get("course_ids", [])},
        },
    )
    return license_obj, created, None


def provision_licenses_for_order(order):
    """
    Provision SpotPlayer licenses for every course inside a paid order.

    Best-effort and idempotent; never raises so the checkout flow is unaffected
    if the DRM provider is temporarily down. Returns a list of (course, error).
    """
    errors = []
    items = order.items.select_related("product__course").all()
    for item in items:
        product = item.product
        course = getattr(product, "course", None) if product else None
        if course is None:
            continue
        if not getattr(course, "spotplayer_course_id", None):
            continue
        try:
            _, _, error = provision_license_for_course(order.user, course)
            if error:
                errors.append((course, error))
        except Exception as exc:  # noqa: BLE001 - never let DRM break checkout
            logger.exception(
                "Unexpected error provisioning license (course=%s): %s",
                course.id, exc,
            )
            errors.append((course, str(exc)))
    return errors

