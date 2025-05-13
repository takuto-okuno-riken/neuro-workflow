from django.urls import path
from .views import PythonFileUploadView, PythonFileListView, PythonFileContentView

app_name = "box"

urlpatterns = [
    # ファイルアップロード
    path("upload/", PythonFileUploadView.as_view(), name="python-file-upload"),
    # ファイル一覧
    path("files/", PythonFileListView.as_view(), name="python-file-list"),
    # ファイル詳細
    path("files/<int:pk>/", PythonFileListView.as_view(), name="python-file-detail"),
    # ファイル内容の取得・更新
    path(
        "files/<int:pk>/content/",
        PythonFileContentView.as_view(),
        name="python-file-content",
    ),
]
