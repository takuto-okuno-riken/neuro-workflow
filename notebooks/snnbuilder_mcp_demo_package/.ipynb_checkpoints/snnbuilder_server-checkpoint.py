# snnbuilder_server.py - MCP Server for SNNbuilder SingleNeuron
import sys, logging, json, asyncio
from typing import Dict, Any, List, Optional
from mcp.server.fastmcp import FastMCP

# Import NeuroWorkflow components
try:
    from neuroworkflow.nodes.network.SNNbuilder_SingleNeuron import SNNbuilder_SingleNeuron
    NEUROWORKFLOW_AVAILABLE = True
except ImportError as e:
    print(f"Warning: NeuroWorkflow not available: {e}")
    NEUROWORKFLOW_AVAILABLE = False

# Set up logging
logger = logging.getLogger("snnbuilder-mcp-server")
logger.setLevel(logging.DEBUG)
fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")

stderr_h = logging.StreamHandler(sys.stderr)
stderr_h.setFormatter(fmt)
file_h = logging.FileHandler("snnbuilder_server.log", encoding="utf-8")
file_h.setFormatter(fmt)

logger.handlers.clear()
logger.addHandler(stderr_h)
logger.addHandler(file_h)

# Create MCP server
mcp = FastMCP("snnbuilder-singleneuron")

# Global state for neuron instances
neuron_instances = {}  # neuron_id -> neuron_instance

@mcp.tool()
def explain_neuron_creation() -> str:
    """
    Explain how to create a neuron using SNNbuilder SingleNeuron node.
    
    This function provides comprehensive information about neuron creation,
    including available parameters, their meanings, and typical usage patterns.
    
    When to use:
      - When you want to understand how to create neurons
      - To learn about available neuron parameters
      - To get guidance on neuron modeling best practices
      - As a starting point for neuron creation
    
    Returns detailed explanation of neuron creation process and parameters.
    """
    logger.debug("explain_neuron_creation() called")
    
    if not NEUROWORKFLOW_AVAILABLE:
        return json.dumps({
            "error": "NeuroWorkflow not available. Please install the NeuroWorkflow package.",
            "success": False
        }, indent=2)
    
    explanation = {
        "overview": "SNNbuilder SingleNeuron node creates individual neurons with biological and computational parameters",
        
        "creation_process": {
            "step_1": "Create node instance: SNNbuilder_SingleNeuron('neuron_name')",
            "step_2": "Configure parameters: node.configure(parameter=value, ...)",
            "step_3": "Execute node: node.execute() to create NEST objects and generate code"
        },
        
        "parameter_categories": {
            "biological_identification": {
                "name": "Descriptive name for the neuron (e.g., 'Pyramidal Neuron L2/3')",
                "acronym": "Short identifier (e.g., 'PyL23')",
                "model_type": "Type of model: 'point_process', 'biophysical', 'other'",
                "cell_class": "Functional type: 'excitatory', 'inhibitory', 'other'"
            },
            
            "signaling_properties": {
                "neurotransmitter_types": "List of receptor types: ['AMPA', 'NMDA', 'GABA']",
                "psp_amplitudes": "PSP amplitude in mV for each receptor: {'AMPA': 0.5, 'NMDA': 0.3}",
                "rise_times": "Rise time in ms for each receptor: {'AMPA': 2.0, 'NMDA': 10.0}"
            },
            
            "morphological_properties": {
                "dendrite_extent": "Dendritic field extent in μm (10-1000 μm)",
                "dendrite_diameter": "Mean dendrite diameter in μm (0.1-10 μm)"
            },
            
            "activity_properties": {
                "firing_rate_resting": "Resting firing rate range [min, max] Hz",
                "firing_rate_active": "Active state firing rate range [min, max] Hz", 
                "firing_rate_maximum": "Maximum firing rate range [min, max] Hz"
            },
            
            "nest_parameters": {
                "nest_model": "Base NEST model: 'iaf_psc_alpha', 'iaf_cond_exp', etc.",
                "nest_parameters": "Dictionary of NEST-specific parameters: {'V_th': -50.0, 'C_m': 200.0, ...}"
            }
        },
        
        "typical_values": {
            "cortical_pyramidal": {
                "V_th": "-50.0 to -55.0 mV (threshold potential)",
                "C_m": "150.0 to 300.0 pF (membrane capacitance)",
                "tau_m": "10.0 to 20.0 ms (membrane time constant)",
                "firing_rate_resting": "1-10 Hz",
                "dendrite_extent": "200-400 μm"
            },
            
            "cortical_interneuron": {
                "V_th": "-45.0 to -50.0 mV",
                "C_m": "100.0 to 200.0 pF", 
                "tau_m": "5.0 to 15.0 ms",
                "firing_rate_resting": "5-20 Hz",
                "dendrite_extent": "100-250 μm"
            }
        },
        
        "next_steps": [
            "Use create_single_neuron() to create a neuron instance",
            "Use execute_single_neuron() to generate NEST objects and code",
            "Use get_neuron_info() to inspect neuron properties",
            "Use generate_neuron_code() to get standalone Python code"
        ]
    }
    
    return json.dumps(explanation, indent=2)

