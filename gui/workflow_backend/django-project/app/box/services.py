from django.core.files.base import ContentFile
from django.utils.text import slugify
from .models import PythonFile
import os
import hashlib
from datetime import datetime


class PythonFileService:
    """Pythonファイル管理のビジネスロジック"""

    def create_python_file(self, file, user, name=None, description=None):
        """Pythonファイルを作成"""
        # ファイル名の生成
        if not name:
            name = file.name

        # ファイル名を安全な形式に変換
        safe_name = self.generate_safe_filename(name)

        # ファイルの保存
        python_file = PythonFile(
            name=safe_name,
            original_name=file.name,
            description=description,
            file_size=file.size,
            uploaded_by=user,
        )

        # ファイルを保存
        python_file.file.save(safe_name, file, save=True)

        return python_file

    def generate_safe_filename(self, filename):
        """安全なファイル名を生成"""
        name, ext = os.path.splitext(filename)
        # ファイル名をスラッグ化
        safe_name = slugify(name)
        # タイムスタンプを追加して一意性を確保
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{safe_name}_{timestamp}{ext}"

    def get_file_content(self, python_file):
        """ファイルの内容を取得"""
        if python_file.file:
            with python_file.file.open("r") as f:
                return f.read()
        return None

    def update_file_content(self, python_file, new_content):
        """ファイルの内容を更新"""
        if python_file.file:
            # 既存のファイルを削除
            python_file.file.delete(save=False)

            # 新しいファイルを作成
            content_file = ContentFile(new_content.encode("utf-8"))
            python_file.file.save(
                self.generate_safe_filename(python_file.name), content_file, save=True
            )
        return python_file

    def validate_python_syntax(self, content):
        """Python構文の検証"""
        try:
            compile(content, "<string>", "exec")
            return True, None
        except SyntaxError as e:
            return False, str(e)

    def get_file_hash(self, file):
        """ファイルのハッシュ値を計算"""
        hasher = hashlib.sha256()
        for chunk in file.chunks():
            hasher.update(chunk)
        return hasher.hexdigest()
