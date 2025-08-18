#!/usr/bin/env python3
"""
my test 2!!!!
"""
import sys
import os
# Add the src directory to the Python path to import the library
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))
from neuroworkflow import WorkflowBuilder
from neuroworkflow.nodes.network import BuildSonataNetworkNode
from neuroworkflow.nodes.simulation import SimulateSonataNetworkNode

def main():
    """Run a simple neural simulation workflow."""

    calc_1754882995931_0u9ytjdkq = BuildSonataNetworkNode("SonataNetworkBuilder")
    calc_1754882995931_0u9ytjdkq.configure(
        sonata_path="../data/300_pointneurons",
        net_config_file="circuit_config.json",
        sim_config_file="simulation_config.json",
        hdf5_hyperslab_size=1024
    )

    calc_1754883289222_u17awvmb9 = SimulateSonataNetworkNode("SonataNetworkSimulation")
    calc_1754883289222_u17awvmb9.configure(
        simulation_time=1000.0,
        record_from_population="internal",
        record_n_neurons=40
    )

    workflow = (
        WorkflowBuilder("neural_simulation")
            .add_node(calc_1754816252864_zy0nuqx1w)
            .add_node(calc_1754882995931_0u9ytjdkq)
            .add_node(calc_1754883289222_u17awvmb9)
            .build()
    )

    # Print workflow information
    print(workflow)
   
    # Execute workflow
    print("\\nExecuting workflow...")
    success = workflow.execute()
   
    if success:
        print("Workflow execution completed successfully!")
    else:
        print("Workflow execution failed!")
        return 1
       
    return 0

if __name__ == "__main__":
    sys.exit(main())
