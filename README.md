# NeuroWorkflow

A Python library for building and executing neural simulation workflows.

## Support and Development

<div align="center">

### Supported by Brain/MINDS 2.0
<img src="img/BM2.0.png" alt="Brain/MINDS 2.0 Logo" width="200"/>

### Developed by Neural Computation Unit (Doya Lab) at OIST and Collaborators
<img src="img/oist.png" alt="OIST Logo" width="200"/>

</div>

This project is supported by the **<a href="https://brainminds.jp/" target="_blank">Brain/MINDS 2.0</a>** initiative and is being developed by the **<a href="https://www.oist.jp/research/research-units/ncu" target="_blank">Neural Computation Unit (Doya Lab)</a>** at the **Okinawa Institute of Science and Technology (OIST)** in collaboration with partners.

## Preview

Get a first impression of NeuroWorkflow in action:

<div align="center">

[![NeuroWorkflow Preview](https://img.youtube.com/vi/hC4NUOuR3OI/maxresdefault.jpg)](https://www.youtube.com/watch?v=hC4NUOuR3OI)

*Click the image above to watch the NeuroWorkflow demonstration*

</div>

<!-- Alternative: Direct video for local viewing -->
<details>
<summary>📹 View video locally (click to expand)</summary>

<video width="600" controls>
  <source src="img/preview_neuro_workflow_oist.mp4" type="video/mp4">
  Your browser does not support the video tag. 
  <a href="img/preview_neuro_workflow_oist.mp4">Download the preview video</a>
</video>

</details>

## Features

- Node-based workflow system for neural simulations
- Type-safe connections between workflow components
- Pre-built nodes for common neural simulation tasks
- Extensible architecture for custom nodes
- Parameter optimization support for tuning simulation parameters

## Current status

- The `src` folder contains the core functionality and sample nodes
- In the examples folder:
  - `sonata_simulation.py` - Basic simulation example
  - `neuron_optimization.py` - Example of parameter optimization (not yet completed, but running with some bugs)
  - `epilepsy_rs.py` - Example of epileptic resting state using the virtual brain TVB
- In the notebooks folder:
  - `01_Basic_Simulation.ipynb` - Interactive example of basic simulation
  - `epilepsy_rs.ipynb` - Interactive example of epileptic resting state using the virtual brain TVB
  - `SNNbuilder_example1.ipynb` - Interactive example of Spiking Neural Network building using SNNbuilder custom nodes

## Conference Presentations

This work has been presented at several conferences and workshops, receiving valuable feedback that has contributed to its ongoing development:

### 2025

- **Winter Workshop**

  - _"Towards a Generic and Open Software for Building Digital Brains"_
  - [📄 Poster](posters_conferences/Winter_WorkShop_BM2.pdf)

- **Unified Theory Workshop** (May 30, 2025)

  - _"NeuroWorkflow: A python-based Graph Framework for Modular Brain Modeling Workflows"_
  - [📄 Poster](posters_conferences/Unified_Theory_Poster_2025May30.pdf)

- **NEST Conference 2025** (June 17, 2025)

  - _"A Graph-Based, In-Memory Workflow Library for Brain/MINDS 2.0"_
  - [📄 Presentation Slides](posters_conferences/NEST_conference_slides_20250617_Carlos.pdf)

- **CNS 2025 (Computational Neuroscience Society)**

  - _"A Graph-Based, In-Memory Workflow Library for Brain/MINDS 2.0 – The Japan Digital Brain Project"_
  - [📄 Poster](posters_conferences/Poster_cns2025_Carlos.pdf)

- **RIKEN CBS Hackathon** (September 28, 2025)

  - _"Building BrainModeling Workflows: A proof-of-concept framework"_
  - [📄 Hackathon Material](posters_conferences/hackathon_material_OIST_carlos_20250928.pdf)

- **INCF/EBrains Summit**
  - _"NeuroWorkflow: A Node-Based Framework for Scalable Computational Neuroscience with AI-Ready Infrastructure"_
  - [📄 Abstract](posters_conferences/abstract_INCF_EBrains_summit.pdf)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
