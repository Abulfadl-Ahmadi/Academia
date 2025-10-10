from django.urls import path, include
from rest_framework.routers import DefaultRouter
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
    TestCollectionViewSet,
    SecureTestFileView,
    QuestionViewSet,
    OptionViewSet,
    QuestionImageViewSet,
    QuestionCollectionViewSet,
    ListCreateQuestionTestView,
    QuestionTestDetailView,
)
from .public_views import test_poster_public, test_detail_public
from .topic_tests_views import (
    TopicTestViewSet,
    RandomTopicTestView,
    StudentTopicTestHistoryView
)

router = DefaultRouter()
router.register(r'test-collections', TestCollectionViewSet, basename='test-collections')
router.register(r'topic-tests', TopicTestViewSet, basename='topic-tests')
router.register(r'questions', QuestionViewSet, basename='questions')
router.register(r'question-collections', QuestionCollectionViewSet, basename='question-collections')
router.register(r'options', OptionViewSet, basename='options')
router.register(r'question-images', QuestionImageViewSet, basename='question-images')

urlpatterns = [
    path('', include(router.urls)),
    path('tests/', ListCreateTestView.as_view(), name='create-test'),
    path('tests/<int:pk>/update', UpdateDeleteTestView.as_view(), name='update-delete-test'),
    path('tests/<int:test_id>/file/<str:file_type>/', SecureTestFileView.as_view(), name='secure-test-file'),
    
    # Public poster endpoint - must come before tests/<int:pk>/ pattern
    path('question-tests/<int:test_id>/poster/', test_poster_public, name='test-poster-public'),
    path('question-tests/<int:test_id>/detail/', test_detail_public, name='test-detail-public'),
    
    path('tests/<int:pk>/', TestDetailView.as_view(), name='test-detail'),

    path('question-tests/', ListCreateQuestionTestView.as_view(), name='create-question-test'),
    path('question-tests/<int:pk>/', QuestionTestDetailView.as_view(), name='question-test-detail'),

    path('enter-test/', EnterTestView.as_view(), name='enter-test'),
    path('submit-answer/', SubmitAnswerView.as_view(), name='submit-answer'),
    path('get-answer/', GetAnswersView.as_view(), name='get-answer'),
    path('exit-test/', ExitTestView.as_view(), name='exit-test'),
    path('finish-test/', FinishTestView.as_view(), name='finish-test'),

    path('tests/report/<int:test_id>/', CreateReport.as_view(), name='create-report'),

    # URLs جدید برای آزمون‌های مبحثی
    path('topic-tests/random/', RandomTopicTestView.as_view(), name='random-topic-test'),
    path('topic-tests/my-history/', StudentTopicTestHistoryView.as_view(), name='student-topic-test-history'),
]
