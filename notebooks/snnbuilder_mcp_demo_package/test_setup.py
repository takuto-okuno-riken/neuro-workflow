#!/usr/bin/env python3
"""
Test setup for SNNbuilder MCP Demo

This script verifies that all components are working correctly.
Run this before using the main demo notebook.
"""

import sys
import os
import json

def test_imports():
    """Test that all required imports work."""
    print("🔧 Testing imports...")
    
    try:
        # Test NeuroWorkflow components
        from neuroworkflow.nodes.network.SNNbuilder_SingleNeuron import SNNbuilder_SingleNeuron
        print("   ✅ NeuroWorkflow components imported successfully")
    except ImportError as e:
        print(f"   ❌ NeuroWorkflow import failed: {e}")
        return False
    
    try:
        # Test MCP components
        from mcp.server.fastmcp import FastMCP
        print("   ✅ MCP server components imported successfully")
    except ImportError as e:
        print(f"   ❌ MCP import failed: {e}")
        print("   💡 Try: pip install mcp")
        return False
    
    try:
        # Test OpenAI
        from openai import OpenAI
        print("   ✅ OpenAI client imported successfully")
    except ImportError as e:
        print(f"   ❌ OpenAI import failed: {e}")
        print("   💡 Try: pip install openai")
        return False
    
    return True

def test_node_creation():
    """Test that we can create and configure a neuron node."""
    print("\\n🧠 Testing neuron node creation...")
    
    try:
        from neuroworkflow.nodes.network.SNNbuilder_SingleNeuron import SNNbuilder_SingleNeuron
        
        # Create a test neuron
        neuron = SNNbuilder_SingleNeuron("test_neuron")
        print("   ✅ Neuron node created successfully")
        
        # Configure it
        neuron.configure(
            name="Test Neuron",
            cell_class="excitatory",
            nest_model="iaf_psc_alpha"
        )
        print("   ✅ Neuron configured successfully")
        
        # Test parameter validation
        if neuron.validate_parameters():
            print("   ✅ Parameter validation passed")
        else:
            print("   ❌ Parameter validation failed")
            return False
            
        return True
        
    except Exception as e:
        print(f"   ❌ Neuron creation failed: {e}")
        return False

def test_mcp_server():
    """Test that the MCP server can be imported and initialized."""
    print("\\n🔧 Testing MCP server...")
    
    try:
        # Test server import
        import snnbuilder_server
        print("   ✅ MCP server module imported successfully")
        
        # Test that tools are defined
        if hasattr(snnbuilder_server, 'mcp'):
            print("   ✅ MCP server instance found")
        else:
            print("   ❌ MCP server instance not found")
            return False
            
        return True
        
    except Exception as e:
        print(f"   ❌ MCP server test failed: {e}")
        return False

def test_config():
    """Test configuration files."""
    print("\\n⚙️  Testing configuration...")
    
    # Check for key template
    if os.path.exists('key_template.json'):
        print("   ✅ key_template.json found")
    else:
        print("   ❌ key_template.json not found")
        return False
    
    # Check if key.json exists and is configured
    if os.path.exists('key.json'):
        try:
            with open('key.json', 'r') as f:
                config = json.load(f)
            
            if config.get('OPENAI_API_KEY') == 'your-openai-api-key-here':
                print("   ⚠️  key.json exists but API key not configured")
                print("   💡 Update your API key in key.json")
            else:
                print("   ✅ key.json configured with API key")
        except Exception as e:
            print(f"   ❌ Error reading key.json: {e}")
            return False
    else:
        print("   ℹ️  key.json not found (will be created on first run)")
    
    return True

def test_nest_availability():
    """Test if NEST is available (optional)."""
    print("\\n🐦 Testing NEST availability (optional)...")
    
    try:
        import nest
        print("   ✅ NEST simulator available")
        print(f"   ℹ️  NEST version: {nest.version()}")
        return True
    except ImportError:
        print("   ⚠️  NEST simulator not available")
        print("   ℹ️  Demo will work in script-generation mode only")
        print("   💡 For full functionality: pip install nest-simulator")
        return True  # Not a failure, just limited functionality

def main():
    """Run all tests."""
    print("🧪 SNNbuilder MCP Demo - Setup Test")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_node_creation,
        test_mcp_server,
        test_config,
        test_nest_availability
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed! You're ready to run the demo.")
        print("\\n🚀 Next steps:")
        print("   1. Open SETUP_AND_RUN.ipynb in Jupyter")
        print("   2. Configure your OpenAI API key")
        print("   3. Run the interactive demos")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        print("\\n🔧 Common fixes:")
        print("   • Install missing packages: pip install -r requirements.txt")
        print("   • Configure API key in key.json")
        print("   • Check file permissions")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)