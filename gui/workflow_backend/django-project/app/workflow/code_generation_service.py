# import re
# import os
# from pathlib import Path
# from django.conf import settings
# from .models import FlowProject, FlowNode, FlowEdge
# import logging

# logger = logging.getLogger(__name__)


# class CodeGenerationService:
#     """ワークフローからPythonコードを生成するサービス（修正版）"""

#     def __init__(self):
#         self.code_dir = Path(settings.BASE_DIR) / "workflow_codes"
#         self.code_dir.mkdir(exist_ok=True)

#     def get_code_file_path(self, project_id):
#         """プロジェクトIDからコードファイルパスを取得"""
#         return self.code_dir / f"{project_id}.py"

#     def add_node_code(self, project_id, node):
#         """ノード追加: インポート + コードブロック + WorkflowBuilder更新を一括処理"""
#         try:
#             logger.info(
#                 f"=== Starting add_node_code for node {node.id} in project {project_id} ==="
#             )

#             code_file = self.get_code_file_path(project_id)

#             if not code_file.exists():
#                 project = FlowProject.objects.get(id=project_id)
#                 existing_code = self._create_base_template(project)
#                 logger.info("Created new base template")
#             else:
#                 with open(code_file, "r", encoding="utf-8") as f:
#                     existing_code = f.read()
#                 logger.info("Loaded existing code file")

#             # 1. インポート文を追加
#             logger.info("Step 1: Adding imports")
#             updated_code = self._add_import_for_node(existing_code, node)

#             # 2. ノードのコードブロックを追加
#             logger.info("Step 2: Adding node code block")
#             new_code_block = self._generate_node_code_block(node)
#             logger.info(f"Generated code block: {new_code_block[:100]}...")
#             updated_code = self._insert_node_code_block(
#                 updated_code, new_code_block, node.id
#             )

#             # 3. WorkflowBuilderチェーンを更新
#             logger.info("Step 3: Updating WorkflowBuilder chain")
#             updated_code = self._update_workflow_chain(updated_code, project_id)

#             # ファイルに保存
#             with open(code_file, "w", encoding="utf-8") as f:
#                 f.write(updated_code)

#             logger.info(
#                 f"=== Successfully completed add_node_code for node {node.id} ==="
#             )
#             return True

#         except Exception as e:
#             logger.error(f"=== Error in add_node_code for node {node.id}: {e} ===")
#             return False

#     def remove_node_code(self, project_id, node_id):
#         """ノード削除: コードブロック削除 + インポート整理 + WorkflowBuilder更新を一括処理"""
#         try:
#             logger.info(
#                 f"=== Starting remove_node_code for node {node_id} in project {project_id} ==="
#             )

#             code_file = self.get_code_file_path(project_id)

#             if not code_file.exists():
#                 logger.info("Code file not found, returning success")
#                 return True

#             with open(code_file, "r", encoding="utf-8") as f:
#                 existing_code = f.read()

#             # 1. ノードのコードブロックを削除
#             logger.info("Step 1: Removing node code block")
#             updated_code = self._remove_node_code_block(existing_code, node_id)

#             # 2. 不要なインポート文を削除
#             logger.info("Step 2: Cleaning up unused imports")
#             updated_code = self._cleanup_unused_imports(updated_code, project_id)

#             # 3. WorkflowBuilderチェーンを更新
#             logger.info("Step 3: Updating WorkflowBuilder chain")
#             updated_code = self._update_workflow_chain(updated_code, project_id)

#             # ファイルに保存
#             with open(code_file, "w", encoding="utf-8") as f:
#                 f.write(updated_code)

#             logger.info(
#                 f"=== Successfully completed remove_node_code for node {node_id} ==="
#             )
#             return True

#         except Exception as e:
#             logger.error(f"=== Error in remove_node_code for node {node_id}: {e} ===")
#             return False

#     def update_workflow_builder(self, project_id):
#         """エッジ追加/削除時のWorkflowBuilderチェーンのみ更新"""
#         try:
#             code_file = self.get_code_file_path(project_id)

#             if not code_file.exists():
#                 return True

#             with open(code_file, "r", encoding="utf-8") as f:
#                 existing_code = f.read()

#             # WorkflowBuilderチェーンのみ更新
#             updated_code = self._update_workflow_chain(existing_code, project_id)

#             # ファイルに保存
#             with open(code_file, "w", encoding="utf-8") as f:
#                 f.write(updated_code)

#             logger.info(
#                 f"Successfully updated WorkflowBuilder for project {project_id}"
#             )
#             return True

#         except Exception as e:
#             logger.error(
#                 f"Error updating WorkflowBuilder for project {project_id}: {e}"
#             )
#             return False

#     def _create_base_template(self, project):
#         """基本テンプレートを作成（修正版）"""
#         return f'''#!/usr/bin/env python3
# """
# {project.description if project.description else f"Generated workflow for project: {project.name}"}
# """
# import sys
# import os
# # Add the src directory to the Python path to import the library
# sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))
# from neuroworkflow import WorkflowBuilder

# def main():
#     """Run a simple neural simulation workflow."""

