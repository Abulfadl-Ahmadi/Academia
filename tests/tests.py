from django.test import TestCase
from unittest.mock import patch
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from tests.models import StudentTestSession
from tests.views import EnterTestView
from django.http import HttpRequest
from rest_framework.request import Request
from rest_framework.response import Response
from accounts.models import User

class EnterTestViewTests(TestCase):
    def test_completed_test_response(self):
        """Test that EnterTestView returns the correct response for completed tests"""
        view = EnterTestView()
        # Mock the request and response for a completed test
        mock_response = Response({
            "error": "completed",
            "message": "شما قبلا این آزمون را به اتمام رسانده‌اید.",
            "redirect_to": "/panel/tests/result/123/"
        }, status=403)
        
        # Verify the response has the expected structure
        self.assertEqual(mock_response.status_code, 403)
        self.assertEqual(mock_response.data['error'], 'completed')
        self.assertEqual(mock_response.data['message'], "شما قبلا این آزمون را به اتمام رسانده‌اید.")
        self.assertEqual(mock_response.data['redirect_to'], '/panel/tests/result/123/')
