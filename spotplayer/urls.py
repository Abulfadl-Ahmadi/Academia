from django.urls import path

from . import views

urlpatterns = [
    path(
        "courses/<int:course_id>/license/",
        views.CourseLicenseView.as_view(),
        name="course-license",
    ),
    path(
        "courses/<int:course_id>/licenses/",
        views.CourseLicensesListView.as_view(),
        name="course-licenses-list",
    ),
    path(
        "courses/<int:course_id>/licenses/<int:license_id>/regenerate/",
        views.LicenseRegenerateView.as_view(),
        name="license-regenerate",
    ),
    path("spotx/", views.SpotXProxyView.as_view(), name="spotx-proxy"),
]