#     workflow = (
#         WorkflowBuilder("neural_simulation")
#             .build()
#     )

#     # Print workflow information
#     print(workflow)

#     # Execute workflow
#     print("\\nExecuting workflow...")
#     success = workflow.execute()

#     if success:
#         print("Workflow execution completed successfully!")
#     else:
#         print("Workflow execution failed!")
#         return 1

#     return 0

# if __name__ == "__main__":
#     sys.exit(main())
# '''

#     def _add_import_for_node(self, existing_code, node):
#         """ノードの種類に応じてインポート文を追加（修正版）"""
#         label = node.data.get("label", "")

#         # 必要なインポート文を決定
#         imports_needed = []
#         if "BuildSonataNetworkNode" in label:
#             imports_needed.append(
#                 "from neuroworkflow.nodes.network import BuildSonataNetworkNode"
#             )
#         if "SimulateSonataNetworkNode" in label:
#             imports_needed.append(
#                 "from neuroworkflow.nodes.simulation import SimulateSonataNetworkNode"
#             )

#         if not imports_needed:
#             return existing_code

#         lines = existing_code.split("\n")
#         updated_lines = []

#         # WorkflowBuilderインポートの位置を特定
#         workflow_builder_index = -1
#         for i, line in enumerate(lines):
#             if "from neuroworkflow import WorkflowBuilder" in line:
#                 workflow_builder_index = i
#                 break

#         if workflow_builder_index == -1:
#             logger.warning("WorkflowBuilder import not found")
#             return existing_code

#         # インポートを挿入
#         for i, line in enumerate(lines):
#             updated_lines.append(line)

#             # WorkflowBuilderインポートの直後に追加
#             if i == workflow_builder_index:
#                 for import_line in imports_needed:
#                     # 既に存在しない場合のみ追加
#                     if import_line not in existing_code:
#                         updated_lines.append(import_line)
#                         logger.info(f"Added import: {import_line}")

#         return "\n".join(updated_lines)

#     def _cleanup_unused_imports(self, existing_code, project_id):
#         """使用されなくなったインポート文を削除（修正版）"""
#         try:
#             project = FlowProject.objects.get(id=project_id)
#             nodes = FlowNode.objects.filter(project=project)

#             # 現在必要なインポートを確認
#             needed_imports = set()
#             for node in nodes:
#                 label = node.data.get("label", "")
#                 if "BuildSonataNetworkNode" in str(label):
#                     needed_imports.add("BuildSonataNetworkNode")
#                 if "SimulateSonataNetworkNode" in str(label):
#                     needed_imports.add("SimulateSonataNetworkNode")

#             logger.info(f"Needed imports: {needed_imports}")

#             lines = existing_code.split("\n")
#             updated_lines = []

#             for line in lines:
#                 should_keep = True

#                 # 各インポート文をチェック
#                 if (
#                     "from neuroworkflow.nodes.network import BuildSonataNetworkNode"
#                     in line
#                 ):
#                     if "BuildSonataNetworkNode" not in needed_imports:
#                         should_keep = False
#                         logger.info("Removing unused BuildSonataNetworkNode import")
#                 elif (
#                     "from neuroworkflow.nodes.simulation import SimulateSonataNetworkNode"
#                     in line
#                 ):
#                     if "SimulateSonataNetworkNode" not in needed_imports:
#                         should_keep = False
#                         logger.info("Removing unused SimulateSonataNetworkNode import")

#                 if should_keep:
#                     updated_lines.append(line)

#             return "\n".join(updated_lines)

#         except Exception as e:
#             logger.error(f"Error cleaning imports: {e}")
#             return existing_code

#     def _generate_node_code_block(self, node):
#         """ノードのコードブロックを生成"""
#         label = node.data.get("label", "")
#         node_id = node.id

#         if "BuildSonataNetworkNode" in label:
#             var_name = self._sanitize_variable_name(node_id, "build_network")
#             return f"""    {var_name} = BuildSonataNetworkNode("SonataNetworkBuilder")
#     {var_name}.configure(
#         sonata_path="../data/300_pointneurons",
#         net_config_file="circuit_config.json",
#         sim_config_file="simulation_config.json",
#         hdf5_hyperslab_size=1024
#     )"""
#         elif "SimulateSonataNetworkNode" in label:
#             var_name = self._sanitize_variable_name(node_id, "simulate_network")
#             return f"""    {var_name} = SimulateSonataNetworkNode("SonataNetworkSimulation")
#     {var_name}.configure(
#         simulation_time=1000.0,
#         record_from_population="internal",
#         record_n_neurons=40
#     )"""
#         else:
#             var_name = self._sanitize_variable_name(node_id, "node")
#             return f"""    # Node: {label} (ID: {node_id})
#     {var_name} = None  # TODO: Add implementation for {label}"""

#     def _sanitize_variable_name(self, node_id, prefix):
#         """ノードIDを有効な変数名に変換"""
#         sanitized = re.sub(r"[^a-zA-Z0-9_]", "_", str(node_id))
#         if sanitized and sanitized[0].isdigit():
#             sanitized = f"{prefix}_{sanitized}"
#         elif not sanitized:
#             sanitized = prefix
#         return sanitized

