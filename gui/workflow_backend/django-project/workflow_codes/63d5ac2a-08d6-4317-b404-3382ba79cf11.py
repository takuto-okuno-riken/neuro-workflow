#!/usr/bin/env python3
"""
Generated workflow for project: TEST-GEN
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

    calc_1754895039907_2s3lqu8hy = SimulateSonataNetworkNode("SonataNetworkSimulation")
    calc_1754895039907_2s3lqu8hy.configure(
        simulation_time=1000.0,
        record_from_population="internal",
        record_n_neurons=40
    )

    calc_1754895056544_5spv0wxtf = SimulateSonataNetworkNode("SonataNetworkSimulation")
    calc_1754895056544_5spv0wxtf.configure(
        simulation_time=1000.0,
        record_from_population="internal",
        record_n_neurons=40
    )

    calc_1754895218549_nv7hudyl7 = BuildSonataNetworkNode("SonataNetworkBuilder")
    calc_1754895218549_nv7hudyl7.configure(
        sonata_path="../data/300_pointneurons",
        net_config_file="circuit_config.json",
        sim_config_file="simulation_config.json",
        hdf5_hyperslab_size=1024
    )

    calc_1754895252676_31gv4o1fl = SimulateSonataNetworkNode("SonataNetworkSimulation")
    calc_1754895252676_31gv4o1fl.configure(
        simulation_time=1000.0,
        record_from_population="internal",
        record_n_neurons=40
    )

    # Node: SampleSonataNetworkNode (ID: calc_1754897158852_sj0sy7c1a)
    calc_1754897158852_sj0sy7c1a = None  # TODO: Add implementation for SampleSonataNetworkNode

    workflow = (
        WorkflowBuilder("neural_simulation")
            .add_node(calc_1754895039907_2s3lqu8hy)
            .add_node(calc_1754895056544_5spv0wxtf)
            .add_node(calc_1754895218549_nv7hudyl7)
            .build()
    )

    # Print workflow information
    print(workflow)
   
    # Execute workflow
    print("\nExecuting workflow...")
    success = workflow.execute()
   
    if success:
        print("Workflow execution completed successfully!")
    else:
        print("Workflow execution failed!")
        return 1
       
    return 0

if __name__ == "__main__":
    sys.exit(main())
