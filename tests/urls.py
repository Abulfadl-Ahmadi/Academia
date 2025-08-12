from django.urls import path
from .views import (
    ListCreateTestView,
    EnterTestView,
    SubmitAnswerView,
    FinishTestView,
    UpdateDeleteTestView,
    CreateReport,
    TestDetailView,
    GetAnswersView,
    ExitTestView,
)

urlpatterns = [
    path('tests/', ListCreateTestView.as_view(), name='create-test'),
    path('tests/<int:pk>/update', UpdateDeleteTestView.as_view(), name='update-delete-test'),
    path('tests/<int:pk>/', TestDetailView.as_view(), name='update-delete-test'),

    path('enter-test/', EnterTestView.as_view(), name='enter-test'),
    path('submit-answer/', SubmitAnswerView.as_view(), name='submit-answer'),
    path('get-answer/', GetAnswersView.as_view(), name='get-answer'),
    path('exit-test/', ExitTestView.as_view(), name='exit-test'),
    path('finish-test/', FinishTestView.as_view(), name='finish-test'),

    path('report/<int:test_id>/', CreateReport.as_view(), name='create-report'),
]