#     def _insert_node_code_block(self, existing_code, new_code_block, node_id):
#         """main関数内にノードのコードブロックを挿入（修正版）"""
#         # 既存の同じノードのコードブロックを削除
#         code_without_existing = self._remove_node_code_block(existing_code, node_id)

#         lines = code_without_existing.split("\n")
#         updated_lines = []
#         inserted = False

#         for i, line in enumerate(lines):
#             # workflow = ( の行を探す
#             if "workflow = (" in line and not inserted:
#                 # workflow = ( の前に新しいコードブロックを追加
#                 # 前に空行があれば保持
#                 if i > 0 and updated_lines and updated_lines[-1].strip() == "":
#                     pass  # 空行を保持
#                 else:
#                     # 空行を追加
#                     updated_lines.append("")

#                 # 新しいコードブロックを追加
#                 updated_lines.append(new_code_block)
#                 updated_lines.append("")  # 空行を追加
#                 inserted = True

#             updated_lines.append(line)

#         return "\n".join(updated_lines)

#     def _remove_node_code_block(self, existing_code, node_id):
#         """特定のノードのコードブロックを削除（修正版）"""
#         lines = existing_code.split("\n")
#         updated_lines = []

#         # 削除対象の変数名パターンを生成
#         possible_var_names = []
#         for prefix in ["build_network", "simulate_network", "node"]:
#             var_name = self._sanitize_variable_name(node_id, prefix)
#             possible_var_names.append(var_name)

#         logger.info(
#             f"Removing code block for node {node_id}, possible variables: {possible_var_names}"
#         )

#         i = 0
#         while i < len(lines):
#             line = lines[i]
#             should_skip = False

#             # 削除対象のコードブロックを検出
#             for var_name in possible_var_names:
#                 if f"    {var_name} = " in line:
#                     should_skip = True
#                     logger.info(f"Found code block to remove: {var_name}")
#                     break

#             if should_skip:
#                 # このノードのコードブロック全体をスキップ
#                 logger.info(f"Skipping line: {line.strip()}")
#                 i += 1

#                 # configure()メソッドの呼び出しも含めて、このノードの全行をスキップ
#                 while i < len(lines):
#                     current_line = lines[i]
#                     logger.info(
#                         f"Checking line for continuation: {current_line.strip()}"
#                     )

#                     # 次のノードまたはworkflow定義の開始を検出
#                     if (
#                         # 次のノードの開始
#                         (
#                             current_line.strip().startswith("    ")
#                             and any(
#                                 f"    {var} = " in current_line
#                                 for var in ["build_network", "simulate_network", "node"]
#                             )
#                             and not any(
#                                 f"    {var} = " in current_line
#                                 for var in possible_var_names
#                             )
#                         )
#                         # workflow定義の開始
#                         or "workflow = (" in current_line
#                         # 関数定義
#                         or current_line.strip().startswith("def ")
#                         # コメント行（次のセクション）
#                         or current_line.strip().startswith("# Print workflow")
#                         or current_line.strip().startswith("print(")
#                         # ファイル終端
#                         or current_line.strip().startswith("if __name__")
#                         # 空行の後の非インデント行
#                         or (
#                             current_line.strip() == ""
#                             and i + 1 < len(lines)
#                             and not lines[i + 1].startswith("    ")
#                         )
#                     ):
#                         logger.info(
#                             f"Found end of code block at: {current_line.strip()}"
#                         )
#                         break

#                     logger.info(f"Skipping continuation line: {current_line.strip()}")
#                     i += 1

#                 # 後続の空行を削除（最大2行まで）
#                 empty_lines_removed = 0
#                 while (
#                     i < len(lines)
#                     and lines[i].strip() == ""
#                     and empty_lines_removed < 2
#                 ):
#                     logger.info("Removing trailing empty line")
#                     i += 1
#                     empty_lines_removed += 1

#                 continue

#             updated_lines.append(line)
#             i += 1

#         return "\n".join(updated_lines)

#     def _update_workflow_chain(self, existing_code, project_id):
#         """WorkflowBuilderチェーンを更新（修正版）"""
#         try:
#             project = FlowProject.objects.get(id=project_id)
#             nodes = FlowNode.objects.filter(project=project)
#             edges = FlowEdge.objects.filter(project=project)

#             logger.info(
#                 f"Updating workflow chain for project {project_id}: {nodes.count()} nodes, {edges.count()} edges"
#             )

#             # 新しいWorkflowBuilderチェーンを構築
#             new_workflow_lines = self._build_workflow_chain_lines(nodes, edges)

#             # 既存コードのWorkflowBuilder部分を置換
#             updated_code = self._replace_workflow_builder_section(
#                 existing_code, new_workflow_lines
#             )

#             logger.info("Updated workflow chain successfully")
#             return updated_code

#         except Exception as e:
#             logger.error(f"Error updating workflow chain: {e}")
#             return existing_code

#     def _build_workflow_chain_lines(self, nodes, edges):
#         """WorkflowBuilderチェーンの行を構築（修正版）"""
#         chain_lines = []

