from core.views.alerts import AcknowledgeAlertView
from core.views.office_and_states import StateAndPostalOfficeApiView
from core.views.rebuild_kpi_snapshots import RebuildSnapshotsAPIView
from django.urls import path
from .views import (
    DashboardApiView,
    RefreshDashboard,
    UploadBagsCSV,
    UploadCSVAndSave,
    PackageStatsAPIView,
    TransitionReportAPIView,
    OneOfficeAPIView,
    OneStateAPIView,
    MajorCentersAPIView,
)

urlpatterns = [
    path("upload/", UploadCSVAndSave.as_view(), name="upload-csv"),
    path("bag-upload/", UploadBagsCSV.as_view(), name="bag-upload"),
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
    path(
        "rebuild_snapshots/",
        RebuildSnapshotsAPIView.as_view(),
        name="rebuild_snapshots",
    ),
    path(
        "state-office/",
        StateAndPostalOfficeApiView.as_view(),
        name="state-and-postal-office-data",
    ),
    path(
        "alerts/<int:alert_id>/acknowledge/",
        AcknowledgeAlertView.as_view(),
        name="acknowledge-alert",
    ),
]
