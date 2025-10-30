import logging
import os
from typing import Any

import httpx
from fastmcp import FastMCP

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Configuration via environment variables
DJANGO_API_URL = os.environ.get("DJANGO_API_URL", "http://localhost:8000/workflow")
DJANGO_API_TOKEN = os.environ.get("DJANGO_API_TOKEN")
USER_AGENT = os.environ.get("MCP_USER_AGENT", "workflow-mcp/1.0")


def _build_headers() -> dict[str, str]:
    headers = {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
    }
    if DJANGO_API_TOKEN:
        headers["Authorization"] = f"Bearer {DJANGO_API_TOKEN}"
    return headers


async def _make_get_request(url: str, timeout: float = 30.0) -> dict | None:
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(url, headers=_build_headers(), timeout=timeout)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.error(f"GET request failed for {url}: {e}")
            return None


async def _make_post_request(url: str, payload: dict, timeout: float = 60.0) -> dict | None:
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(url, headers=_build_headers(), json=payload, timeout=timeout)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.error(f"POST request failed for {url}: {e}")
            return None


async def _make_put_request(url: str, payload: dict, timeout: float = 30.0) -> dict | None:
    async with httpx.AsyncClient() as client:
        try:
            r = await client.put(url, headers=_build_headers(), json=payload, timeout=timeout)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.error(f"PUT request failed for {url}: {e}")
            return None


mcp = FastMCP("workflow")


# Handlers (tools) using the FastMCP decorator if available
# We define the functions regardless and then, if mcp exists, decorate them.

@mcp.tool()
async def list_projects() -> dict[str, Any]:
    """Return list of projects from Django backend."""
    url = f"{DJANGO_API_URL}/"
    data = await _make_get_request(url)
    if data is None:
        return {"status": "error", "error": "Failed to fetch projects"}
    return {"status": "success", "projects": data}


@mcp.tool()
async def get_flow(workflow_id: str) -> dict[str, Any]:
    """Get flow data for a given workflow_id."""
    url = f"{DJANGO_API_URL}/{workflow_id}/flow/"
    data = await _make_get_request(url)
    if data is None:
        return {"status": "error", "error": f"Failed to fetch flow for {workflow_id}"}
    return {"status": "success", "flow": data}


@mcp.tool()
async def generate_code_batch(workflow_id: str, nodes: list[Any], edges: list[Any]) -> dict[str, Any]:
    """Trigger batch code generation on the Django backend."""
    url = f"{DJANGO_API_URL}/{workflow_id}/generate-code/"
    payload = {"nodes": nodes, "edges": edges}
    data = await _make_post_request(url, payload)
    if data is None:
        return {"status": "error", "error": f"Failed to trigger code generation for {workflow_id}"}
    return {"status": "success", "result": data}

@mcp.tool()
async def update_node_parameter(workflow_id: str, node_id: str, parameter_key: str, parameter_value: Any, parameter_field: str = "value") -> dict[str, Any]:
    """Update a node parameter via Django API."""
    url = f"{DJANGO_API_URL}/{workflow_id}/nodes/{node_id}/parameters/"
    payload = {
        "parameter_key": parameter_key,
        "parameter_value": parameter_value,
        "parameter_field": parameter_field,
    }
    data = await _make_put_request(url, payload)
    if data is None:
        return {"status": "error", "error": f"Failed to update parameter {parameter_key} for node {node_id}"}
    return {"status": "success", "result": data}


@mcp.tool()
async def health() -> dict[str, Any]:
    """Health check of the Django backend (sample-flow endpoint)."""
    url = f"{DJANGO_API_URL}/sample-flow/"
    data = await _make_get_request(url, timeout=10.0)
    if data is None:
        return {"status": "error", "error": "Backend unreachable"}
    return {"status": "ok", "backend": "reachable"}


if __name__ == "__main__":
    # Run the FastMCP server using httpstream transport
    try:
        mcp.run(transport="stdio")
    except Exception:
        logger.exception("Failed to run FastMCP server")

