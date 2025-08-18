from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from .models import PythonFile
from .serializers import PythonFileSerializer, PythonFileUploadSerializer
from .services.python_file_service import PythonFileService
import logging
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class PythonFileUploadView(APIView):
    """Pythonファイルアップロード用のビュー"""

    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        """ファイルをアップロードして自動解析"""
        serializer = PythonFileUploadSerializer(data=request.data)

        if serializer.is_valid():
            try:
                file_service = PythonFileService()

                # ファイルを作成・解析
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

                return Response(
                    response_serializer.data, status=status.HTTP_201_CREATED
                )

            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"Upload failed: {e}")
                return Response(
                    {"error": "Upload failed"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name="dispatch")
class PythonFileListView(APIView):
    """Pythonファイル一覧・詳細用のビュー"""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, pk=None):
        """ファイル一覧または詳細を取得"""
        if pk:
            # 詳細を取得
            python_file = get_object_or_404(PythonFile, pk=pk, is_active=True)
            serializer = PythonFileSerializer(python_file, context={"request": request})
            return Response(serializer.data)
        else:
            # 一覧を取得
            python_files = PythonFile.objects.filter(is_active=True)

            # フィルタリング
            name = request.query_params.get("name")
            if name:
                python_files = python_files.filter(name__icontains=name)

            analyzed_only = request.query_params.get("analyzed_only")
            if analyzed_only and analyzed_only.lower() == "true":
                python_files = python_files.filter(is_analyzed=True)

            serializer = PythonFileSerializer(
                python_files, many=True, context={"request": request}
            )
            return Response(serializer.data)

    def delete(self, request, pk):
        """ファイルを削除"""
        python_file = get_object_or_404(PythonFile, pk=pk, is_active=True)

        # 権限チェック
        if (
            request.user.is_authenticated
            and python_file.uploaded_by
            and python_file.uploaded_by != request.user
        ):
            return Response(
                {"error": "You don't have permission to delete this file"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 論理削除
        python_file.is_active = False
        python_file.save()

        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(csrf_exempt, name="dispatch")
class UploadedNodesView(APIView):
    """アップロードされたノードクラス一覧を取得するAPI"""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        """アップロードされたノードクラス一覧を返す"""
        try:
            # 解析済みの有効なファイルのみ取得
            python_files = PythonFile.objects.filter(
                is_active=True, is_analyzed=True, node_classes__isnull=False
            ).exclude(node_classes={})

            all_nodes = []
            for python_file in python_files:
                frontend_nodes = python_file.get_node_classes_for_frontend()
                all_nodes.extend(frontend_nodes)

            return Response(
                {
                    "nodes": all_nodes,
                    "total_files": python_files.count(),
                    "total_nodes": len(all_nodes),
                }
            )

        except Exception as e:
            logger.error(f"Failed to get uploaded nodes: {e}")
            return Response(
                {"error": f"Failed to get uploaded nodes: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


import json
from django.views import View
from django.http import JsonResponse
from rest_framework import permissions


@method_decorator(csrf_exempt, name="dispatch")
class PythonFileCodeManagementView(View):
    """
    PythonFileのコード管理ビュー
    GET: コード取得
    PUT: コード保存
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, filename):
        """ファイル名を指定してソースコードを取得"""
        try:
            # .pyが付いていない場合は付けても検索
            filenames_to_search = [filename]
            if not filename.endswith(".py"):
                filenames_to_search.append(f"{filename}.py")

            # ファイル名で検索
            python_file = PythonFile.objects.filter(
                name__in=filenames_to_search, is_active=True
            ).first()

            if not python_file:
                return JsonResponse(
                    {"error": f"File '{filename}' not found"}, status=404
                )

            # file_contentを優先、なければsource_codeを使用
            code = python_file.file_content or getattr(python_file, "source_code", "")

            if not code:
                return JsonResponse(
                    {"error": "Source code not available for this file"}, status=404
                )

            return JsonResponse(
                {
                    "status": "success",
                    "code": code,
                    "filename": python_file.name,
                    "file_id": str(python_file.id),
                    "description": python_file.description,
                    "uploaded_at": (
                        python_file.created_at.isoformat()
                        if hasattr(python_file, "created_at")
                        else None
                    ),
                }
            )

        except Exception as e:
            logger.error(f"Error getting code for file {filename}: {e}")
            return JsonResponse(
                {"error": "Failed to get code", "details": str(e)}, status=500
            )

    def put(self, request, filename):
        """編集したコードをDBに保存"""
        try:
            data = json.loads(request.body)
            code = data.get("code", "")

            if not code:
                return JsonResponse({"error": "Code is required"}, status=400)

            # .pyが付いていない場合は付けても検索
            filenames_to_search = [filename]
            if not filename.endswith(".py"):
                filenames_to_search.append(f"{filename}.py")

            # ファイル名で検索
            python_file = PythonFile.objects.filter(
                name__in=filenames_to_search, is_active=True
            ).first()

            if not python_file:
                return JsonResponse(
                    {"error": f"File '{filename}' not found"}, status=404
                )

            # 権限チェック（必要に応じて）
            if (
                request.user.is_authenticated
                and python_file.uploaded_by
                and python_file.uploaded_by != request.user
            ):
                return JsonResponse(
                    {"error": "You don't have permission to edit this file"}, status=403
                )

            # コードをDBに保存
            python_file.file_content = code

            # source_codeフィールドもある場合は更新
            if hasattr(python_file, "source_code"):
                python_file.source_code = code

            # 解析フラグをリセット（再解析が必要な場合）
            if hasattr(python_file, "is_analyzed"):
                python_file.is_analyzed = False

            python_file.save()

            logger.info(f"Saved code for file {filename}")
            return JsonResponse(
                {
                    "status": "success",
                    "message": "Code saved successfully",
                    "filename": python_file.name,
                    "file_id": str(python_file.id),
                    "code_length": len(code),
                }
            )

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)
        except Exception as e:
            logger.error(f"Error saving code for file {filename}: {e}")
            return JsonResponse(
                {"error": "Failed to save code", "details": str(e)}, status=500
            )

    def dispatch(self, request, *args, **kwargs):
        """HTTPメソッドに応じてルーティング"""
        filename = kwargs.get("filename")

        if not filename:
            return JsonResponse({"error": "filename is required"}, status=400)

        # codeエンドポイントはGETとPUTのみ許可
        if request.method == "GET":
            return self.get(request, filename)
        elif request.method == "PUT":
            return self.put(request, filename)
        else:
            return JsonResponse({"error": "Method not allowed"}, status=405)
