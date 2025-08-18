def main():
    """Run a simple neural simulation workflow."""
    workflow = (
        WorkflowBuilder("neural_simulation")
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