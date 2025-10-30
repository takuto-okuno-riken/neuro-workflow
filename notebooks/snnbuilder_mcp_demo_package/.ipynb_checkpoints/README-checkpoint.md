# SNNbuilder MCP Demo Package

This package demonstrates AI-augmented computational neuroscience using SNNbuilder nodes through MCP (Model Context Protocol) servers with LLM agents.

## 🎯 What This Demo Shows

- **Natural Language Interface**: Create neurons using plain English
- **AI-Augmented Neuroscience**: LLM agents understand and manipulate neuroscience workflows
- **Educational Value**: Learn neuroscience concepts through AI explanations
- **Code Generation**: Automatic creation of standalone, reproducible Python code
- **Domain Knowledge Integration**: Built-in neuroscience expertise guides parameter selection

## 📦 Package Contents

```
snnbuilder_mcp_demo_package/
├── README.md                           # This file
├── SETUP_AND_RUN.ipynb                # Complete setup and demo notebook
├── requirements.txt                    # Python dependencies
├── key_template.json                   # Template for API configuration
├── snnbuilder_server.py               # MCP server for SNNbuilder SingleNeuron
├── neuroworkflow/                     # Minimal NeuroWorkflow implementation
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── node.py                    # Base node class
│   │   ├── schema.py                  # Schema definitions
│   │   └── port.py                    # Port system
│   └── nodes/
│       └── network/
│           ├── __init__.py
│           └── SNNbuilder_SingleNeuron.py  # SingleNeuron node
└── examples/
    ├── demo_interactions.py           # Example interactions
    └── generated_code_examples/       # Example generated code
```

## 🚀 Quick Start

### Option 1: All-in-One Notebook (Recommended)
1. Open `SETUP_AND_RUN.ipynb` in Jupyter
2. Follow the step-by-step instructions
3. Run all cells to see the complete demo

### Option 2: Manual Setup
1. Install dependencies: `pip install -r requirements.txt`
2. Configure API key in `key.json` (copy from `key_template.json`)
3. Run the MCP server: `python snnbuilder_server.py`
4. Use the client code to interact with the server

## 📋 Requirements

- Python 3.8+
- OpenAI API key (for LLM interactions)
- Optional: NEST Simulator (for full functionality)

## 🧠 Example Interactions

**User:** "How do I create a neuron?"
**LLM:** [Explains neuron creation with biological parameters]

**User:** "Create a pyramidal neuron for me"
**LLM:** [Creates Layer 2/3 pyramidal neuron with realistic parameters]

**User:** "Generate Python code for this neuron"
**LLM:** [Produces standalone NEST code]

## 🎓 Educational Value

This demo showcases the future of computational neuroscience:
- **Democratization**: Makes neuroscience accessible to non-experts
- **AI-Augmented Research**: Human expertise amplified by intelligent agents
- **Knowledge Transfer**: Learn through natural conversation
- **Reproducible Science**: Generated code is fully documented

## 🔧 Troubleshooting

- **No OpenAI API Key**: Update `key.json` with your API key
- **NEST Not Available**: Demo works in script-generation mode
- **Import Errors**: Ensure all dependencies are installed
- **MCP Connection Issues**: Check server startup logs

## 📚 Learn More

- **NeuroWorkflow**: Advanced computational neuroscience workflows
- **MCP Protocol**: Model Context Protocol for AI agent integration
- **SNNbuilder**: Spiking neural network builder with biological parameters

---

**Ready to explore AI-augmented neuroscience? Start with `SETUP_AND_RUN.ipynb`!** 🧠🤖