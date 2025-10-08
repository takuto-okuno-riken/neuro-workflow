import asyncio
import json
import logging
import os

from fastmcp import FastMCP, settings

# Configuration via environment variables
MCP_PROXY_PORT = int(os.environ.get("MCP_PROXY_PORT", 8001))

# ログ出力（省略可）
logging.basicConfig(level=logging.INFO)
# logging.info("Remote MCP settings: %s", settings.model_dump_json(indent=2))

# MCP設定ファイルをロード
with open("mcp_config.json", encoding="utf-8") as fp:
    mcp_config = json.load(fp)

# MCPプロキシ作成
mcp = FastMCP.as_proxy(mcp_config, name="MCP Proxy")


async def main():
    await mcp.run_async(transport="http", host="0.0.0.0", port=MCP_PROXY_PORT)


if __name__ == "__main__":
    asyncio.run(main())
