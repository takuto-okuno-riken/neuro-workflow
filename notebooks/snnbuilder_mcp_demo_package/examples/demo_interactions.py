"""
Example interactions with SNNbuilder MCP server

This file shows example interactions that demonstrate the capabilities
of the SNNbuilder MCP integration for AI-augmented neuroscience.
"""

# Example questions you can ask the LLM agent:

EXAMPLE_QUESTIONS = [
    # Learning and exploration
    "How do I create a neuron? What are the parameters and their meanings?",
    "What are typical parameter values for cortical pyramidal neurons?",
    "Explain the difference between excitatory and inhibitory neurons",
    
    # Neuron creation
    "Create a Layer 2/3 pyramidal neuron with realistic biological parameters",
    "Create a fast-spiking inhibitory interneuron",
    "Create a hippocampal CA1 pyramidal neuron",
    "Create a custom neuron with threshold at -45 mV and capacitance of 150 pF",
    
    # Workflow management
    "Execute the pyramidal neuron I created",
    "Show me all the neurons I've created and their status",
    "Generate Python code for the pyramidal neuron",
    
    # Educational and comparative
    "Compare the pyramidal and inhibitory neurons I created",
    "What are common mistakes when creating neurons?",
    "Give me best practices for choosing neuron parameters",
    
    # Advanced workflows
    "Show me a complete workflow from neuron creation to code generation",
    "Create three different neuron types and compare their properties",
    "Build a cortical neuron and explain how to extend it to a network"
]

# Example expected workflow:
EXAMPLE_WORKFLOW = """
1. User asks: "How do I create a neuron?"
   → LLM calls: explain_neuron_creation()
   → Response: Comprehensive explanation of parameters and process

2. User asks: "Create a pyramidal neuron for me"
   → LLM calls: create_single_neuron(neuron_id="pyramidal", name="Pyramidal Neuron", ...)
   → Response: Neuron created with configuration details

3. User asks: "What should I do next?"
   → LLM calls: execute_single_neuron("pyramidal")
   → Response: Execution results with generated code preview

4. User asks: "Generate Python code for this neuron"
   → LLM calls: generate_neuron_code("pyramidal", code_format="python")
   → Response: Complete standalone Python code

5. User asks: "Show me all my neurons"
   → LLM calls: list_created_neurons()
   → Response: Summary of all created neurons and their status
"""

# Example generated code structure:
EXAMPLE_GENERATED_CODE = '''
# Generated Neural Model Code
# Created by NeuroWorkflow SNNbuilder SingleNeuron node
# Neuron: Layer 2/3 Pyramidal Neuron (PyL23)

import nest

# Reset NEST kernel
nest.ResetKernel()

# === CUSTOM NEURON MODEL: PyL23_custom ===
# Create custom neuron model template
nest.CopyModel(
    'iaf_psc_alpha',
    'PyL23_custom',
    {
        "V_th": -50.0,      # Threshold potential (mV)
        "C_m": 200.0,       # Membrane capacitance (pF)
        "tau_m": 15.0,      # Membrane time constant (ms)
        "V_reset": -70.0,   # Reset potential (mV)
        "t_ref": 2.0        # Refractory period (ms)
    }
)

# Create neuron instance
neuron = nest.Create('PyL23_custom')
print(f'Created neuron: {neuron}')

# Biological Properties:
# - Name: Layer 2/3 Pyramidal Neuron
# - Cell Class: excitatory
# - Dendrite Extent: 300.0 μm
# - Firing Rate (Resting): [2.0, 8.0] Hz

# You can now use this neuron in your NEST simulation
# Example: nest.Simulate(1000.0)  # Simulate for 1000ms
'''

if __name__ == "__main__":
    print("SNNbuilder MCP Demo - Example Interactions")
    print("=" * 50)
    print("\\nExample questions you can ask:")
    for i, question in enumerate(EXAMPLE_QUESTIONS[:5], 1):
        print(f"{i}. {question}")
    
    print(f"\\n... and {len(EXAMPLE_QUESTIONS) - 5} more examples!")
    print("\\nSee SETUP_AND_RUN.ipynb for the complete interactive demo.")