#         # WorkflowBuilderの開始
#         chain_lines.append('        WorkflowBuilder("neural_simulation")')

#         # 存在するノードのみを追加
#         for node in nodes:
#             var_name = self._get_node_variable_name(node)
#             chain_lines.append(f"            .add_node({var_name})")
#             logger.info(f"Added node to chain: {var_name}")

#         # エッジを追加
#         for edge in edges:
#             # エッジの両端のノードが存在することを確認
#             try:
#                 source_node = FlowNode.objects.get(id=edge.source)
#                 target_node = FlowNode.objects.get(id=edge.target)

#                 source_name = self._get_node_builder_name(edge.source)
#                 target_name = self._get_node_builder_name(edge.target)

#                 # SonataNetwork特有の接続
#                 if (
#                     source_name == "SonataNetworkBuilder"
#                     and target_name == "SonataNetworkSimulation"
#                 ):
#                     chain_lines.append(
#                         f'            .connect("{source_name}", "sonata_net", "{target_name}", "sonata_net")'
#                     )
#                     chain_lines.append(
#                         f'            .connect("{source_name}", "node_collections", "{target_name}", "node_collections")'
#                     )
#                     logger.info(
#                         f"Added SonataNetwork connections between {source_name} and {target_name}"
#                     )
#                 else:
#                     # 一般的な接続
#                     source_output = (
#                         edge.source_handle if edge.source_handle else "default_output"
#                     )
#                     target_input = (
#                         edge.target_handle if edge.target_handle else "default_input"
#                     )
#                     chain_lines.append(
#                         f'            .connect("{source_name}", "{source_output}", "{target_name}", "{target_input}")'
#                     )
#                     logger.info(
#                         f"Added general connection: {source_name} -> {target_name}"
#                     )

#             except FlowNode.DoesNotExist:
#                 logger.warning(
#                     f"Skipping edge with missing nodes: {edge.source} -> {edge.target}"
#                 )
#                 continue

#         # 最後に.build()を追加
#         chain_lines.append("            .build()")

#         return chain_lines

#     def _replace_workflow_builder_section(self, existing_code, new_workflow_lines):
#         """既存コードのWorkflowBuilder部分を新しいチェーンで置換（修正版）"""
#         lines = existing_code.split("\n")
#         updated_lines = []

#         i = 0
#         while i < len(lines):
#             line = lines[i]

#             # "workflow = (" を見つける
#             if "workflow = (" in line:
#                 logger.info(f"Found workflow builder start at line {i}")

#                 # 新しいworkflow定義を追加
#                 updated_lines.append("    workflow = (")
#                 updated_lines.extend(new_workflow_lines)
#                 updated_lines.append("    )")

#                 # 既存のworkflow定義をスキップ
#                 i += 1
#                 paren_count = 1

#                 while i < len(lines) and paren_count > 0:
#                     current_line = lines[i]
#                     paren_count += current_line.count("(") - current_line.count(")")
#                     i += 1

#                     if paren_count <= 0:
#                         logger.info(f"Found workflow builder end at line {i-1}")
#                         break

#                 continue

#             updated_lines.append(line)
#             i += 1

#         return "\n".join(updated_lines)

#     def _get_node_variable_name(self, node):
#         """ノードから変数名を取得"""
#         label = node.data.get("label", "")
#         if "BuildSonataNetworkNode" in label:
#             return self._sanitize_variable_name(node.id, "build_network")
#         elif "SimulateSonataNetworkNode" in label:
#             return self._sanitize_variable_name(node.id, "simulate_network")
#         else:
#             return self._sanitize_variable_name(node.id, "node")

#     def _get_node_builder_name(self, node_id):
#         """ノードIDからBuilderでの名前を取得"""
#         try:
#             node = FlowNode.objects.get(id=node_id)
#             label = node.data.get("label", "")
#             if "BuildSonataNetworkNode" in label:
#                 return "SonataNetworkBuilder"
#             elif "SimulateSonataNetworkNode" in label:
#                 return "SonataNetworkSimulation"
#             else:
#                 return f"Node_{node_id}"
#         except FlowNode.DoesNotExist:
#             return f"Node_{node_id}"

import re
import os
from pathlib import Path
from django.conf import settings
from .models import FlowProject, FlowNode, FlowEdge
import logging
import traceback

logger = logging.getLogger(__name__)