@mcp.tool()
def create_single_neuron(
    neuron_id: str,
    name: str = "Neuron_1",
    acronym: str = "N1",
    cell_class: str = "excitatory",
    dendrite_extent: float = 200.0,
    firing_rate_resting_min: float = 1.0,
    firing_rate_resting_max: float = 5.0,
    nest_model: str = "iaf_psc_alpha",
    v_th: float = -50.0,
    c_m: float = 200.0,
    tau_m: float = 15.0,
    v_reset: float = -70.0,
    t_ref: float = 2.0
) -> str:
    """
    Create a single neuron with biological and computational parameters.
    
    This function creates a SNNbuilder SingleNeuron node with comprehensive
    biological context and NEST-specific parameters for computational modeling.
    
    When to use:
      - Creating individual neurons for neural network models
      - Defining neuron types with specific biological properties
      - Setting up neurons with custom NEST parameters
      - Building neuron templates for population creation
    
    Parameters:
      - neuron_id: Unique identifier for this neuron instance
      - name: Descriptive name (e.g., "Pyramidal Neuron L2/3")
      - acronym: Short identifier (e.g., "PyL23")
      - cell_class: Functional class ("excitatory", "inhibitory")
      - dendrite_extent: Dendritic field extent in μm (10-1000)
      - firing_rate_resting_min: Minimum resting firing rate (Hz)
      - firing_rate_resting_max: Maximum resting firing rate (Hz)
      - nest_model: NEST model name ("iaf_psc_alpha", "iaf_cond_exp", etc.)
      - v_th: Threshold potential in mV
      - c_m: Membrane capacitance in pF
      - tau_m: Membrane time constant in ms
      - v_reset: Reset potential in mV
      - t_ref: Refractory period in ms
    
    Examples:
      create_single_neuron(
          neuron_id="pyr_l23",
          name="Layer 2/3 Pyramidal Neuron",
          dendrite_extent=300.0,
          firing_rate_resting_min=2.0,
          firing_rate_resting_max=8.0
      )
    """
    logger.debug(f"create_single_neuron() called with neuron_id={neuron_id}")
    
    if not NEUROWORKFLOW_AVAILABLE:
        return json.dumps({
            "error": "NeuroWorkflow not available. Please install the NeuroWorkflow package.",
            "success": False
        }, indent=2)
    
    try:
        # Check if neuron_id already exists
        if neuron_id in neuron_instances:
            result = {
                'success': False,
                'error': f"Neuron ID '{neuron_id}' already exists",
                'neuron_id': neuron_id
            }
            return json.dumps(result, indent=2)
        
        # Create the neuron node instance
        neuron_node = SNNbuilder_SingleNeuron(neuron_id)
        
        # Prepare configuration parameters
        config_params = {
            'name': name,
            'acronym': acronym,
            'model_type': 'point_process',
            'cell_class': cell_class,
            'dendrite_extent': dendrite_extent,
            'firing_rate_resting': [firing_rate_resting_min, firing_rate_resting_max],
            'nest_model': nest_model,
            'nest_parameters': {
                'V_th': v_th,
                'C_m': c_m,
                'tau_m': tau_m,
                'V_reset': v_reset,
                't_ref': t_ref
            },
            'execution_mode': 'both',
            'script_format': 'both'
        }
        
        # Configure the neuron
        neuron_node.configure(**config_params)
        
        # Store in global state
        neuron_instances[neuron_id] = neuron_node
        
        result = {
            'success': True,
            'neuron_id': neuron_id,
            'node_type': 'SNNbuilder_SingleNeuron',
            'configuration': config_params,
            'message': f"Single neuron '{name}' created successfully",
            'next_steps': [
                f"Use execute_single_neuron('{neuron_id}') to create NEST objects and generate code",
                f"Use get_neuron_info('{neuron_id}') to inspect neuron properties"
            ]
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        logger.error(f"Error creating single neuron: {str(e)}")
        result = {
            'success': False,
            'error': str(e),
            'neuron_id': neuron_id
        }
        return json.dumps(result, indent=2)

@mcp.tool()
def execute_single_neuron(neuron_id: str) -> str:
    """
    Execute a single neuron node to create NEST objects and generate code.
    
    This function runs the neuron creation process, which includes parameter
    validation, NEST model creation, and Python script generation.
    
    When to use:
      - After creating and configuring a neuron node
      - To generate the actual NEST neuron objects and code
      - To validate neuron parameters and configuration
      - Before using the neuron in populations or connections
    
    Parameters:
      - neuron_id: ID of the neuron to execute
    
    Examples:
      execute_single_neuron(neuron_id="pyr_l23")
    """
    logger.debug(f"execute_single_neuron() called with neuron_id={neuron_id}")
    
    if not NEUROWORKFLOW_AVAILABLE:
        return json.dumps({
            "error": "NeuroWorkflow not available. Please install the NeuroWorkflow package.",
            "success": False
        }, indent=2)
    
    try:
        # Check if neuron exists
        if neuron_id not in neuron_instances:
            result = {
                'success': False,
                'error': f"Neuron ID '{neuron_id}' not found",
                'neuron_id': neuron_id
            }
            return json.dumps(result, indent=2)
        
        neuron_node = neuron_instances[neuron_id]
        
        # Execute the neuron node
        execution_result = neuron_node.execute()
        
        # Extract key information for LLM understanding
        result_summary = {
            'success': True,
            'neuron_id': neuron_id,
            'execution_status': execution_result.get('success', False),
            'nest_model_created': execution_result.get('nest_model_name') is not None,
            'nest_model_name': execution_result.get('nest_model_name'),
            'script_generated': execution_result.get('python_script') is not None,
            'neuron_configuration': {
                'name': neuron_node._parameters.get('name'),
                'cell_class': neuron_node._parameters.get('cell_class'),
                'nest_model': neuron_node._parameters.get('nest_model')
            }
        }
        
        # Add generated code (truncated for display)
        if 'python_script' in execution_result:
            script = execution_result['python_script']
            result_summary['generated_python_code_preview'] = script[:500] + "..." if len(script) > 500 else script
        
        return json.dumps(result_summary, indent=2)
        
    except Exception as e:
        logger.error(f"Error executing single neuron: {str(e)}")
        result = {
            'success': False,
            'error': str(e),
            'neuron_id': neuron_id
        }
        return json.dumps(result, indent=2)

@mcp.tool()
def generate_neuron_code(neuron_id: str, code_format: str = "python") -> str:
    """
    Generate standalone Python code for a neuron.
    
    This function creates executable Python code that can reproduce the neuron
    outside of the NeuroWorkflow environment, useful for sharing and publication.
    
    When to use:
      - To get standalone code for a configured neuron
      - For sharing neuron models with others
      - To create reproducible neuron definitions
      - For integration with other NEST workflows
    
    Parameters:
      - neuron_id: ID of the neuron to generate code for
      - code_format: Format of generated code ("python", "notebook")
    
    Examples:
      generate_neuron_code(neuron_id="pyr_l23", code_format="python")
    """
    logger.debug(f"generate_neuron_code() called with neuron_id={neuron_id}")
    
    if not NEUROWORKFLOW_AVAILABLE:
        return json.dumps({
            "error": "NeuroWorkflow not available. Please install the NeuroWorkflow package.",
            "success": False
        }, indent=2)
    
    try:
        # Check if neuron exists
        if neuron_id not in neuron_instances:
            result = {
                'success': False,
                'error': f"Neuron ID '{neuron_id}' not found",
                'neuron_id': neuron_id
            }
            return json.dumps(result, indent=2)
        
        neuron_node = neuron_instances[neuron_id]
        
        # Check if neuron has been executed
        if not hasattr(neuron_node, '_output_ports') or not any(port.value is not None for port in neuron_node._output_ports.values()):
            result = {
                'success': False,
                'error': f"Neuron '{neuron_id}' has not been executed yet. Use execute_single_neuron() first.",
                'neuron_id': neuron_id
            }
            return json.dumps(result, indent=2)
        
        # Get generated code from output ports
        python_code = neuron_node._output_ports.get('python_script', {}).value if hasattr(neuron_node, '_output_ports') else None
        notebook_code = neuron_node._output_ports.get('notebook_cell', {}).value if hasattr(neuron_node, '_output_ports') else None
        
        result = {
            'success': True,
            'neuron_id': neuron_id,
            'code_format': code_format,
            'neuron_summary': {
                'name': neuron_node._parameters.get('name'),
                'cell_class': neuron_node._parameters.get('cell_class'),
                'nest_model': neuron_node._parameters.get('nest_model')
            },
            'usage_instructions': [
                "1. Ensure NEST is installed: pip install nest-simulator",
                "2. Copy the generated code to a Python file",
                "3. Run the code to create the neuron model",
                "4. Use the created model in your NEST simulations"
            ]
        }
        
        if code_format == "python" and python_code:
            result['python_code'] = python_code
        elif code_format == "notebook" and notebook_code:
            result['notebook_code'] = notebook_code
        else:
            result['warning'] = "No generated code available or invalid format requested."
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        logger.error(f"Error generating neuron code: {str(e)}")
        result = {
            'success': False,
            'error': str(e),
            'neuron_id': neuron_id
        }
        return json.dumps(result, indent=2)

@mcp.tool()
def list_created_neurons() -> str:
    """
    List all created neurons in the current session.
    
    This function provides an overview of all neuron instances that have been
    created, their configuration status, and execution status.
    
    When to use:
      - To see what neurons are available
      - To check the status of created neurons
      - For session management and debugging
      - Before creating new neurons to avoid ID conflicts
    
    Examples:
      list_created_neurons()
    """
    logger.debug("list_created_neurons() called")
    
    if not NEUROWORKFLOW_AVAILABLE:
        return json.dumps({
            "error": "NeuroWorkflow not available. Please install the NeuroWorkflow package.",
            "success": False
        }, indent=2)
    
    try:
        if not neuron_instances:
            result = {
                'success': True,
                'total_neurons': 0,
                'message': "No neurons have been created yet. Use create_single_neuron() to create your first neuron.",
                'next_steps': [
                    "Use explain_neuron_creation() to learn about neuron creation",
                    "Use create_single_neuron() to create a neuron"
                ]
            }
            return json.dumps(result, indent=2)
        
        neurons_info = {}
        executed_count = 0
        
        for neuron_id, neuron_node in neuron_instances.items():
            is_executed = hasattr(neuron_node, '_output_ports') and any(port.value is not None for port in neuron_node._output_ports.values())
            if is_executed:
                executed_count += 1
                
            neuron_info = {
                'configured': hasattr(neuron_node, '_parameters') and bool(neuron_node._parameters),
                'executed': is_executed,
                'name': neuron_node._parameters.get('name', 'Unknown') if hasattr(neuron_node, '_parameters') else 'Unknown',
                'cell_class': neuron_node._parameters.get('cell_class', 'Unknown') if hasattr(neuron_node, '_parameters') else 'Unknown',
                'nest_model': neuron_node._parameters.get('nest_model', 'Unknown') if hasattr(neuron_node, '_parameters') else 'Unknown'
            }
            
            neurons_info[neuron_id] = neuron_info
        
        result = {
            'success': True,
            'total_neurons': len(neuron_instances),
            'executed_neurons': executed_count,
            'neurons': neurons_info,
            'available_actions': [
                "execute_single_neuron(neuron_id) - Execute a specific neuron",
                "generate_neuron_code(neuron_id) - Generate standalone code"
            ]
        }
        
        return json.dumps(result, indent=2)
        
    except Exception as e:
        logger.error(f"Error listing neurons: {str(e)}")
        result = {
            'success': False,
            'error': str(e)
        }
        return json.dumps(result, indent=2)

if __name__ == "__main__":
    logger.debug("SNNbuilder SingleNeuron MCP server starting...")
    mcp.run("stdio")