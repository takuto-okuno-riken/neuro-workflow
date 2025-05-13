from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from .models import PythonFile
from .serializers import PythonFileSerializer, PythonFileUploadSerializer
from .services import PythonFileService


class PythonFileUploadView(APIView):
    """Pythonファイルアップロード用のビュー"""

    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]  # 必要に応じて変更

    def post(self, request):
        """ファイルをアップロード"""
        serializer = PythonFileUploadSerializer(data=request.data)

        if serializer.is_valid():
            file_service = PythonFileService()

            # ファイルを作成
            python_file = file_service.create_python_file(
                file=serializer.validated_data["file"],
                user=request.user if request.user.is_authenticated else None,
                name=serializer.validated_data.get("name"),
                description=serializer.validated_data.get("description"),
            )

            # レスポンス用のシリアライザー
            response_serializer = PythonFileSerializer(
                python_file, context={"request": request}
            )

            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PythonFileListView(APIView):
    """Pythonファイル一覧・詳細用のビュー"""

    permission_classes = [AllowAny]  # 必要に応じて変更

    def get(self, request, pk=None):
        """ファイル一覧または詳細を取得"""
        if pk:
            # 詳細を取得
            python_file = get_object_or_404(PythonFile, pk=pk)
            serializer = PythonFileSerializer(python_file, context={"request": request})
            return Response(serializer.data)
        else:
            # 一覧を取得
            python_files = PythonFile.objects.all()

            # フィルタリング（必要に応じて）
            name = request.query_params.get("name")
            if name:
                python_files = python_files.filter(name__icontains=name)

            serializer = PythonFileSerializer(
                python_files, many=True, context={"request": request}
            )
            return Response(serializer.data)

    def delete(self, request, pk):
        """ファイルを削除"""
        python_file = get_object_or_404(PythonFile, pk=pk)

        # 権限チェック（必要に応じて）
        if request.user.is_authenticated and python_file.uploaded_by != request.user:
            return Response(
                {"error": "You don't have permission to delete this file"},
                status=status.HTTP_403_FORBIDDEN,
            )

        python_file.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PythonFileContentView(APIView):
    """Pythonファイルの内容を取得・更新するビュー"""

    permission_classes = [AllowAny]  # 必要に応じて変更

    def get(self, request, pk):
        """ファイルの内容を取得"""
        python_file = get_object_or_404(PythonFile, pk=pk)
        file_service = PythonFileService()

        content = file_service.get_file_content(python_file)

        return Response(
            {"id": python_file.id, "name": python_file.name, "content": content}
        )

    def put(self, request, pk):
        """ファイルの内容を更新"""
        python_file = get_object_or_404(PythonFile, pk=pk)

        # 権限チェック
        if request.user.is_authenticated and python_file.uploaded_by != request.user:
            return Response(
                {"error": "You don't have permission to update this file"},
                status=status.HTTP_403_FORBIDDEN,
            )

        content = request.data.get("content")
        if not content:
            return Response(
                {"error": "Content is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        file_service = PythonFileService()

        # Python構文チェック
        is_valid, error = file_service.validate_python_syntax(content)
        if not is_valid:
            return Response(
                {"error": f"Invalid Python syntax: {error}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ファイル内容を更新
        updated_file = file_service.update_file_content(python_file, content)

        serializer = PythonFileSerializer(updated_file, context={"request": request})

        return Response(serializer.data)