class CodeGenerationService:
    """ワークフローからPythonコードを生成するサービス（修正版）"""

    def __init__(self):
        self.code_dir = Path(settings.BASE_DIR) / "workflow_codes"
        self.code_dir.mkdir(exist_ok=True)

        # 正規表現パターンを事前定義
        self._compile_patterns()

    def _compile_patterns(self):
        """使用する正規表現パターンをコンパイル"""
        self.patterns = {
            # WorkflowBuilder全体を検出（インデントを考慮した閉じ括弧まで）
            "workflow_section": re.compile(
                r"(\s*)workflow\s*=\s*\(.*?\n\1\)", re.DOTALL | re.MULTILINE
            ),
            # ノード定義を検出（configure呼び出しも含む）
            "node_definition": re.compile(
                r"^(\s*)({var_name})\s*=\s*\w+Node\([^)]*\)(?:\s*\n\s*\2\.configure\([^)]*\))?",
                re.MULTILINE | re.DOTALL,
            ),
            # インポート文を検出
            "import_statement": re.compile(
                r"^from\s+neuroworkflow\.nodes\.\w+\s+import\s+(\w+)$", re.MULTILINE
            ),
            # WorkflowBuilderインポートを検出
            "workflow_builder_import": re.compile(
                r"^(from\s+neuroworkflow\s+import\s+WorkflowBuilder)$", re.MULTILINE
            ),
            # クラス使用を検出
            "class_usage": {
                "BuildSonataNetworkNode": re.compile(r"BuildSonataNetworkNode\s*\("),
                "SimulateSonataNetworkNode": re.compile(
                    r"SimulateSonataNetworkNode\s*\("
                ),
            },
        }

    def get_code_file_path(self, project_id):
        """プロジェクトIDからコードファイルパスを取得"""
        return self.code_dir / f"{project_id}.py"

    def add_node_code(self, project_id, node):
        """ノード追加: インポート + コードブロック + WorkflowBuilder更新を一括処理"""
        try:
            logger.info(
                f"=== Starting add_node_code for node {node.id} in project {project_id} ==="
            )
            logger.info(f"Node label: {node.data.get('label', 'Unknown')}")

            code_file = self.get_code_file_path(project_id)

            # 既存コードの読み込みまたは新規作成
            if not code_file.exists():
                project = FlowProject.objects.get(id=project_id)
                existing_code = self._create_base_template(project)
                logger.info("Created new base template")
            else:
                with open(code_file, "r", encoding="utf-8") as f:
                    existing_code = f.read()
                logger.info("Loaded existing code file")

            # 1. インポート文を追加
            logger.info("Step 1: Adding imports")
            updated_code, import_success = self._add_import_for_node(
                existing_code, node
            )
            if not import_success:
                logger.warning(f"Failed to add imports for node {node.id}")

            # 2. ノードのコードブロックを追加
            logger.info("Step 2: Adding node code block")
            new_code_block = self._generate_node_code_block(node)
            logger.info(f"Generated code block:\n{new_code_block}")

            updated_code, insert_success = self._insert_node_code_block(
                updated_code, new_code_block, node.id
            )
            if not insert_success:
                logger.error(f"Failed to insert code block for node {node.id}")
                return False

            # 3. WorkflowBuilderチェーンを更新（これが重要！）
            logger.info("Step 3: Updating WorkflowBuilder chain")
            updated_code, chain_success = self._update_workflow_chain(
                updated_code, project_id
            )
            if not chain_success:
                logger.error(f"Failed to update workflow chain for node {node.id}")
                # それでも保存はする

            # デバッグ用：更新後のworkflow部分を表示
            workflow_match = self.patterns["workflow_section"].search(updated_code)
            if workflow_match:
                logger.info(f"Updated workflow section:\n{workflow_match.group(0)}")

            # ファイルに保存
            with open(code_file, "w", encoding="utf-8") as f:
                f.write(updated_code)

            logger.info(
                f"=== Successfully completed add_node_code for node {node.id} ==="
            )
            return True

        except Exception as e:
            logger.error(
                f"=== Critical error in add_node_code for node {node.id}: {e} ==="
            )
            logger.error(traceback.format_exc())
            return False

    def remove_node_code(self, project_id, node_id):
        """ノード削除: コードブロック削除 + インポート整理 + WorkflowBuilder更新を一括処理"""
        try:
            logger.info(
                f"=== Starting remove_node_code for node {node_id} in project {project_id} ==="
            )

            code_file = self.get_code_file_path(project_id)

            if not code_file.exists():
                logger.info("Code file not found, returning success")
                return True

            with open(code_file, "r", encoding="utf-8") as f:
                existing_code = f.read()

            # 1. ノードのコードブロックを削除（修正版）
            logger.info("Step 1: Removing node code block")
            updated_code, remove_success = self._remove_node_code_block(
                existing_code, node_id
            )
            if not remove_success:
                logger.warning(
                    f"Node code block not found for {node_id}, continuing..."
                )

            # 2. 不要なインポート文を削除
            logger.info("Step 2: Cleaning up unused imports")
            updated_code, cleanup_success = self._cleanup_unused_imports(
                updated_code, project_id
            )
            if not cleanup_success:
                logger.warning("Import cleanup had issues, continuing...")

            # 3. WorkflowBuilderチェーンを更新（これが重要！）
            logger.info("Step 3: Updating WorkflowBuilder chain")
            updated_code, chain_success = self._update_workflow_chain(
                updated_code, project_id
            )
            if not chain_success:
                logger.error(
                    f"Failed to update workflow chain after removing node {node_id}"
                )

            # デバッグ用：更新後のworkflow部分を表示
            workflow_match = self.patterns["workflow_section"].search(updated_code)
            if workflow_match:
                logger.info(
                    f"Updated workflow section after removal:\n{workflow_match.group(0)}"
                )

            # ファイルに保存
            with open(code_file, "w", encoding="utf-8") as f:
                f.write(updated_code)

            logger.info(
                f"=== Successfully completed remove_node_code for node {node_id} ==="
            )
            return True

        except Exception as e:
            logger.error(
                f"=== Critical error in remove_node_code for node {node_id}: {e} ==="
            )
            logger.error(traceback.format_exc())
            return False

    def update_workflow_builder(self, project_id):
        """エッジ追加/削除時のWorkflowBuilderチェーンのみ更新"""
        try:
            logger.info(f"=== Updating workflow builder for project {project_id} ===")

            code_file = self.get_code_file_path(project_id)

            if not code_file.exists():
                logger.warning(f"Code file does not exist for project {project_id}")
                return True

            with open(code_file, "r", encoding="utf-8") as f:
                existing_code = f.read()

            # WorkflowBuilderチェーンのみ更新
            updated_code, success = self._update_workflow_chain(
                existing_code, project_id
            )

            if not success:
                logger.error(
                    f"Failed to update WorkflowBuilder for project {project_id}"
                )
                return False

            # デバッグ用：更新後のworkflow部分を表示
            workflow_match = self.patterns["workflow_section"].search(updated_code)
            if workflow_match:
                logger.info(
                    f"Updated workflow section after edge change:\n{workflow_match.group(0)}"
                )

            # ファイルに保存
            with open(code_file, "w", encoding="utf-8") as f:
                f.write(updated_code)

            logger.info(
                f"Successfully updated WorkflowBuilder for project {project_id}"
            )
            return True

        except Exception as e:
            logger.error(
                f"Critical error updating WorkflowBuilder for project {project_id}: {e}"
            )
            logger.error(traceback.format_exc())
            return False

    def _create_base_template(self, project):
        """基本テンプレートを作成"""
        return f'''#!/usr/bin/env python3
"""
{project.description if project.description else f"Generated workflow for project: {project.name}"}
"""
import sys
import os
# Add the src directory to the Python path to import the library
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))
from neuroworkflow import WorkflowBuilder

def main():
    """Run a simple neural simulation workflow."""

    workflow = (
        WorkflowBuilder("neural_simulation")
            .build()
    )

    # Print workflow information
    print(workflow)
   
    # Execute workflow
    print("\\nExecuting workflow...")
    success = workflow.execute()
   
    if success:
        print("Workflow execution completed successfully!")
    else:
        print("Workflow execution failed!")
        return 1
       
    return 0

if __name__ == "__main__":
    sys.exit(main())
'''

    def _add_import_for_node(self, existing_code, node):
        """ノードの種類に応じてインポート文を追加（正規表現版）"""
        try:
            label = node.data.get("label", "")
            logger.info(f"Adding imports for node with label: {label}")

            # 必要なインポート文を決定
            imports_needed = []
            if "BuildSonataNetworkNode" in str(label):
                imports_needed.append(
                    "from neuroworkflow.nodes.network import BuildSonataNetworkNode"
                )
            if "SimulateSonataNetworkNode" in str(label):
                imports_needed.append(
                    "from neuroworkflow.nodes.simulation import SimulateSonataNetworkNode"
                )

            if not imports_needed:
                logger.info("No imports needed for this node")
                return existing_code, True

            # WorkflowBuilderインポートの位置を検出
            match = self.patterns["workflow_builder_import"].search(existing_code)
            if not match:
                logger.error("WorkflowBuilder import not found!")
                return existing_code, False

            # 各インポートを追加
            for import_line in imports_needed:
                # 既に存在しない場合のみ追加
                if import_line not in existing_code:
                    # WorkflowBuilderインポートの直後に追加
                    existing_code = existing_code.replace(
                        match.group(0), f"{match.group(0)}\n{import_line}"
                    )
                    logger.info(f"Added import: {import_line}")
                else:
                    logger.info(f"Import already exists: {import_line}")

            return existing_code, True

        except Exception as e:
            logger.error(f"Error adding imports: {e}")
            return existing_code, False

    def _cleanup_unused_imports(self, existing_code, project_id):
        """使用されなくなったインポート文を削除（正規表現版）"""
        try:
            # 使用されているクラスを検出
            used_classes = set()

            for class_name, pattern in self.patterns["class_usage"].items():
                if pattern.search(existing_code):
                    used_classes.add(class_name)
                    logger.info(f"Class {class_name} is still in use")

            # インポート文を処理
            lines = existing_code.split("\n")
            updated_lines = []
            removed_imports = []

            for line in lines:
                should_keep = True

                # インポート文をチェック
                if "from neuroworkflow.nodes" in line:
                    match = self.patterns["import_statement"].match(line)
                    if match:
                        class_name = match.group(1)
                        if class_name not in used_classes:
                            should_keep = False
                            removed_imports.append(class_name)
                            logger.info(f"Removing unused import: {class_name}")

                if should_keep:
                    updated_lines.append(line)

            if removed_imports:
                logger.info(f"Removed imports for: {removed_imports}")
            else:
                logger.info("No unused imports to remove")

            return "\n".join(updated_lines), True

        except Exception as e:
            logger.error(f"Error cleaning imports: {e}")
            return existing_code, False

    def _generate_node_code_block(self, node):
        """ノードのコードブロックを生成"""
        label = node.data.get("label", "")
        node_id = node.id

        if "BuildSonataNetworkNode" in str(label):
            var_name = self._sanitize_variable_name(node_id, "build_network")
            return f"""    {var_name} = BuildSonataNetworkNode("SonataNetworkBuilder")
    {var_name}.configure(
        sonata_path="../data/300_pointneurons",
        net_config_file="circuit_config.json",
        sim_config_file="simulation_config.json",
        hdf5_hyperslab_size=1024
    )"""
        elif "SimulateSonataNetworkNode" in str(label):
            var_name = self._sanitize_variable_name(node_id, "simulate_network")
            return f"""    {var_name} = SimulateSonataNetworkNode("SonataNetworkSimulation")
    {var_name}.configure(
        simulation_time=1000.0,
        record_from_population="internal",
        record_n_neurons=40
    )"""
        else:
            var_name = self._sanitize_variable_name(node_id, "node")
            return f"""    # Node: {label} (ID: {node_id})
    {var_name} = None  # TODO: Add implementation for {label}"""

    def _sanitize_variable_name(self, node_id, prefix):
        """ノードIDを有効な変数名に変換"""
        sanitized = re.sub(r"[^a-zA-Z0-9_]", "_", str(node_id))
        if sanitized and sanitized[0].isdigit():
            sanitized = f"{prefix}_{sanitized}"
        elif not sanitized:
            sanitized = prefix
        return sanitized

    def _insert_node_code_block(self, existing_code, new_code_block, node_id):
        """main関数内にノードのコードブロックを挿入（正規表現版）"""
        try:
            # 既存の同じノードのコードブロックを削除
            code_without_existing, _ = self._remove_node_code_block(
                existing_code, node_id
            )

            # workflow = ( の位置を検出
            workflow_pattern = re.compile(r"^(\s*)workflow\s*=\s*\($", re.MULTILINE)
            match = workflow_pattern.search(code_without_existing)

            if not match:
                logger.error("Could not find 'workflow = (' pattern")
                return code_without_existing, False

            # workflow定義の前に新しいコードブロックを挿入
            insertion_point = match.start()

            # 適切な改行を追加
            before_workflow = code_without_existing[:insertion_point].rstrip()
            after_workflow = code_without_existing[insertion_point:]

            # 新しいコードを挿入
            updated_code = f"{before_workflow}\n\n{new_code_block}\n\n{after_workflow}"

            logger.info(f"Successfully inserted code block for node {node_id}")
            return updated_code, True

        except Exception as e:
            logger.error(f"Error inserting node code block: {e}")
            return existing_code, False

    def _remove_node_code_block(self, existing_code, node_id):
        """特定のノードのコードブロックを削除（修正版：configure呼び出しも含めて削除）"""
        try:
            # 削除対象の変数名パターンを生成
            possible_var_names = []
            for prefix in ["build_network", "simulate_network", "node"]:
                var_name = self._sanitize_variable_name(node_id, prefix)
                possible_var_names.append(var_name)

            logger.info(
                f"Attempting to remove code blocks for variables: {possible_var_names}"
            )

            found_any = False
            for var_name in possible_var_names:
                # ノード定義とconfigure呼び出しを一括で削除する正規表現
                # 変数定義から始まり、.configure()の閉じ括弧まで
                pattern = re.compile(
                    rf"^\s*{re.escape(var_name)}\s*=\s*[^(]+\([^)]*\)(?:\s*\n\s*{re.escape(var_name)}\.configure\([^)]*\))?",
                    re.MULTILINE | re.DOTALL,
                )

                matches = pattern.findall(existing_code)
                if matches:
                    for match in matches:
                        logger.info(f"Found and removing code block:\n{match}")
                    existing_code = pattern.sub("", existing_code)
                    found_any = True
                    logger.info(f"Removed code block for variable: {var_name}")

            # 余分な空行を削除（3行以上の連続空行を2行に）
            existing_code = re.sub(r"\n{3,}", "\n\n", existing_code)

            if not found_any:
                logger.warning(f"No code blocks found for node {node_id}")
                return existing_code, False

            return existing_code, True

        except Exception as e:
            logger.error(f"Error removing node code block: {e}")
            return existing_code, False

    def _update_workflow_chain(self, existing_code, project_id):
        """WorkflowBuilderチェーンを更新（完全置換版）"""
        try:
            project = FlowProject.objects.get(id=project_id)
            nodes = FlowNode.objects.filter(project=project)
            edges = FlowEdge.objects.filter(project=project)

            logger.info(
                f"Updating workflow chain: {nodes.count()} nodes, {edges.count()} edges"
            )

            # 新しいWorkflowBuilderチェーンを構築
            new_workflow_lines = self._build_workflow_chain_lines(nodes, edges)

            # 既存のWorkflowBuilder部分を検出
            # インデントレベルを考慮した正規表現
            match = self.patterns["workflow_section"].search(existing_code)

            if not match:
                # 別のパターンを試す（フォールバック）
                # workflow = ( から同じインデントレベルの ) まで
                fallback_pattern = re.compile(
                    r"(\s*)workflow\s*=\s*\(.*?\n\1\)", re.DOTALL
                )
                match = fallback_pattern.search(existing_code)

                if not match:
                    logger.error("Could not find existing workflow section!")
                    logger.error(f"First 500 chars of code:\n{existing_code[:500]}")
                    return existing_code, False

            # インデントを保持
            indent = match.group(1)

            # 新しいworkflow定義を構築（インデントを保持）
            new_workflow = f"{indent}workflow = (\n"
            for line in new_workflow_lines:
                new_workflow += f"{line}\n"
            new_workflow += f"{indent})"

            # マッチした部分全体を新しいworkflow定義で置換
            start_pos = match.start()
            end_pos = match.end()
            updated_code = (
                existing_code[:start_pos] + new_workflow + existing_code[end_pos:]
            )

            # 置換が成功したか確認
            if updated_code == existing_code:
                logger.error("Workflow section was not replaced!")
                return existing_code, False

            logger.info("Successfully updated workflow chain")
            logger.info(f"New workflow section:\n{new_workflow}")

            return updated_code, True

        except Exception as e:
            logger.error(f"Error updating workflow chain: {e}")
            logger.error(traceback.format_exc())
            return existing_code, False

    def _build_workflow_chain_lines(self, nodes, edges):
        """WorkflowBuilderチェーンの行を構築（修正版）"""
        chain_lines = []

        # WorkflowBuilderの開始
        chain_lines.append('        WorkflowBuilder("neural_simulation")')

        # 実際に存在するノードを追加
        existing_node_ids = set()
        for node in nodes:
            var_name = self._get_node_variable_name(node)
            chain_lines.append(f"            .add_node({var_name})")
            existing_node_ids.add(str(node.id))
            logger.info(f"Added node to chain: {var_name} (ID: {node.id})")

        # エッジを追加（両端のノードが存在する場合のみ）
        for edge in edges:
            # エッジの両端が実際に存在するノードか確認
            if (
                str(edge.source) not in existing_node_ids
                or str(edge.target) not in existing_node_ids
            ):
                logger.warning(
                    f"Skipping edge {edge.source} -> {edge.target}: node not found"
                )
                continue

            try:
                source_node = FlowNode.objects.get(id=edge.source)
                target_node = FlowNode.objects.get(id=edge.target)

                source_name = self._get_node_builder_name(edge.source)
                target_name = self._get_node_builder_name(edge.target)

                # ノードタイプによって接続方法を決定
                source_label = source_node.data.get("label", "")
                target_label = target_node.data.get("label", "")

                if "BuildSonataNetworkNode" in str(
                    source_label
                ) and "SimulateSonataNetworkNode" in str(target_label):
                    # SonataNetwork特有の接続
                    chain_lines.append(
                        f'            .connect("{source_name}", "sonata_net", "{target_name}", "sonata_net")'
                    )
                    chain_lines.append(
                        f'            .connect("{source_name}", "node_collections", "{target_name}", "node_collections")'
                    )
                    logger.info(
                        f"Added SonataNetwork connections: {source_name} -> {target_name}"
                    )
                else:
                    # 一般的な接続
                    source_output = (
                        edge.source_handle if edge.source_handle else "default_output"
                    )
                    target_input = (
                        edge.target_handle if edge.target_handle else "default_input"
                    )
                    chain_lines.append(
                        f'            .connect("{source_name}", "{source_output}", "{target_name}", "{target_input}")'
                    )
                    logger.info(
                        f"Added general connection: {source_name} -> {target_name}"
                    )

            except FlowNode.DoesNotExist:
                logger.warning(
                    f"Node not found for edge: {edge.source} -> {edge.target}"
                )
                continue
            except Exception as e:
                logger.error(f"Error processing edge {edge.id}: {e}")
                continue

        # 最後に.build()を追加
        chain_lines.append("            .build()")

        logger.info(f"Built workflow chain with {len(chain_lines)} lines")
        return chain_lines

    def _get_node_variable_name(self, node):
        """ノードから変数名を取得"""
        label = node.data.get("label", "")
        if "BuildSonataNetworkNode" in str(label):
            return self._sanitize_variable_name(node.id, "build_network")
        elif "SimulateSonataNetworkNode" in str(label):
            return self._sanitize_variable_name(node.id, "simulate_network")
        else:
            return self._sanitize_variable_name(node.id, "node")

    def _get_node_builder_name(self, node_id):
        """ノードIDからBuilderでの名前を取得"""
        try:
            node = FlowNode.objects.get(id=node_id)
            label = node.data.get("label", "")
            if "BuildSonataNetworkNode" in str(label):
                return "SonataNetworkBuilder"
            elif "SimulateSonataNetworkNode" in str(label):
                return "SonataNetworkSimulation"
            else:
                return f"Node_{node_id}"
        except FlowNode.DoesNotExist:
            logger.error(f"Node {node_id} not found in database")
            return f"Node_{node_id}"
        except Exception as e:
            logger.error(f"Error getting builder name for node {node_id}: {e}")
            return f"Node_{node_id}"
