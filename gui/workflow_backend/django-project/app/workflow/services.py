from typing import Dict, List, Any
from django.db import transaction
from .models import FlowProject, FlowNode, FlowEdge


class FlowService:
    """フロー管理のビジネスロジック"""

    @staticmethod
    def create_project(name: str, description: str, owner) -> FlowProject:
        """新しいフロープロジェクトを作成"""
        return FlowProject.objects.create(
            name=name, description=description, owner=owner
        )

    @staticmethod
    def save_flow_data(project_id: str, nodes_data: List[Dict], edges_data: List[Dict]):
        """React Flowのノードとエッジデータを保存"""
        with transaction.atomic():
            project = FlowProject.objects.get(id=project_id)

            # 既存のノードとエッジを削除
            FlowNode.objects.filter(project=project).delete()
            FlowEdge.objects.filter(project=project).delete()

            # ノードを保存
            nodes = []
            for node_data in nodes_data:
                node = FlowNode(
                    id=node_data["id"],
                    project=project,
                    position_x=node_data["position"]["x"],
                    position_y=node_data["position"]["y"],
                    node_type=node_data.get("type", "default"),
                    data=node_data.get("data", {}),
                )
                nodes.append(node)

            FlowNode.objects.bulk_create(nodes)

            # エッジを保存
            edges = []
            for edge_data in edges_data:
                try:
                    source_node = FlowNode.objects.get(
                        id=edge_data["source"], project=project
                    )
                    target_node = FlowNode.objects.get(
                        id=edge_data["target"], project=project
                    )

                    edge = FlowEdge(
                        id=edge_data["id"],
                        project=project,
                        source_node=source_node,
                        target_node=target_node,
                        source_handle=edge_data.get("sourceHandle"),
                        target_handle=edge_data.get("targetHandle"),
                        edge_data=edge_data.get("data", {}),
                    )
                    edges.append(edge)
                except FlowNode.DoesNotExist:
                    continue

            FlowEdge.objects.bulk_create(edges)

    @staticmethod
    def get_flow_data(project_id: str) -> Dict[str, List]:
        """プロジェクトのフローデータを取得"""
        project = FlowProject.objects.get(id=project_id)

        # ノードデータを構築
        nodes = []
        for node in project.nodes.all():
            node_data = {
                "id": node.id,
                "position": {"x": node.position_x, "y": node.position_y},
                "type": node.node_type,
                "data": node.data,
            }
            nodes.append(node_data)

        # エッジデータを構築
        edges = []
        for edge in project.edges.all():
            edge_data = {
                "id": edge.id,
                "source": edge.source_node_id,
                "target": edge.target_node_id,
            }

            if edge.source_handle:
                edge_data["sourceHandle"] = edge.source_handle
            if edge.target_handle:
                edge_data["targetHandle"] = edge.target_handle
            if edge.edge_data:
                edge_data["data"] = edge.edge_data

            edges.append(edge_data)

        return {"nodes": nodes, "edges": edges}

    @staticmethod
    def create_node(project_id: str, node_data: Dict) -> FlowNode:
        """個別ノード作成"""
        project = FlowProject.objects.get(id=project_id)

        node = FlowNode.objects.create(
            id=node_data["id"],
            project=project,
            position_x=node_data["position"]["x"],
            position_y=node_data["position"]["y"],
            node_type=node_data.get("type", "default"),
            data=node_data.get("data", {}),
        )

        return node

    @staticmethod
    def update_node(node_id: str, project_id: str, node_data: Dict) -> FlowNode:
        """ノード更新"""
        project = FlowProject.objects.get(id=project_id)
        node = FlowNode.objects.get(id=node_id, project=project)

        node.position_x = node_data["position"]["x"]
        node.position_y = node_data["position"]["y"]
        node.node_type = node_data.get("type", node.node_type)
        node.data = node_data.get("data", node.data)
        node.save()

        return node

    @staticmethod
    def delete_node(node_id: str, project_id: str):
        """ノード削除（関連エッジも自動削除される）"""
        project = FlowProject.objects.get(id=project_id)
        node = FlowNode.objects.get(id=node_id, project=project)
        node.delete()

    @staticmethod
    def create_edge(project_id: str, edge_data: Dict) -> FlowEdge:
        """個別エッジ作成"""
        project = FlowProject.objects.get(id=project_id)
        source_node = FlowNode.objects.get(id=edge_data["source"], project=project)
        target_node = FlowNode.objects.get(id=edge_data["target"], project=project)

        edge = FlowEdge.objects.create(
            id=edge_data["id"],
            project=project,
            source_node=source_node,
            target_node=target_node,
            source_handle=edge_data.get("sourceHandle"),
            target_handle=edge_data.get("targetHandle"),
            edge_data=edge_data.get("data", {}),
        )

        return edge

    @staticmethod
    def delete_edge(edge_id: str, project_id: str):
        """エッジ削除"""
        project = FlowProject.objects.get(id=project_id)
        edge = FlowEdge.objects.get(id=edge_id, project=project)
        edge.delete()

    @staticmethod
    def get_sample_flow_data() -> Dict:
        """四則演算のサンプルフローデータを返す"""
        return {
            "nodes": [
                {
                    "id": "input-a",
                    "position": {"x": 50, "y": 100},
                    "type": "calculationNode",
                    "data": {
                        "label": "Number A",
                        "schema": [
                            {
                                "title": "value",
                                "type": "number",
                                "description": "Input number A",
                            }
                        ],
                    },
                },
                {
                    "id": "input-b",
                    "position": {"x": 50, "y": 300},
                    "type": "calculationNode",
                    "data": {
                        "label": "Number B",
                        "schema": [
                            {
                                "title": "value",
                                "type": "number",
                                "description": "Input number B",
                            }
                        ],
                    },
                },
                {
                    "id": "addition",
                    "position": {"x": 300, "y": 50},
                    "type": "calculationNode",
                    "data": {
                        "label": "Addition (A + B)",
                        "schema": [
                            {"title": "a", "type": "number", "description": "Number A"},
                            {"title": "b", "type": "number", "description": "Number B"},
                            {
                                "title": "result",
                                "type": "number",
                                "description": "A + B result",
                            },
                        ],
                    },
                },
                {
                    "id": "subtraction",
                    "position": {"x": 300, "y": 150},
                    "type": "calculationNode",
                    "data": {
                        "label": "Subtraction (A - B)",
                        "schema": [
                            {"title": "a", "type": "number", "description": "Number A"},
                            {"title": "b", "type": "number", "description": "Number B"},
                            {
                                "title": "result",
                                "type": "number",
                                "description": "A - B result",
                            },
                        ],
                    },
                },
                {
                    "id": "multiplication",
                    "position": {"x": 300, "y": 250},
                    "type": "calculationNode",
                    "data": {
                        "label": "Multiplication (A × B)",
                        "schema": [
                            {"title": "a", "type": "number", "description": "Number A"},
                            {"title": "b", "type": "number", "description": "Number B"},
                            {
                                "title": "result",
                                "type": "number",
                                "description": "A × B result",
                            },
                        ],
                    },
                },
                {
                    "id": "division",
                    "position": {"x": 300, "y": 350},
                    "type": "calculationNode",
                    "data": {
                        "label": "Division (A ÷ B)",
                        "schema": [
                            {"title": "a", "type": "number", "description": "Number A"},
                            {"title": "b", "type": "number", "description": "Number B"},
                            {
                                "title": "result",
                                "type": "number",
                                "description": "A ÷ B result",
                            },
                        ],
                    },
                },
            ],
            "edges": [
                {
                    "id": "input-a-to-add",
                    "source": "input-a",
                    "target": "addition",
                    "sourceHandle": "value-output",
                    "targetHandle": "a-input",
                },
                {
                    "id": "input-b-to-add",
                    "source": "input-b",
                    "target": "addition",
                    "sourceHandle": "value-output",
                    "targetHandle": "b-input",
                },
                {
                    "id": "input-a-to-sub",
                    "source": "input-a",
                    "target": "subtraction",
                    "sourceHandle": "value-output",
                    "targetHandle": "a-input",
                },
                {
                    "id": "input-b-to-sub",
                    "source": "input-b",
                    "target": "subtraction",
                    "sourceHandle": "value-output",
                    "targetHandle": "b-input",
                },
                {
                    "id": "input-a-to-mul",
                    "source": "input-a",
                    "target": "multiplication",
                    "sourceHandle": "value-output",
                    "targetHandle": "a-input",
                },
                {
                    "id": "input-b-to-mul",
                    "source": "input-b",
                    "target": "multiplication",
                    "sourceHandle": "value-output",
                    "targetHandle": "b-input",
                },
                {
                    "id": "input-a-to-div",
                    "source": "input-a",
                    "target": "division",
                    "sourceHandle": "value-output",
                    "targetHandle": "a-input",
                },
                {
                    "id": "input-b-to-div",
                    "source": "input-b",
                    "target": "division",
                    "sourceHandle": "value-output",
                    "targetHandle": "b-input",
                },
            ],
        }
