"""
Base Node Class for NeuroWorkflow - Minimal Implementation

This module provides the base Node class that all NeuroWorkflow nodes inherit from.
"""

from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
from .port import Port, PortType
from .schema import NodeDefinitionSchema


class Node(ABC):
    """Base class for all NeuroWorkflow nodes."""
    
    # This should be defined by subclasses
    NODE_DEFINITION: NodeDefinitionSchema = None
    
    def __init__(self, name: str):
        """Initialize the node with a name."""
        self.name = name
        self._parameters: Dict[str, Any] = {}
        self._input_ports: Dict[str, Port] = {}
        self._output_ports: Dict[str, Port] = {}
        
        # Initialize ports from schema if available
        if self.NODE_DEFINITION:
            self._initialize_ports()
    
    def _initialize_ports(self):
        """Initialize input and output ports from the node definition."""
        # Initialize input ports
        for port_name, port_def in self.NODE_DEFINITION.inputs.items():
            self._input_ports[port_name] = Port(
                name=port_name,
                port_type=port_def.type,
                description=port_def.description
            )
        
        # Initialize output ports
        for port_name, port_def in self.NODE_DEFINITION.outputs.items():
            self._output_ports[port_name] = Port(
                name=port_name,
                port_type=port_def.type,
                description=port_def.description
            )
    
    def configure(self, **kwargs) -> None:
        """Configure the node with parameters."""
        # Validate parameters against schema if available
        if self.NODE_DEFINITION:
            for param_name, param_value in kwargs.items():
                if param_name in self.NODE_DEFINITION.parameters:
                    self._parameters[param_name] = param_value
                else:
                    print(f"Warning: Parameter '{param_name}' not defined in schema")
                    self._parameters[param_name] = param_value
        else:
            self._parameters.update(kwargs)
    
    def get_parameter(self, name: str, default: Any = None) -> Any:
        """Get a parameter value."""
        return self._parameters.get(name, default)
    
    def set_input(self, port_name: str, value: Any) -> None:
        """Set an input port value."""
        if port_name in self._input_ports:
            self._input_ports[port_name].set_value(value)
        else:
            print(f"Warning: Input port '{port_name}' not found")
    
    def get_output(self, port_name: str) -> Any:
        """Get an output port value."""
        if port_name in self._output_ports:
            return self._output_ports[port_name].get_value()
        return None
    
    def set_output(self, port_name: str, value: Any) -> None:
        """Set an output port value."""
        if port_name in self._output_ports:
            self._output_ports[port_name].set_value(value)
        else:
            print(f"Warning: Output port '{port_name}' not found")
    
    def get_info(self) -> Dict[str, Any]:
        """Get information about this node."""
        info = {
            'name': self.name,
            'type': self.__class__.__name__,
            'parameters': self._parameters.copy(),
            'input_ports': {name: port.description for name, port in self._input_ports.items()},
            'output_ports': {name: port.description for name, port in self._output_ports.items()}
        }
        
        if self.NODE_DEFINITION:
            info['schema'] = {
                'type': self.NODE_DEFINITION.type,
                'description': self.NODE_DEFINITION.description
            }
        
        return info
    
    @abstractmethod
    def execute(self) -> Dict[str, Any]:
        """Execute the node's main functionality."""
        pass
    
    def validate_parameters(self) -> bool:
        """Validate node parameters against schema."""
        if not self.NODE_DEFINITION:
            return True
        
        # Basic validation - can be extended
        for param_name, param_def in self.NODE_DEFINITION.parameters.items():
            if param_name not in self._parameters:
                if param_def.default_value is not None:
                    self._parameters[param_name] = param_def.default_value
                else:
                    print(f"Warning: Required parameter '{param_name}' not set")
                    return False
        
        return True