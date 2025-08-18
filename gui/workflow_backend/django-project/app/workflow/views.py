from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from .models import FlowProject, FlowNode, FlowEdge
from .serializers import (
    FlowProjectSerializer,
    FlowNodeSerializer,
    FlowEdgeSerializer,
    FlowDataSerializer,
)
from .services import FlowService
import json
import logging
from django.contrib.auth.models import User
import os
from pathlib import Path
from django.conf import settings
from .code_generation_service import CodeGenerationService

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class FlowProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []
    """フロープロジェクトのCRUD操作"""

    serializer_class = FlowProjectSerializer
    lookup_url_kwarg = "workflow_id"

    def get_queryset(self):
        return FlowProject.objects.filter(is_active=True)

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            owner = self.request.user
        else:
            # デフォルトユーザーを取得または作成
            owner, created = User.objects.get_or_create(
                username="anonymous_user",
                defaults={
                    "email": "anonymous@example.com",
                    "first_name": "Anonymous",
                    "last_name": "User",
                    "is_active": True,
                },
            )
            if created:
                print("Created default anonymous user")

        # プロジェクトを保存
        project = serializer.save(owner=owner)

        # プロジェクト作成後にPythonファイルを自動生成
        self.create_project_python_file(project)

        return project

    def create_project_python_file(self, project):
        """プロジェクト作成時にPythonファイルを生成"""
        try:
            code_service = CodeGenerationService()
            code_file = code_service.get_code_file_path(project.id)

            # 基本テンプレートを作成
            python_code = code_service._create_base_template(project)

            # ファイルに書き込み
            with open(code_file, "w", encoding="utf-8") as f:
                f.write(python_code)

            logger.info(f"Created Python file for project {project.id}: {code_file}")

        except Exception as e:
            logger.error(f"Failed to create Python file for project {project.id}: {e}")
            # エラーが発生してもプロジェクト作成は継続

    @action(detail=True, methods=["get", "put"])
    def flow(self, request, **kwargs):
        """フローデータの取得・保存（一括保存用として残す）"""
        project = self.get_object()

        if request.method == "GET":
            flow_data = FlowService.get_flow_data(str(project.id))
            return Response(flow_data)

        elif request.method == "PUT":
            serializer = FlowDataSerializer(data=request.data)
            if serializer.is_valid():
                try:
                    FlowService.save_flow_data(
                        str(project.id),
                        serializer.validated_data["nodes"],
                        serializer.validated_data["edges"],
                    )

                    # 一括保存後にコード全体を再生成
                    code_service = CodeGenerationService()
                    code_updated = code_service.update_project_code(str(project.id))

                    response_data = {
                        "status": "success",
                        "message": "Flow data saved successfully",
                    }

                    if code_updated:
                        response_data["code_status"] = "Code regenerated successfully"
                    else:
                        response_data["code_status"] = "Code regeneration failed"

                    return Response(response_data)
                except Exception as e:
                    logger.error(f"Error saving flow data: {e}")
                    return Response(
                        {"error": str(e)}, status=status.HTTP_400_BAD_REQUEST
                    )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name="dispatch")
