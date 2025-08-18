def main():
    """Run a simple neural simulation workflow."""
    calc_1752531431564 = SimulateSonataNetworkNode("SonataNetworkSimulation")
    calc_1752531431564.configure(
        simulation_time=1000.0,
        record_from_population="internal",
        record_n_neurons=40
    )

    workflow = (
        WorkflowBuilder("neural_simulation")
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
