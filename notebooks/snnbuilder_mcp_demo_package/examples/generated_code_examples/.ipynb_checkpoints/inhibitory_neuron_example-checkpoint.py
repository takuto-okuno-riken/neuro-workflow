# Generated Neural Model Code
# Created by NeuroWorkflow SNNbuilder SingleNeuron node
# Neuron: Fast-Spiking Interneuron (FSI)

import nest

# Reset NEST kernel
nest.ResetKernel()

# === CUSTOM NEURON MODEL: FSI_custom ===
# Create custom neuron model template
nest.CopyModel(
    'iaf_psc_alpha',
    'FSI_custom',
    {
        "V_th": -45.0,      # Threshold potential (mV)
        "C_m": 100.0,       # Membrane capacitance (pF)
        "tau_m": 8.0,       # Membrane time constant (ms)
        "V_reset": -65.0,   # Reset potential (mV)
        "t_ref": 1.0        # Refractory period (ms)
    }
)

# Create neuron instance
neuron = nest.Create('FSI_custom')
print(f'Created neuron: {neuron}')

# Biological Properties:
# - Name: Fast-Spiking Interneuron
# - Cell Class: inhibitory
# - Dendrite Extent: 150.0 μm
# - Firing Rate (Resting): [5.0, 20.0] Hz

# You can now use this neuron in your NEST simulation
# Example: nest.Simulate(1000.0)  # Simulate for 1000ms