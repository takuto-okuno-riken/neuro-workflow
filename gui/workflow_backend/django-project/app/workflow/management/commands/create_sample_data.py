from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from app.workflow.models import FlowProject, FlowNode, FlowEdge


class Command(BaseCommand):
    help = "Create sample flow project with arithmetic operations"

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            type=str,
            default="testuser",
            help="Username for sample data owner",
        )

    def handle(self, *args, **options):
        username = options["username"]

        # ユーザーを取得または作成
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": f"{username}@example.com",
                "first_name": "Test",
                "last_name": "User",
            },
        )

        if created:
            user.set_password("testpass")
            user.save()
            self.stdout.write(f"Created user: {username}")
        else:
            self.stdout.write(f"Using existing user: {username}")

        with transaction.atomic():
            # サンプルプロジェクトを作成
            project = self.create_sample_project(user)

            # 四則演算フローを作成
            self.create_arithmetic_flow(project)

        self.stdout.write(
            self.style.SUCCESS("Successfully created arithmetic flow project")
        )

    def create_sample_project(self, user):
        """サンプルプロジェクトを作成"""
        project, created = FlowProject.objects.get_or_create(
            name="四則演算フロー",
            owner=user,
            defaults={
                "description": "基本的な四則演算を行うReact Flowのサンプルプロジェクト"
            },
        )

        if created:
            self.stdout.write(f"Created project: {project.name}")
        else:
            # 既存プロジェクトの場合、既存ノードとエッジを削除
            FlowNode.objects.filter(project=project).delete()
            FlowEdge.objects.filter(project=project).delete()
            self.stdout.write(f"Updated existing project: {project.name}")

        return project

    def create_arithmetic_flow(self, project):
        """四則演算フローを作成"""

        # ノードを作成
        nodes = [
            # 入力ノード
            FlowNode(
                id="input-a",
                project=project,
                position_x=50,
                position_y=100,
                node_type="inputNode",
                data={
                    "label": "数値A",
                    "value": 12,
                    "nodeType": "NumberInput",
                    "schema": [
                        {
                            "title": "value",
                            "type": "number",
                            "description": "入力する数値A",
                            "isOutput": True,
                        }
                    ],
                },
            ),
            FlowNode(
                id="input-b",
                project=project,
                position_x=50,
                position_y=300,
                node_type="inputNode",
                data={
                    "label": "数値B",
                    "value": 4,
                    "nodeType": "NumberInput",
                    "schema": [
                        {
                            "title": "value",
                            "type": "number",
                            "description": "入力する数値B",
                            "isOutput": True,
                        }
                    ],
                },
            ),
            # 四則演算ノード
            FlowNode(
                id="addition",
                project=project,
                position_x=300,
                position_y=50,
                node_type="calculationNode",
                data={
                    "label": "加算 (A + B)",
                    "operation": "add",
                    "nodeType": "Addition",
                    "schema": [
                        {
                            "title": "a",
                            "type": "number",
                            "description": "数値A",
                            "isInput": True,
                        },
                        {
                            "title": "b",
                            "type": "number",
                            "description": "数値B",
                            "isInput": True,
                        },
                        {
                            "title": "result",
                            "type": "number",
                            "description": "A + Bの結果",
                            "isOutput": True,
                        },
                    ],
                },
            ),
            FlowNode(
                id="subtraction",
                project=project,
                position_x=300,
                position_y=150,
                node_type="calculationNode",
                data={
                    "label": "減算 (A - B)",
                    "operation": "subtract",
                    "nodeType": "Subtraction",
                    "schema": [
                        {
                            "title": "a",
                            "type": "number",
                            "description": "数値A",
                            "isInput": True,
                        },
                        {
                            "title": "b",
                            "type": "number",
                            "description": "数値B",
                            "isInput": True,
                        },
                        {
                            "title": "result",
                            "type": "number",
                            "description": "A - Bの結果",
                            "isOutput": True,
                        },
                    ],
                },
            ),
            FlowNode(
                id="multiplication",
                project=project,
                position_x=300,
                position_y=250,
                node_type="calculationNode",
                data={
                    "label": "乗算 (A × B)",
                    "operation": "multiply",
                    "nodeType": "Multiplication",
                    "schema": [
                        {
                            "title": "a",
                            "type": "number",
                            "description": "数値A",
                            "isInput": True,
                        },
                        {
                            "title": "b",
                            "type": "number",
                            "description": "数値B",
                            "isInput": True,
                        },
                        {
                            "title": "result",
                            "type": "number",
                            "description": "A × Bの結果",
                            "isOutput": True,
                        },
                    ],
                },
            ),
            FlowNode(
                id="division",
                project=project,
                position_x=300,
                position_y=350,
                node_type="calculationNode",
                data={
                    "label": "除算 (A ÷ B)",
                    "operation": "divide",
                    "nodeType": "Division",
                    "schema": [
                        {
                            "title": "a",
                            "type": "number",
                            "description": "数値A",
                            "isInput": True,
                        },
                        {
                            "title": "b",
                            "type": "number",
                            "description": "数値B",
                            "isInput": True,
                        },
                        {
                            "title": "result",
                            "type": "number",
                            "description": "A ÷ Bの結果",
                            "isOutput": True,
                        },
                    ],
                },
            ),
            # 結果表示ノード
            FlowNode(
                id="result-display",
                project=project,
                position_x=600,
                position_y=200,
                node_type="outputNode",
                data={
                    "label": "計算結果表示",
                    "nodeType": "ResultDisplay",
                    "results": {
                        "addition": 16,
                        "subtraction": 8,
                        "multiplication": 48,
                        "division": 3,
                    },
                    "schema": [
                        {
                            "title": "add_result",
                            "type": "number",
                            "description": "加算結果",
                            "isInput": True,
                        },
                        {
                            "title": "sub_result",
                            "type": "number",
                            "description": "減算結果",
                            "isInput": True,
                        },
                        {
                            "title": "mul_result",
                            "type": "number",
                            "description": "乗算結果",
                            "isInput": True,
                        },
                        {
                            "title": "div_result",
                            "type": "number",
                            "description": "除算結果",
                            "isInput": True,
                        },
                    ],
                },
            ),
        ]

        FlowNode.objects.bulk_create(nodes)
        self.stdout.write(f"Created {len(nodes)} nodes")

        # エッジを作成
        edges = [
            # 入力から各演算ノードへの接続
            FlowEdge(
                id="input-a-to-add",
                project=project,
                source_node_id="input-a",
                target_node_id="addition",
                source_handle="value",
                target_handle="a",
            ),
            FlowEdge(
                id="input-b-to-add",
                project=project,
                source_node_id="input-b",
                target_node_id="addition",
                source_handle="value",
                target_handle="b",
            ),
            FlowEdge(
                id="input-a-to-sub",
                project=project,
                source_node_id="input-a",
                target_node_id="subtraction",
                source_handle="value",
                target_handle="a",
            ),
            FlowEdge(
                id="input-b-to-sub",
                project=project,
                source_node_id="input-b",
                target_node_id="subtraction",
                source_handle="value",
                target_handle="b",
            ),
            FlowEdge(
                id="input-a-to-mul",
                project=project,
                source_node_id="input-a",
                target_node_id="multiplication",
                source_handle="value",
                target_handle="a",
            ),
            FlowEdge(
                id="input-b-to-mul",
                project=project,
                source_node_id="input-b",
                target_node_id="multiplication",
                source_handle="value",
                target_handle="b",
            ),
            FlowEdge(
                id="input-a-to-div",
                project=project,
                source_node_id="input-a",
                target_node_id="division",
                source_handle="value",
                target_handle="a",
            ),
            FlowEdge(
                id="input-b-to-div",
                project=project,
                source_node_id="input-b",
                target_node_id="division",
                source_handle="value",
                target_handle="b",
            ),
            # 各演算結果から結果表示ノードへの接続
            FlowEdge(
                id="add-to-result",
                project=project,
                source_node_id="addition",
                target_node_id="result-display",
                source_handle="result",
                target_handle="add_result",
            ),
            FlowEdge(
                id="sub-to-result",
                project=project,
                source_node_id="subtraction",
                target_node_id="result-display",
                source_handle="result",
                target_handle="sub_result",
            ),
            FlowEdge(
                id="mul-to-result",
                project=project,
                source_node_id="multiplication",
                target_node_id="result-display",
                source_handle="result",
                target_handle="mul_result",
            ),
            FlowEdge(
                id="div-to-result",
                project=project,
                source_node_id="division",
                target_node_id="result-display",
                source_handle="result",
                target_handle="div_result",
            ),
        ]

        FlowEdge.objects.bulk_create(edges)
        self.stdout.write(f"Created {len(edges)} edges")

        self.stdout.write(
            self.style.SUCCESS(
                f"Created arithmetic flow with:\n"
                f"  - 2 input nodes (数値A=12, 数値B=4)\n"
                f"  - 4 calculation nodes (加算, 減算, 乗算, 除算)\n"
                f"  - 1 result display node\n"
                f"  - 12 connecting edges"
            )
        )
