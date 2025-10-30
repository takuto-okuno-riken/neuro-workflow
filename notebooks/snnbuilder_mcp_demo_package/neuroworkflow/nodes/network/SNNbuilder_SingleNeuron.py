"""
Single Neuron Builder Node for NeuroWorkflow - Demo Version

This is a simplified version of the SNNbuilder SingleNeuron node for MCP demonstration.
It creates single neurons with biological and NEST-specific parameters.

Author: NeuroWorkflow Team
Date: 2025
Version: 1.0-demo
"""

from typing import Dict, Any, List, Optional, Union
import json

# Core NeuroWorkflow imports
from neuroworkflow.core.node import Node
from neuroworkflow.core.schema import (
    NodeDefinitionSchema, 
    PortDefinition, 
    ParameterDefinition, 
    MethodDefinition
)
from neuroworkflow.core.port import PortType

# NEST import (optional - will handle if not available)
try:
    import nest
    NEST_AVAILABLE = True
except ImportError:
    NEST_AVAILABLE = False
    print("Warning: NEST not available. Node will work in script generation mode only.")


class SNNbuilder_SingleNeuron(Node):
    """
    Single Neuron Builder Node for Neural Model Construction - Demo Version.
    
    This node creates a single neuron with comprehensive biological and 
    computational parameters. It can operate in two modes:
    
    1. **Execution Mode**: Creates actual NEST neuron objects
    2. **Script Generation Mode**: Generates Python code for standalone execution
    
    Biological Parameters:
    - Name and identification (name, acronym)
    - Cell type classification (model_type, excitatory/inhibitory)
    - Signaling properties (neurotransmitter types, PSP amplitudes, rise times)
    - Morphological properties (dendrite extent and diameter)
    - Activity properties (firing rate ranges for different states)
    
    NEST Parameters:
    - Base NEST model selection
    - Custom parameter overrides
    - Model template naming
    
    Outputs:
    - NEST neuron object (for workflow execution)
    - Python script code (for standalone execution)
    - Neuron metadata and properties
    """
    
    NODE_DEFINITION = NodeDefinitionSchema(
        type='single_neuron_builder',
        description='Build a single neuron with biological and NEST parameters',
        
        parameters={
            # === BIOLOGICAL IDENTIFICATION ===
            'name': ParameterDefinition(
                default_value='Neuron_1',
                description='Descriptive name for the neuron'
            ),
            
            'acronym': ParameterDefinition(
                default_value='N1',
                description='Short acronym or identifier for the neuron'
            ),
            
            'model_type': ParameterDefinition(
                default_value='point_process',
                description='Type of neuron model',
                constraints={'allowed_values': ['point_process', 'biophysical', 'other']}
            ),
            
            'cell_class': ParameterDefinition(
                default_value='excitatory',
                description='Functional classification of the neuron',
                constraints={'allowed_values': ['excitatory', 'inhibitory', 'other']}
            ),
            
            # === SIGNALING PROPERTIES ===
            'neurotransmitter_types': ParameterDefinition(
                default_value=['AMPA', 'NMDA'],
                description='List of neurotransmitter receptor types (AMPA, NMDA, GABA, etc.)'
            ),
            
            'psp_amplitudes': ParameterDefinition(
                default_value={'AMPA': 0.5, 'NMDA': 0.3},
                description='PSP amplitude (mV) for each neurotransmitter type'
            ),
            
            'rise_times': ParameterDefinition(
                default_value={'AMPA': 2.0, 'NMDA': 10.0},
                description='Rise time (ms) for each neurotransmitter type'
            ),
            
            # === MORPHOLOGICAL PROPERTIES ===
            'dendrite_extent': ParameterDefinition(
                default_value=200.0,
                description='Average maximal extent of dendritic field (μm)',
                constraints={'min': 10.0, 'max': 1000.0},
                optimizable=True,
                optimization_range=[50.0, 500.0]
            ),
            
            'dendrite_diameter': ParameterDefinition(
                default_value=2.0,
                description='Mean diameter of dendrites (μm)',
                constraints={'min': 0.1, 'max': 10.0},
                optimizable=True,
                optimization_range=[0.5, 5.0]
            ),
            
            # === ACTIVITY PROPERTIES ===
            'firing_rate_resting': ParameterDefinition(
                default_value=[1.0, 5.0],
                description='Firing rate range for resting state [min, max] Hz',
                constraints={'min_length': 2, 'max_length': 2}
            ),
            
            'firing_rate_active': ParameterDefinition(
                default_value=[10.0, 30.0],
                description='Firing rate range for active state [min, max] Hz',
                constraints={'min_length': 2, 'max_length': 2}
            ),
            
            'firing_rate_maximum': ParameterDefinition(
                default_value=[50.0, 100.0],
                description='Firing rate range for maximum activity [min, max] Hz',
                constraints={'min_length': 2, 'max_length': 2}
            ),
            
            'firing_rate_disease': ParameterDefinition(
                default_value=[0.1, 2.0],
                description='Firing rate range for disease condition [min, max] Hz',
                constraints={'min_length': 2, 'max_length': 2}
            ),
            
            # === NEST MODEL PARAMETERS ===
            'nest_model': ParameterDefinition(
                default_value='iaf_psc_alpha',
                description='Base NEST neuron model name'
            ),
            
            'nest_parameters': ParameterDefinition(
                default_value={'V_th': -55.0, 'C_m': 250.0, 'tau_m': 20.0},
                description='Custom NEST model parameters to override'
            ),
            
            'template_suffix': ParameterDefinition(
                default_value='_custom',
                description='Suffix for the custom model template name'
            ),
            
            # === EXECUTION OPTIONS ===
            'execution_mode': ParameterDefinition(
                default_value='both',
                description='Execution mode: execute, script, or both',
                constraints={'allowed_values': ['execute', 'script', 'both']}
            ),
            
            'script_format': ParameterDefinition(
                default_value='python',
                description='Format for generated script',
                constraints={'allowed_values': ['python', 'notebook', 'both']}
            )
        },
        
        outputs={
            # NEST execution outputs
            'nest_neuron': PortDefinition(
                type=PortType.OBJECT,
                description='Created NEST neuron object'
            ),
            
            'nest_model_name': PortDefinition(
                type=PortType.STRING,
                description='Name of the created NEST model'
            ),
            
            # Script generation outputs
            'python_script': PortDefinition(
                type=PortType.STRING,
                description='Generated Python script for standalone execution'
            ),
            
            'notebook_cell': PortDefinition(
                type=PortType.STRING,
                description='Generated Jupyter notebook cell'
            ),
            
            # Metadata outputs
            'neuron_metadata': PortDefinition(
                type=PortType.DICT,
                description='Neuron metadata and biological properties'
            ),
            
            'biological_properties': PortDefinition(
                type=PortType.DICT,
                description='Biological properties and parameters'
            ),
            
            'nest_properties': PortDefinition(
                type=PortType.DICT,
                description='NEST-specific properties and parameters'
            )
        },
        
        methods={
            'execute': MethodDefinition(
                description='Execute neuron creation and generate outputs'
            ),
            
            'validate_parameters': MethodDefinition(
                description='Validate all neuron parameters'
            ),
            
            'generate_nest_script': MethodDefinition(
                description='Generate NEST Python script'
            )
        }
    )
    
    def __init__(self, name: str):
        """Initialize the SingleNeuron node."""
        super().__init__(name)
        self._validated_parameters = {}
        self._nest_neuron = None
        self._custom_model_name = None
    
    def execute(self) -> Dict[str, Any]:
        """
        Execute the neuron creation process.
        
        This method:
        1. Validates parameters
        2. Creates NEST objects (if in execute mode)
        3. Generates Python scripts (if in script mode)
        4. Sets output port values
        
        Returns:
            Dictionary with execution results and generated outputs
        """
        try:
            # Step 1: Validate parameters
            if not self.validate_parameters():
                return {
                    'success': False,
                    'error': 'Parameter validation failed',
                    'validated_parameters': self._validated_parameters
                }
            
            execution_mode = self._parameters.get('execution_mode', 'both')
            script_format = self._parameters.get('script_format', 'python')
            
            results = {
                'success': True,
                'execution_mode': execution_mode,
                'script_format': script_format
            }
            
            # Step 2: Create NEST objects (if in execute mode)
            if execution_mode in ['execute', 'both'] and NEST_AVAILABLE:
                nest_result = self._create_nest_neuron()
                results.update(nest_result)
            
            # Step 3: Generate scripts (if in script mode)
            if execution_mode in ['script', 'both']:
                script_result = self._generate_scripts()
                results.update(script_result)
            
            # Step 4: Generate metadata
            metadata_result = self._generate_metadata()
            results.update(metadata_result)
            
            # Step 5: Set output port values
            self._set_output_ports(results)
            
            return results
            
        except Exception as e:
            error_result = {
                'success': False,
                'error': str(e),
                'execution_mode': self._parameters.get('execution_mode', 'unknown')
            }
            return error_result
    
    def validate_parameters(self) -> bool:
        """Validate neuron parameters."""
        try:
            # Use base class validation first
            if not super().validate_parameters():
                return False
            
            # Copy validated parameters
            self._validated_parameters = self._parameters.copy()
            
            # Additional custom validation
            # Validate firing rate ranges
            for rate_param in ['firing_rate_resting', 'firing_rate_active', 'firing_rate_maximum', 'firing_rate_disease']:
                if rate_param in self._validated_parameters:
                    rate_range = self._validated_parameters[rate_param]
                    if not isinstance(rate_range, list) or len(rate_range) != 2:
                        print(f"Error: {rate_param} must be a list of 2 values [min, max]")
                        return False
                    if rate_range[0] >= rate_range[1]:
                        print(f"Error: {rate_param} min value must be less than max value")
                        return False
            
            # Validate dendrite parameters
            dendrite_extent = self._validated_parameters.get('dendrite_extent', 200.0)
            if not (10.0 <= dendrite_extent <= 1000.0):
                print(f"Error: dendrite_extent must be between 10.0 and 1000.0 μm")
                return False
            
            dendrite_diameter = self._validated_parameters.get('dendrite_diameter', 2.0)
            if not (0.1 <= dendrite_diameter <= 10.0):
                print(f"Error: dendrite_diameter must be between 0.1 and 10.0 μm")
                return False
            
            return True
            
        except Exception as e:
            print(f"Parameter validation error: {str(e)}")
            return False
    
    def _create_nest_neuron(self) -> Dict[str, Any]:
        """Create NEST neuron objects."""
        try:
            if not NEST_AVAILABLE:
                return {
                    'nest_available': False,
                    'nest_neuron': None,
                    'nest_model_name': None
                }
            
            # Create custom model name
            acronym = self._validated_parameters.get('acronym', 'N1')
            template_suffix = self._validated_parameters.get('template_suffix', '_custom')
            self._custom_model_name = f"{acronym}{template_suffix}"
            
            # Get base model and parameters
            base_model = self._validated_parameters.get('nest_model', 'iaf_psc_alpha')
            nest_params = self._validated_parameters.get('nest_parameters', {})
            
            # Create custom model
            nest.CopyModel(base_model, self._custom_model_name, nest_params)
            
            # Create neuron instance
            self._nest_neuron = nest.Create(self._custom_model_name)
            
            return {
                'nest_available': True,
                'nest_neuron': self._nest_neuron,
                'nest_model_name': self._custom_model_name,
                'base_model': base_model,
                'nest_parameters': nest_params
            }
            
        except Exception as e:
            return {
                'nest_available': NEST_AVAILABLE,
                'nest_error': str(e),
                'nest_neuron': None,
                'nest_model_name': None
            }
    
    def _generate_scripts(self) -> Dict[str, Any]:
        """Generate Python scripts for standalone execution."""
        try:
            script_format = self._validated_parameters.get('script_format', 'python')
            
            results = {}
            
            # Generate Python script
            if script_format in ['python', 'both']:
                python_script = self._generate_python_script()
                results['python_script'] = python_script
            
            # Generate notebook cell
            if script_format in ['notebook', 'both']:
                notebook_cell = self._generate_notebook_cell()
                results['notebook_cell'] = notebook_cell
            
            return results
            
        except Exception as e:
            return {
                'script_error': str(e),
                'python_script': None,
                'notebook_cell': None
            }
    
    def _generate_python_script(self) -> str:
        """Generate standalone Python script."""
        name = self._validated_parameters.get('name', 'Neuron_1')
        acronym = self._validated_parameters.get('acronym', 'N1')
        base_model = self._validated_parameters.get('nest_model', 'iaf_psc_alpha')
        nest_params = self._validated_parameters.get('nest_parameters', {})
        template_suffix = self._validated_parameters.get('template_suffix', '_custom')
        custom_model_name = f"{acronym}{template_suffix}"
        
        script_lines = [
            "# Generated Neural Model Code",
            f"# Created by NeuroWorkflow SNNbuilder SingleNeuron node",
            f"# Neuron: {name} ({acronym})",
            "",
            "import nest",
            "",
            "# Reset NEST kernel",
            "nest.ResetKernel()",
            "",
            f"# === CUSTOM NEURON MODEL: {custom_model_name} ===",
            "# Create custom neuron model template",
            f"nest.CopyModel(",
            f"    '{base_model}',",
            f"    '{custom_model_name}',",
            f"    {json.dumps(nest_params, indent=4)}",
            ")",
            "",
            "# Create neuron instance",
            f"neuron = nest.Create('{custom_model_name}')",
            f"print(f'Created neuron: {{neuron}}')",
            "",
            "# Biological Properties:",
            f"# - Name: {name}",
            f"# - Cell Class: {self._validated_parameters.get('cell_class', 'excitatory')}",
            f"# - Dendrite Extent: {self._validated_parameters.get('dendrite_extent', 200.0)} μm",
            f"# - Firing Rate (Resting): {self._validated_parameters.get('firing_rate_resting', [1.0, 5.0])} Hz",
            "",
            "# You can now use this neuron in your NEST simulation",
            "# Example: nest.Simulate(1000.0)  # Simulate for 1000ms"
        ]
        
        return "\\n".join(script_lines)
    
    def _generate_notebook_cell(self) -> str:
        """Generate Jupyter notebook cell."""
        name = self._validated_parameters.get('name', 'Neuron_1')
        cell_class = self._validated_parameters.get('cell_class', 'excitatory')
        nest_model = self._validated_parameters.get('nest_model', 'iaf_psc_alpha')
        
        header = f"### Neural Model: {name}\\n\\n"
        header += f"**Cell Type:** {cell_class.title()}  \\n"
        header += f"**NEST Model:** {nest_model}  \\n"
        header += f"**Dendrite Extent:** {self._validated_parameters.get('dendrite_extent', 200.0)} μm  \\n\\n"
        
        code = "```python\\n" + self._generate_python_script() + "\\n```"
        
        return header + code
    
    def _generate_metadata(self) -> Dict[str, Any]:
        """Generate neuron metadata and properties."""
        biological_properties = {
            'name': self._validated_parameters.get('name'),
            'acronym': self._validated_parameters.get('acronym'),
            'cell_class': self._validated_parameters.get('cell_class'),
            'model_type': self._validated_parameters.get('model_type'),
            'neurotransmitter_types': self._validated_parameters.get('neurotransmitter_types'),
            'psp_amplitudes': self._validated_parameters.get('psp_amplitudes'),
            'rise_times': self._validated_parameters.get('rise_times'),
            'dendrite_extent': self._validated_parameters.get('dendrite_extent'),
            'dendrite_diameter': self._validated_parameters.get('dendrite_diameter'),
            'firing_rate_resting': self._validated_parameters.get('firing_rate_resting'),
            'firing_rate_active': self._validated_parameters.get('firing_rate_active'),
            'firing_rate_maximum': self._validated_parameters.get('firing_rate_maximum')
        }
        
        nest_properties = {
            'nest_model': self._validated_parameters.get('nest_model'),
            'nest_parameters': self._validated_parameters.get('nest_parameters'),
            'custom_model_name': self._custom_model_name,
            'template_suffix': self._validated_parameters.get('template_suffix'),
            'nest_available': NEST_AVAILABLE
        }
        
        neuron_metadata = {
            'node_type': 'SNNbuilder_SingleNeuron',
            'creation_timestamp': None,  # Could add timestamp
            'execution_mode': self._validated_parameters.get('execution_mode'),
            'script_format': self._validated_parameters.get('script_format'),
            'validation_status': 'passed'
        }
        
        return {
            'biological_properties': biological_properties,
            'nest_properties': nest_properties,
            'neuron_metadata': neuron_metadata
        }
    
    def _set_output_ports(self, results: Dict[str, Any]) -> None:
        """Set output port values based on execution results."""
        # Set NEST outputs
        self.set_output('nest_neuron', results.get('nest_neuron'))
        self.set_output('nest_model_name', results.get('nest_model_name'))
        
        # Set script outputs
        self.set_output('python_script', results.get('python_script'))
        self.set_output('notebook_cell', results.get('notebook_cell'))
        
        # Set metadata outputs
        self.set_output('neuron_metadata', results.get('neuron_metadata'))
        self.set_output('biological_properties', results.get('biological_properties'))
        self.set_output('nest_properties', results.get('nest_properties'))
    
    def generate_nest_script(self) -> str:
        """Generate NEST script (public method)."""
        if not self._validated_parameters:
            self.validate_parameters()
        return self._generate_python_script()