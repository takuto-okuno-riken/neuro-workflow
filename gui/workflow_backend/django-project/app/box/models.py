# box/models.py
from django.db import models
from django.conf import settings
import os


class PythonFile(models.Model):
    """Pythonファイルの情報を管理するモデル"""

    name = models.CharField(max_length=255, help_text="ファイル名")
    original_name = models.CharField(
        max_length=255, help_text="アップロード時のオリジナルファイル名"
    )
    file = models.FileField(
        upload_to="python_files/%Y/%m/%d/", help_text="実際のファイル"
    )
    description = models.TextField(blank=True, null=True, help_text="ファイルの説明")
    file_size = models.IntegerField(help_text="ファイルサイズ（バイト）")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_python_files",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Python File"
        verbose_name_plural = "Python Files"

    def __str__(self):
        return f"{self.name} ({self.original_name})"

    def delete(self, *args, **kwargs):
        """ファイルも一緒に削除"""
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs)