class FlowNodeViewSet(viewsets.ModelViewSet):
    """フローノードのCRUD操作（リアルタイム対応）"""

    authentication_classes = []

    serializer_class = FlowNodeSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        project_id = self.kwargs.get("workflow_id")
        if project_id:
            return FlowNode.objects.filter(project_id=project_id)
        return FlowNode.objects.none()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """ノード作成（リアルタイム保存 + コード生成）"""
        project_id = self.kwargs.get("workflow_id")
        logger.info(f"Creating node in project {project_id} with data: {request.data}")

        try:
            # プロジェクトの存在確認
            project = get_object_or_404(FlowProject, id=project_id)

            # リクエストデータの検証
            required_fields = ["id", "position"]
            for field in required_fields:
                if field not in request.data:
                    logger.warning(f"Missing required field: {field}")
                    return Response(
                        {"error": f"Missing required field: {field}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # FlowServiceを使用してノード作成（既存の処理と同じ）
            node_data = {
                "id": request.data["id"],
                "position": request.data["position"],
                "type": request.data.get("type", "default"),
                "data": request.data.get("data", {}),
            }

            # 既存ノードの確認（重複作成を防ぐ）
            try:
                existing_node = FlowNode.objects.get(
                    id=node_data["id"], project=project
                )
                logger.info(f"Node {node_data['id']} already exists, updating instead")

                # 既存の場合は更新
                existing_node.position_x = node_data["position"]["x"]
                existing_node.position_y = node_data["position"]["y"]
                existing_node.node_type = node_data.get("type", existing_node.node_type)
                existing_node.data = node_data.get("data", existing_node.data)
                existing_node.save()

                # 増分コード生成: 既存ノードの更新時はコードブロックを追加
                code_service = CodeGenerationService()
                code_updated = code_service.add_node_code(
                    str(project.id), existing_node
                )

                serializer = FlowNodeSerializer(existing_node)
                response_data = {
                    "status": "success",
                    "message": "Node updated (already existed)",
                    "data": serializer.data,
                }

                if code_updated:
                    response_data["code_status"] = (
                        "Code block and WorkflowBuilder chain updated successfully"
                    )
                else:
                    response_data["code_status"] = "Code updates failed"

                return Response(response_data, status=status.HTTP_200_OK)

            except FlowNode.DoesNotExist:
                # 新規作成
                node = FlowService.create_node(str(project.id), node_data)

                # 増分コード生成: 新しいノードのコードブロックを追加
                code_service = CodeGenerationService()
                code_updated = code_service.add_node_code(str(project.id), node)

                serializer = FlowNodeSerializer(node)

                response_data = {
                    "status": "success",
                    "message": "Node created successfully",
                    "data": serializer.data,
                }

                if code_updated:
                    response_data["code_status"] = (
                        "Code block and WorkflowBuilder chain generated successfully"
                    )
                else:
                    response_data["code_status"] = "Code generation failed"

                logger.info(
                    f"Successfully created node {node.id} in project {project.id}"
                )
                return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(
                f"Error creating node in project {project_id}: {e}", exc_info=True
            )
            return Response(
                {"error": f"Failed to create node: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """ノード更新（位置変更、データ変更など + 条件付きコード生成）"""
        project_id = self.kwargs.get("workflow_id")
        node_id = self.kwargs.get("node_id")
        logger.info(
            f"Updating node {node_id} in project {project_id} with data: {request.data}"
        )

        try:
            # プロジェクトの存在確認
            project = get_object_or_404(FlowProject, id=project_id)

            # ノードの存在確認（IDで直接検索）
            try:
                existing_node = FlowNode.objects.get(id=node_id, project=project)
            except FlowNode.DoesNotExist:
                logger.warning(f"Node {node_id} not found in project {project_id}")
                return Response(
                    {"error": f"Node {node_id} not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # FlowServiceを使用してノード更新
            node_data = {}
            if "position" in request.data:
                node_data["position"] = request.data["position"]
            if "type" in request.data:
                node_data["type"] = request.data["type"]
            if "data" in request.data:
                node_data["data"] = request.data["data"]

            node = FlowService.update_node(node_id, project_id, node_data)

            # 条件付きコード生成: データが変更された場合のみコードブロックを更新
            should_generate_code = "data" in request.data or "type" in request.data
            code_updated = True
            workflow_updated = True

            if should_generate_code:
                code_service = CodeGenerationService()
                code_updated = code_service.add_node_code(str(project_id), node)
                workflow_updated = code_service.update_workflow_builder(str(project_id))

            serializer = FlowNodeSerializer(node)

            response_data = {
                "status": "success",
                "message": "Node updated successfully",
                "data": serializer.data,
            }

            if should_generate_code:
                if code_updated and workflow_updated:
                    response_data["code_status"] = (
                        "Code block and WorkflowBuilder chain updated successfully"
                    )
                elif code_updated:
                    response_data["code_status"] = (
                        "Code block updated, but WorkflowBuilder chain update failed"
                    )
                elif workflow_updated:
                    response_data["code_status"] = (
                        "WorkflowBuilder chain updated, but code block update failed"
                    )
                else:
                    response_data["code_status"] = "Code updates failed"

            logger.info(f"Successfully updated node {node_id} in project {project_id}")
            return Response(response_data)

        except Exception as e:
            logger.error(
                f"Error updating node {node_id} in project {project_id}: {e}",
                exc_info=True,
            )
            return Response(
                {"error": f"Failed to update node: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """ノード削除 + コード削除"""
        project_id = self.kwargs.get("workflow_id")
        node_id = self.kwargs.get("node_id")
        logger.info(f"Deleting node {node_id} from project {project_id}")

        try:
            # プロジェクトの存在確認
            project = get_object_or_404(FlowProject, id=project_id)

            # ノードの存在確認（IDで直接検索）
            try:
                existing_node = FlowNode.objects.get(id=node_id, project=project)
            except FlowNode.DoesNotExist:
                logger.warning(
                    f"Node {node_id} not found in project {project_id}, but returning success"
                )
                # ノードが存在しない場合も成功として扱う（冪等性）
                return Response(
                    {
                        "status": "success",
                        "message": "Node already deleted or not found",
                    },
                    status=status.HTTP_200_OK,
                )

            # 増分コード削除: 削除前にコードブロックを削除
            code_service = CodeGenerationService()
            code_updated = code_service.remove_node_code(str(project_id), node_id)

            # FlowServiceを使用してノード削除（関連エッジも自動削除）
            FlowService.delete_node(node_id, project_id)

            response_data = {
                "status": "success",
                "message": "Node and related edges deleted successfully",
            }

            if code_updated:
                response_data["code_status"] = (
                    "Code block removed and WorkflowBuilder chain updated successfully"
                )
            else:
                response_data["code_status"] = "Code updates failed"

            logger.info(
                f"Successfully deleted node {node_id} from project {project_id}"
            )
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(
                f"Error deleting node {node_id} from project {project_id}: {e}",
                exc_info=True,
            )
            return Response(
                {"error": f"Failed to delete node: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )


@method_decorator(csrf_exempt, name="dispatch")
class FlowEdgeViewSet(viewsets.ModelViewSet):
    """フローエッジのCRUD操作（リアルタイム対応）"""

    serializer_class = FlowEdgeSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get_queryset(self):
        project_id = self.kwargs.get("workflow_id")
        if project_id:
            return FlowEdge.objects.filter(project_id=project_id)
        return FlowEdge.objects.none()

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """エッジ作成（リアルタイム保存 + WorkflowBuilder更新）"""
        project_id = self.kwargs.get("workflow_id")
        logger.info(f"Creating edge in project {project_id} with data: {request.data}")

        try:
            # プロジェクトの存在確認
            project = get_object_or_404(FlowProject, id=project_id)

            # リクエストデータの検証
            required_fields = ["id", "source", "target"]
            for field in required_fields:
                if field not in request.data:
                    logger.warning(f"Missing required field: {field}")
                    return Response(
                        {"error": f"Missing required field: {field}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            edge_data = {
                "id": request.data["id"],
                "source": request.data["source"],
                "target": request.data["target"],
                "sourceHandle": request.data.get("sourceHandle"),
                "targetHandle": request.data.get("targetHandle"),
                "data": request.data.get("data", {}),
            }

            # 既存エッジの確認（重複作成を防ぐ）
            try:
                existing_edge = FlowEdge.objects.get(
                    id=edge_data["id"], project=project
                )
                logger.info(f"Edge {edge_data['id']} already exists")

                # WorkflowBuilderチェーンを更新（既存エッジでも）
                code_service = CodeGenerationService()
                workflow_updated = code_service.update_workflow_builder(str(project.id))

                serializer = FlowEdgeSerializer(existing_edge)
                response_data = {
                    "status": "success",
                    "message": "Edge already exists",
                    "data": serializer.data,
                }

                if workflow_updated:
                    response_data["code_status"] = (
                        "WorkflowBuilder chain updated successfully"
                    )
                else:
                    response_data["code_status"] = "WorkflowBuilder chain update failed"

                return Response(response_data, status=status.HTTP_200_OK)

            except FlowEdge.DoesNotExist:
                # 新規作成
                edge = FlowService.create_edge(str(project.id), edge_data)

                # WorkflowBuilderチェーンを更新
                code_service = CodeGenerationService()
                workflow_updated = code_service.update_workflow_builder(str(project.id))

                serializer = FlowEdgeSerializer(edge)

                response_data = {
                    "status": "success",
                    "message": "Edge created successfully",
                    "data": serializer.data,
                }

                if workflow_updated:
                    response_data["code_status"] = (
                        "WorkflowBuilder chain updated successfully"
                    )
                else:
                    response_data["code_status"] = "WorkflowBuilder chain update failed"

                logger.info(
                    f"Successfully created edge {edge.id} in project {project.id}"
                )
                return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(
                f"Error creating edge in project {project_id}: {e}", exc_info=True
            )
            return Response(
                {"error": f"Failed to create edge: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """エッジ削除 + WorkflowBuilder更新"""
        project_id = self.kwargs.get("workflow_id")
        edge_id = self.kwargs.get("edge_id")
        logger.info(f"Deleting edge {edge_id} from project {project_id}")

        try:
            # プロジェクトの存在確認
            project = get_object_or_404(FlowProject, id=project_id)

            # エッジの存在確認（IDで直接検索）
            try:
                existing_edge = FlowEdge.objects.get(id=edge_id, project=project)
            except FlowEdge.DoesNotExist:
                logger.warning(
                    f"Edge {edge_id} not found in project {project_id}, but returning success"
                )
                # エッジが存在しない場合も成功として扱う（冪等性）
                return Response(
                    {
                        "status": "success",
                        "message": "Edge already deleted or not found",
                    },
                    status=status.HTTP_200_OK,
                )

            # FlowServiceを使用してエッジ削除
            FlowService.delete_edge(edge_id, project_id)

            # WorkflowBuilderチェーンを更新
            code_service = CodeGenerationService()
            workflow_updated = code_service.update_workflow_builder(str(project_id))

            response_data = {
                "status": "success",
                "message": "Edge deleted successfully",
            }

            if workflow_updated:
                response_data["code_status"] = (
                    "WorkflowBuilder chain updated successfully"
                )
            else:
                response_data["code_status"] = "WorkflowBuilder chain update failed"

            logger.info(
                f"Successfully deleted edge {edge_id} from project {project_id}"
            )
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(
                f"Error deleting edge {edge_id} from project {project_id}: {e}",
                exc_info=True,
            )
            return Response(
                {"error": f"Failed to delete edge: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )


@method_decorator(csrf_exempt, name="dispatch")
class SampleFlowView(APIView):
    """サンプルフローデータの提供"""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        """サンプルフローデータを返す"""
        try:
            sample_flow = FlowService.get_sample_flow_data()
            return Response(sample_flow, content_type="application/json")
        except Exception as e:
            logger.error(f"Error getting sample flow data: {e}")
            return Response(
                {"error": "Failed to get sample flow data"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from django.conf import settings
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import logging

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class CodeManagementView(View):
    """
    コード管理ビュー
    GET: コード取得
    PUT: コード保存
    POST: コード実行
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # CodeGenerationServiceを使用してコードファイルを管理
        self.code_service = CodeGenerationService()

    def get(self, request, workflow_id):
        """コードファイルを取得"""
        try:
            code_file = self.code_service.get_code_file_path(workflow_id)

            if code_file.exists():
                with open(code_file, "r", encoding="utf-8") as f:
                    code = f.read()
            else:
                # ファイルが存在しない場合はデフォルトコードを返す
                try:
                    project = FlowProject.objects.get(id=workflow_id)
                    code = self.code_service._create_base_template(project)
                except FlowProject.DoesNotExist:
                    code = f"""# Generated code for workflow: {workflow_id}
# This is a placeholder. Replace with your actual code.

def main():
    print("Hello from workflow {workflow_id}!")
    print("This code was generated automatically.")
    
    # TODO: Add your workflow logic here
    
    return "Workflow completed successfully"

if __name__ == "__main__":
    result = main()
    print(f"Result: {{result}}")
"""

            return JsonResponse(
                {
                    "status": "success",
                    "code": code,
                    "workflow_id": str(workflow_id),
                    "file_path": str(code_file),
                }
            )

        except Exception as e:
            logger.error(f"Error getting code for workflow {workflow_id}: {e}")
            return JsonResponse(
                {"error": "Failed to get code", "details": str(e)}, status=500
            )

    def put(self, request, workflow_id):
        """コードファイルを保存"""
        try:
            data = json.loads(request.body)
            code = data.get("code", "")

            if not code:
                return JsonResponse({"error": "Code is required"}, status=400)

            code_file = self.code_service.get_code_file_path(workflow_id)

            # コードファイルを保存
            with open(code_file, "w", encoding="utf-8") as f:
                f.write(code)

            logger.info(f"Saved code for workflow {workflow_id}")
            return JsonResponse(
                {
                    "status": "success",
                    "message": "Code saved successfully",
                    "workflow_id": str(workflow_id),
                    "file_path": str(code_file),
                    "code_length": len(code),
                }
            )

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)
        except Exception as e:
            logger.error(f"Error saving code for workflow {workflow_id}: {e}")
            return JsonResponse(
                {"error": "Failed to save code", "details": str(e)}, status=500
            )

    def post(self, request, workflow_id):
        """コードを実行"""
        try:
            data = json.loads(request.body)
            code = data.get("code", "")

            if not code:
                return JsonResponse({"error": "Code is required"}, status=400)

            # 実行結果を取得
            result = self.execute_python_code(code, workflow_id)

            return JsonResponse(result)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)
        except Exception as e:
            logger.error(f"Error executing code for workflow {workflow_id}: {e}")
            return JsonResponse(
                {
                    "status": "error",
                    "error": "Failed to execute code",
                    "details": str(e),
                },
                status=500,
            )

    def execute_python_code(self, code, workflow_id):
        """Pythonコードを安全に実行"""
        start_time = time.time()

        try:
            # 一時ファイルを作成してコードを保存
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".py", delete=False, encoding="utf-8"
            ) as temp_file:
                temp_file.write(code)
                temp_file_path = temp_file.name

            try:
                # Pythonコードを実行
                result = subprocess.run(
                    [sys.executable, temp_file_path],
                    capture_output=True,
                    text=True,
                    timeout=30,  # 30秒でタイムアウト
                    cwd=str(self.code_service.code_dir),  # 実行ディレクトリを設定
                )

                execution_time = time.time() - start_time

                if result.returncode == 0:
                    return {
                        "status": "success",
                        "output": result.stdout,
                        "execution_time": round(execution_time * 1000, 2),  # ミリ秒
                        "workflow_id": str(workflow_id),
                    }
                else:
                    return {
                        "status": "error",
                        "error": result.stderr,
                        "output": result.stdout,
                        "execution_time": round(execution_time * 1000, 2),
                        "workflow_id": str(workflow_id),
                    }

            finally:
                # 一時ファイルを削除
                try:
                    os.unlink(temp_file_path)
                except OSError:
                    pass

        except subprocess.TimeoutExpired:
            return {
                "status": "error",
                "error": "Code execution timed out (30 seconds)",
                "execution_time": 30000,
                "workflow_id": str(workflow_id),
            }
        except Exception as e:
            execution_time = time.time() - start_time
            return {
                "status": "error",
                "error": f"Execution failed: {str(e)}",
                "execution_time": round(execution_time * 1000, 2),
                "workflow_id": str(workflow_id),
            }

    def dispatch(self, request, *args, **kwargs):
        """HTTPメソッドに応じてルーティング"""
        workflow_id = kwargs.get("workflow_id")

        if not workflow_id:
            return JsonResponse({"error": "workflow_id is required"}, status=400)

        # executeエンドポイントの場合はPOSTのみ許可
        if request.path.endswith("/execute/"):
            if request.method == "POST":
                return self.post(request, workflow_id)
            else:
                return JsonResponse(
                    {"error": "Method not allowed for execute endpoint"}, status=405
                )

        # codeエンドポイントの場合はGETとPUTを許可
        if request.path.endswith("/code/"):
            if request.method == "GET":
                return self.get(request, workflow_id)
            elif request.method == "PUT":
                return self.put(request, workflow_id)
            else:
                return JsonResponse(
                    {"error": "Method not allowed for code endpoint"}, status=405
                )

        return JsonResponse({"error": "Invalid endpoint"}, status=404)
