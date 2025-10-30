"""
Schema System for NeuroWorkflow - Minimal Implementation

This module provides the schema definitions for nodes, ports, and parameters.
"""

from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass, field
from .port import PortType


@dataclass
class ParameterDefinition:
    """Definition of a node parameter."""
    default_value: Any = None
    description: str = ""
    constraints: Optional[Dict[str, Any]] = None
    optimizable: bool = False
    optimization_range: Optional[List[float]] = None


@dataclass
class PortDefinition:
    """Definition of a node port."""
    type: PortType
    description: str = ""
    required: bool = False


@dataclass
class MethodDefinition:
    """Definition of a node method."""
    description: str = ""
    inputs: Optional[Dict[str, Any]] = None
    outputs: Optional[Dict[str, Any]] = None


@dataclass
class NodeDefinitionSchema:
    """Complete schema definition for a node."""
    type: str
    description: str = ""
    parameters: Dict[str, ParameterDefinition] = field(default_factory=dict)
    inputs: Dict[str, PortDefinition] = field(default_factory=dict)
    outputs: Dict[str, PortDefinition] = field(default_factory=dict)
    methods: Dict[str, MethodDefinition] = field(default_factory=dict)