from django.urls import path
from .views import (
    FlowProjectViewSet,
    FlowNodeViewSet,
    FlowEdgeViewSet,
    SampleFlowView,
    CodeManagementView,
)

app_name = "workflow"

# ViewSetをAPIViewとして使用するためのヘルパー
project_list = FlowProjectViewSet.as_view({"get": "list", "post": "create"})

project_detail = FlowProjectViewSet.as_view(
    {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}
)

project_flow = FlowProjectViewSet.as_view({"get": "flow", "put": "flow"})

node_list_create = FlowNodeViewSet.as_view({"get": "list", "post": "create"})

node_detail = FlowNodeViewSet.as_view(
    {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}
)

edge_list_create = FlowEdgeViewSet.as_view({"get": "list", "post": "create"})

edge_detail = FlowEdgeViewSet.as_view({"delete": "destroy"})

# コード管理用のビュー
code_management = CodeManagementView.as_view()

urlpatterns = [
    # プロジェクト管理
    path("", project_list, name="workflow-list-create"),  # GET(一覧), POST(作成)
    path(
        "<uuid:workflow_id>/", project_detail, name="workflow-detail"
    ),  # GET(詳細), PUT/PATCH(更新), DELETE(削除)
    # フローデータ管理
    path(
        "<uuid:workflow_id>/flow/", project_flow, name="workflow-flow"
    ),  # GET(フロー取得), PUT(フロー保存)
    # コード管理 - 新規追加
    path(
        "<uuid:workflow_id>/code/", code_management, name="workflow-code"
    ),  # GET(コード取得), PUT(コード保存)
    path(
        "<uuid:workflow_id>/execute/", code_management, name="workflow-execute"
    ),  # POST(コード実行)
    # ノード管理
    path(
        "<uuid:workflow_id>/nodes/",
        node_list_create,
        name="workflow-node-list-create",
    ),  # GET(ノード一覧), POST(ノード作成)
    path(
        "<uuid:workflow_id>/nodes/<str:node_id>/",
        node_detail,
        name="workflow-node-detail",
    ),  # GET(詳細), PUT/PATCH(更新), DELETE(削除)
    # エッジ管理
    path(
        "<uuid:workflow_id>/edges/",
        edge_list_create,
        name="workflow-edge-list-create",
    ),  # GET(エッジ一覧), POST(エッジ作成)
    path(
        "<uuid:workflow_id>/edges/<str:edge_id>/",
        edge_detail,
        name="workflow-edge-detail",
    ),  # DELETE(削除)
    # サンプルデータ
    path(
        "sample-flow/", SampleFlowView.as_view(), name="sample-flow"
    ),  # GET(サンプルフロー取得)
]

# 利用可能なAPI一覧:
"""
# プロジェクト管理
GET    /workflow/                              # プロジェクト一覧
POST   /workflow/                              # プロジェクト作成
GET    /workflow/{workflow_id}/                # プロジェクト詳細
PUT    /workflow/{workflow_id}/                # プロジェクト更新
DELETE /workflow/{workflow_id}/                # プロジェクト削除

# フローデータ管理（React Flowのデータをそのまま保存・取得）
GET    /workflow/{workflow_id}/flow/           # フローデータ取得
PUT    /workflow/{workflow_id}/flow/           # フローデータ保存

# コード管理 - 新規追加
GET    /workflow/{workflow_id}/code/           # コード取得
PUT    /workflow/{workflow_id}/code/           # コード保存
POST   /workflow/{workflow_id}/execute/        # コード実行

# ノード管理
GET    /workflow/{workflow_id}/nodes/          # ノード一覧
POST   /workflow/{workflow_id}/nodes/          # ノード作成
GET    /workflow/{workflow_id}/nodes/{node_id}/ # ノード詳細
PUT    /workflow/{workflow_id}/nodes/{node_id}/ # ノード更新
DELETE /workflow/{workflow_id}/nodes/{node_id}/ # ノード削除

# エッジ管理
GET    /workflow/{workflow_id}/edges/          # エッジ一覧
POST   /workflow/{workflow_id}/edges/          # エッジ作成
DELETE /workflow/{workflow_id}/edges/{edge_id}/ # エッジ削除

# サンプルデータ
GET    /workflow/sample-flow/                  # サンプルフローデータ取得

リクエスト例:
# コード取得
GET /workflow/{workflow_id}/code/
Response: {"code": "print('Hello World')"}

# コード保存
PUT /workflow/{workflow_id}/code/
{"code": "print('Hello World')"}

# コード実行
POST /workflow/{workflow_id}/execute/
{"code": "print('Hello World')"}
Response: {"status": "success", "output": "Hello World\n", "execution_time": 0.001}
"""
