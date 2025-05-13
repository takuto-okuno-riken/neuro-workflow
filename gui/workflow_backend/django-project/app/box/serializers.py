from rest_framework import serializers
from .models import PythonFile
import os


class PythonFileSerializer(serializers.ModelSerializer):
    """Pythonファイルのシリアライザー"""

    uploaded_by_username = serializers.CharField(
        source="uploaded_by.username", read_only=True
    )
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = PythonFile
        fields = [
            "id",
            "name",
            "original_name",
            "file",
            "file_url",
            "description",
            "file_size",
            "uploaded_by",
            "uploaded_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["file_size", "uploaded_by", "created_at", "updated_at"]

    def get_file_url(self, obj):
        """ファイルのURLを取得"""
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None

    def validate_file(self, value):
        """ファイルのバリデーション"""
        # 拡張子チェック
        ext = os.path.splitext(value.name)[1].lower()
        if ext != ".py":
            raise serializers.ValidationError("Only .py files are allowed")

        # ファイルサイズチェック（例：5MB以下）
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File size must be less than 5MB")

        return value

    def create(self, validated_data):
        """ファイル作成時の処理"""
        file = validated_data["file"]
        validated_data["file_size"] = file.size
        validated_data["original_name"] = file.name

        # ファイル名を安全な名前に変換（必要に応じて）
        if "name" not in validated_data:
            validated_data["name"] = file.name

        return super().create(validated_data)


class PythonFileUploadSerializer(serializers.Serializer):
    """ファイルアップロード専用のシリアライザー"""

    file = serializers.FileField()
    name = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True)

    def validate_file(self, value):
        """ファイルのバリデーション"""
        # 拡張子チェック
        ext = os.path.splitext(value.name)[1].lower()
        if ext != ".py":
            raise serializers.ValidationError("Only .py files are allowed")

        # ファイルサイズチェック
        if value.size > 5 * 1024 * 1024:  # 5MB
            raise serializers.ValidationError("File size must be less than 5MB")

        # ファイル内容の簡単なチェック（オプション）
        try:
            content = value.read().decode("utf-8")
            value.seek(0)  # ファイルポインタを先頭に戻す
            # Python構文チェック（オプション）
            compile(content, value.name, "exec")
        except SyntaxError as e:
            raise serializers.ValidationError(f"Invalid Python syntax: {str(e)}")
        except UnicodeDecodeError:
            raise serializers.ValidationError("File must be valid UTF-8 text")

        return value
