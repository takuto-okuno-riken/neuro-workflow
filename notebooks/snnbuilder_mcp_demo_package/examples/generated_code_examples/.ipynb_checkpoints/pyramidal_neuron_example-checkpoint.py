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