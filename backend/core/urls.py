from django.urls import path
from .views import (
    DashboardApiView,
    RefreshDashboard,
    UploadCSVAndSave,
    PackageStatsAPIView,
    TransitionReportAPIView,
    OneOfficeAPIView,
    OneStateAPIView,
    MajorCentersAPIView,
)

urlpatterns = [
    path("upload/", UploadCSVAndSave.as_view(), name="upload-csv"),
    path("stats/", PackageStatsAPIView.as_view(), name="package-stats"),  # Deprecated
    path(
        "transitions/report/",
        TransitionReportAPIView.as_view(),
        name="transitions-report",
    ),
    path("dashboard/", DashboardApiView.as_view(), name="dashboard"),
    path("states/<int:stateID>", OneStateAPIView.as_view(), name="one-state"),
    path("offices/<str:officeID>", OneOfficeAPIView.as_view(), name="one-office"),
    path("center/<str:centerID>", MajorCentersAPIView.as_view(), name="center"),
    path("refresh/", RefreshDashboard.as_view(), name="refresh"),
]
