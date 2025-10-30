"""
Port System for NeuroWorkflow - Minimal Implementation

This module provides the port system for connecting nodes in workflows.
"""

from enum import Enum
from typing import Any, Optional
from dataclasses import dataclass


class PortType(Enum):
    """Types of ports for data flow between nodes."""
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    DICT = "dict"
    LIST = "list"
    OBJECT = "object"
    ANY = "any"


@dataclass
class Port:
    """Represents a port for data flow between nodes."""
    name: str
    port_type: PortType
    value: Optional[Any] = None
    description: str = ""
    
    def set_value(self, value: Any) -> None:
        """Set the value of this port."""
        self.value = value
    
    def get_value(self) -> Any:
        """Get the value of this port."""
        return self.value
    
    def clear(self) -> None:
        """Clear the value of this port."""
        self.value = None