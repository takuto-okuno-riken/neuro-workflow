import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  BackgroundVariant,
  Connection,
  ReactFlowInstance,
  NodeMouseHandler,
  EdgeMouseHandler,
  NodeProps,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import {
  HStack,
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Text,
  useToast,
  VStack,
  Badge,
} from '@chakra-ui/react';
import { ViewIcon } from '@chakra-ui/icons';
import { CodeEditorModal } from './components/codeEditorModal';
import '@xyflow/react/dist/style.css';
import SideBoxArea from '../box/boxView';
import {SchemaFields,CalculationNodeData,Project,FlowData } from './type'
import { ProjectSelector } from './components/projectSelector';
import { EdgeMenu } from './components/edgeMenu';
import { NodeMenu } from './components/nodeMenu';
import {CalculationNode} from './components/calculationNode';
import {controlsStyle, minimapStyle} from './style';
import { createAuthHeaders } from '../../api/authHeaders';
import { useUploadedNodes } from '../../hooks/useUploadedNodes';
import NodeDetailsContent from './components/nodeDetailModal';

// nodeTypesをコンポーネント外で定義
const nodeTypes = {
  calculationNode: CalculationNode,
};

const HomeView = () => {
  const toast = useToast();
  const { data: uploadedNodes, isLoading: isNodesLoading, error } = useUploadedNodes();
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const { isOpen: isCodeOpen, onOpen: onCodeOpen, onClose: onCodeClose } = useDisclosure();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CalculationNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 自動保存関連の状態
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ノードメニュー関連の状態
  const [nodeMenuPosition, setNodeMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // エッジメニュー関連の状態
  const [edgeMenuPosition, setEdgeMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [selectedNode, setSelectedNode] = useState<Node<CalculationNodeData> | null>(null);

  // API通信用のヘルパー関数
  const createAuthHeadersLocal = async () => {
    return await createAuthHeaders();
  };

  // 接続状態を監視
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const headers = await createAuthHeaders();
        const response = await fetch('/api/workflow/', {
          method: 'HEAD',
          credentials: 'include',
          headers: {
            ...headers
          }
        });
        setIsConnected(response.ok);
      } catch (error) {
        setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // ノードの個別作成
  const createNodeAPI = async (nodeData: Node<CalculationNodeData>) => {
  if (!selectedProject || !autoSaveEnabled) {
    console.log('Skipping node creation API call:', { selectedProject, autoSaveEnabled });
    return;
  }

  console.log('Creating node via API:', nodeData);
  
  try {
    const headers = await createAuthHeadersLocal();
    const requestBody = {
      id: nodeData.id,
      position: nodeData.position,
      type: nodeData.type,
      data: nodeData.data,
    };
    
    console.log('Request body:', requestBody);
    
    const response = await fetch(`/api/workflow/${selectedProject}/nodes/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    console.log('Create node response:', responseData);

    if (!response.ok) {
      setIsConnected(false);
      throw new Error(`HTTP ${response.status}: ${responseData.error || 'Failed to create node'}`);
    }
    
    setIsConnected(true);
    console.log('Node created successfully:', responseData);
  } catch (error) {
    console.error('Error creating node:', error);
    setIsConnected(false);
    toast({
      title: "Save Error",
      description: `Failed to save node: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  }
};

  // ノードの個別更新
  const updateNodeAPI = async (nodeId: string, nodeData: Partial<Node<CalculationNodeData>>) => {
  if (!selectedProject || !autoSaveEnabled) {
    console.log('Skipping node update API call:', { selectedProject, autoSaveEnabled });
    return;
  }

  console.log('Updating node via API:', { nodeId, nodeData });

  try {
    const headers = await createAuthHeadersLocal();
    const requestBody = {
      position: nodeData.position,
      type: nodeData.type,
      data: nodeData.data,
    };
    
    console.log('Update request body:', requestBody);

    const response = await fetch(`/api/workflow/${selectedProject}/nodes/${nodeId}/`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    console.log('Update node response:', responseData);

    if (!response.ok) {
      setIsConnected(false);
      throw new Error(`HTTP ${response.status}: ${responseData.error || 'Failed to update node'}`);
    }
    
    setIsConnected(true);
  } catch (error) {
    console.error('Error updating node:', error);
    setIsConnected(false);
    toast({
      title: "Save Error",
      description: `Failed to update node: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: "error",
      duration: 2000,
      isClosable: true,
    });
  }
};

  const deleteNodeAPI = async (nodeId: string) => {
  if (!selectedProject || !autoSaveEnabled) {
    console.log('Skipping node deletion API call:', { selectedProject, autoSaveEnabled });
    return;
  }

  console.log('Deleting node via API:', nodeId);

  try {
    const headers = await createAuthHeadersLocal();
    const response = await fetch(`/api/workflow/${selectedProject}/nodes/${nodeId}/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        ...headers,
      },
    });

    // 204 No Content の場合はレスポンスボディがない
    let responseData;
    if (response.status !== 204) {
      responseData = await response.json();
      console.log('Delete node response:', responseData);
    }

    if (!response.ok) {
      setIsConnected(false);
      throw new Error(`HTTP ${response.status}: ${responseData?.error || 'Failed to delete node'}`);
    }
    
    setIsConnected(true);
    console.log('Node deleted successfully');
  } catch (error) {
    console.error('Error deleting node:', error);
    setIsConnected(false);
    toast({
      title: "Save Error",
      description: `Failed to delete node: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: "error",
      duration: 2000,
      isClosable: true,
    });
  }
};

  // エッジの個別作成
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const createEdgeAPI = async (edgeData: Edge) => {
    if (!selectedProject || !autoSaveEnabled) {
      console.log('Skipping edge creation API call:', { selectedProject, autoSaveEnabled });
      return;
    }

    console.log('Creating edge via API:', edgeData);

    try {
      const headers = await createAuthHeadersLocal();
      const requestBody = {
        id: edgeData.id,
        source: edgeData.source,
        target: edgeData.target,
        sourceHandle: edgeData.sourceHandle,
        targetHandle: edgeData.targetHandle,
        data: edgeData.data || {},
      };
      
      console.log('Edge request body:', requestBody);

      const response = await fetch(`/api/workflow/${selectedProject}/edges/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log('Create edge response:', responseData);

      if (!response.ok) {
        setIsConnected(false);
        throw new Error(`HTTP ${response.status}: ${responseData.error || 'Failed to create edge'}`);
      }
      
      setIsConnected(true);
    } catch (error) {
      console.error('Error creating edge:', error);
      setIsConnected(false);
      toast({
        title: "Save Error",
        description: `Failed to save connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // エッジの個別削除
  const deleteEdgeAPI = async (edgeId: string) => {
  if (!selectedProject || !autoSaveEnabled) {
    console.log('Skipping edge deletion API call:', { selectedProject, autoSaveEnabled });
    return;
  }

  console.log('Deleting edge via API:', edgeId);

  try {
    const headers = await createAuthHeadersLocal();
    const response = await fetch(`/api/workflow/${selectedProject}/edges/${edgeId}/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        ...headers,
      },
    });

    // 204 No Content または 200 OK の場合
    let responseData;
    if (response.status !== 204) {
      responseData = await response.json();
      console.log('Delete edge response:', responseData);
    }

    if (!response.ok) {
      setIsConnected(false);
      throw new Error(`HTTP ${response.status}: ${responseData?.error || 'Failed to delete edge'}`);
    }
    
    setIsConnected(true);
    console.log('Edge deleted successfully');
  } catch (error) {
    console.error('Error deleting edge:', error);
    setIsConnected(false);
    toast({
      title: "Save Error",
      description: `Failed to delete connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: "error",
      duration: 2000,
      isClosable: true,
    });
  }
};

  // デバウンスされた保存関数
  const debouncedSave = useCallback((action: () => Promise<void>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      await action();
    }, 500);
  }, []);

  // ノード変更のハンドラー（オーバーライド）
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    
    if (!autoSaveEnabled) return;
    
    changes.forEach((change) => {
      switch (change.type) {
        case 'position':
          if (change.position) {
            debouncedSave(() => updateNodeAPI(change.id, { 
              position: change.position 
            }));
          }
          break;
          
        case 'remove':
          deleteNodeAPI(change.id);
          break;
      }
    });
  }, [onNodesChange, debouncedSave, autoSaveEnabled]);

  // エッジ変更のハンドラー（オーバーライド）
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
    
    if (!autoSaveEnabled) return;
    
    changes.forEach((change) => {
      switch (change.type) {
        case 'remove':
          deleteEdgeAPI(change.id);
          break;
      }
    });
  }, [onEdgesChange, autoSaveEnabled]);

  // プロジェクト一覧を取得
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('Fetching projects...');
        const header = await createAuthHeaders();
        const response = await fetch('/api/workflow/', {
          credentials: 'include',
          headers: {
            ...header
          }
        });
        console.log('Projects response status:', response.status);
        
        if (response.ok) {
          const data: Project[] = await response.json();
          console.log('Projects data:', data);
          setProjects(data);
          setIsConnected(true);
        } else {
          console.error('Projects API failed with status:', response.status);
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        setIsConnected(false);
        toast({
          title: "Error",
          description: "Failed to fetch projects",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchProjects();
  }, [toast]);

  // プロジェクト選択時にフローデータを取得
  const handleProjectChange = async (projectId: string) => {
    if (!projectId) {
      setSelectedProject(null);
      setNodes([]);
      setEdges([]);
      return;
    }

    setIsLoading(true);
    try {
      const header = await createAuthHeaders();
      const response = await fetch(`/api/workflow/${projectId}/flow/`, {
        credentials: 'include',
        headers:{
          ...header
        }
      });
      if (response.ok) {
        const flowData: FlowData = await response.json();

        setNodes(flowData.nodes as Node<CalculationNodeData>[] || []);
        setEdges(flowData.edges || []);
        setSelectedProject(projectId);
        setIsConnected(true);
        
        toast({
          title: "Loaded",
          description: "Flow data loaded successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Failed to fetch flow data:', error);
      setIsConnected(false);
      toast({
        title: "Error",
        description: "Failed to load flow data",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 接続時のハンドラー（エッジ作成） - タイプチェック付き
  const onConnect = useCallback(
    (params: Connection) => {
      // ハンドルIDからタイプ情報を直接抽出
      // フォーマット: {nodeId}-{portName}-{portDirection}-{type}
      let sourceType = null;
      let targetType = null;
      let sourcePortName = null;
      let targetPortName = null;
      
      if (params.sourceHandle) {
        const sourceParts = params.sourceHandle.split('-');
        // 最後がtype
        sourceType = sourceParts[sourceParts.length - 1];
        // 最後から2番目がport_direction
        const sourcePortDirection = sourceParts[sourceParts.length - 2];
        // nodeIdとport_directionとtypeを除いた部分がポート名
        sourcePortName = sourceParts.slice(1, -2).join('-');
        
        console.log('Source handle parsing:', {
          handle: params.sourceHandle,
          portName: sourcePortName,
          portDirection: sourcePortDirection,
          type: sourceType
        });
      }
      
      if (params.targetHandle) {
        const targetParts = params.targetHandle.split('-');
        // 最後がtype
        targetType = targetParts[targetParts.length - 1];
        // 最後から2番目がport_direction
        const targetPortDirection = targetParts[targetParts.length - 2];
        // nodeIdとport_directionとtypeを除いた部分がポート名
        targetPortName = targetParts.slice(1, -2).join('-');
        
        console.log('Target handle parsing:', {
          handle: params.targetHandle,
          portName: targetPortName,
          portDirection: targetPortDirection,
          type: targetType
        });
      }
      
      // タイプが取得できない場合
      if (!sourceType || !targetType) {
        toast({
          title: "Connection Failed",
          description: "Could not determine port types",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // タイプが一致しているかチェック（大文字小文字を無視）
      if (sourceType.toUpperCase() !== targetType.toUpperCase()) {
        toast({
          title: "Type Mismatch",
          description: `Cannot connect: ${sourcePortName || 'output'} (${sourceType}) and ${targetPortName || 'input'} (${targetType}) have different types`,
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        console.warn(
          `Type mismatch: ${sourcePortName} (${sourceType}) → ${targetPortName} (${targetType})`
        );
        return;
      }
      
      // タイプが一致している場合は接続を作成
      const edgeId = `${params.source}-${params.sourceHandle || 'output'}-to-${params.target}-${params.targetHandle || 'input'}`;
      
      const newEdge = { 
        id: edgeId,
        ...params, 
        style: { stroke: '#8b5cf6', strokeWidth: 2 }
      };
      
      console.log('Creating new edge:', {
        edge: newEdge,
        sourcePort: `${sourcePortName} (${sourceType})`,
        targetPort: `${targetPortName} (${targetType})`,
        typesMatch: true
      });
      
      setEdges((eds) => {
        const updatedEdges = addEdge(newEdge, eds);
        console.log('Updated edges state:', updatedEdges.length);
        return updatedEdges;
      });

      // APIに送信（非同期で実行）
      if (autoSaveEnabled) {
        console.log('Calling createEdgeAPI...');
        createEdgeAPI(newEdge).then(() => {
          console.log('Edge creation API call completed');
        });
      } else {
        console.log('Auto-save disabled, skipping edge API call');
      }
      
      toast({
        title: "Connected",
        description: `Connected ${sourcePortName || 'output'} (${sourceType}) → ${targetPortName || 'input'} (${targetType})`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    },
    [setEdges, toast, autoSaveEnabled, createEdgeAPI],
  );


  const onNodeClick: NodeMouseHandler<Node<CalculationNodeData>> = useCallback((event, node) => {
    event.preventDefault();
    
    setNodeMenuPosition({
      x: event.clientX,
      y: event.clientY,
    });

    console.log("クリックしたぞね", node)

    setSelectedNodeId(node.id);
    setSelectedNode(node);
  }, []);

  const onEdgeClick: EdgeMouseHandler = useCallback((event, edge) => {
    event.preventDefault();
    
    setEdgeMenuPosition({
      x: event.clientX,
      y: event.clientY,
    });
    
    setSelectedEdgeId(edge.id);
  }, []);

  const closeMenu = useCallback(() => {
    setNodeMenuPosition(null);
    setSelectedNodeId(null);
    setEdgeMenuPosition(null);
    setSelectedEdgeId(null);
  }, []);

  const onPaneClick = useCallback(() => {
    closeMenu();
  }, [closeMenu]);

  // キーボードイベントハンドラー（削除処理）
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedEdges = edges.filter(edge => edge.selected);
        if (selectedEdges.length > 0) {
          event.preventDefault();
          if (autoSaveEnabled) {
            selectedEdges.forEach(edge => {
              deleteEdgeAPI(edge.id);
            });
          }
          setEdges((eds) => eds.filter(edge => !edge.selected));
          
          toast({
            title: "Deleted",
            description: `${selectedEdges.length} edge(s) deleted`,
            status: "info",
            duration: 2000,
            isClosable: true,
          });
        }
        
        const selectedNodes = nodes.filter(node => node.selected);
        if (selectedNodes.length > 0) {
          event.preventDefault();
          const nodeIds = selectedNodes.map(node => node.id);
          
          if (autoSaveEnabled) {
            selectedNodes.forEach(node => {
              deleteNodeAPI(node.id);
            });
            
            const relatedEdges = edges.filter(
              (edge) => nodeIds.includes(edge.source) || nodeIds.includes(edge.target)
            );
            relatedEdges.forEach(edge => {
              deleteEdgeAPI(edge.id);
            });
          }
          
          setNodes((nds) => nds.filter(node => !node.selected));
          setEdges((eds) => eds.filter(
            (edge) => !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)
          ));
          
          toast({
            title: "Deleted",
            description: `${selectedNodes.length} node(s) deleted`,
            status: "info",
            duration: 2000,
            isClosable: true,
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [nodes, edges, setNodes, setEdges, toast, autoSaveEnabled]);

  // ノード削除処理（メニューから）
  const handleDeleteNode = useCallback(() => {
    if (selectedNodeId) {
      if (autoSaveEnabled) {
        deleteNodeAPI(selectedNodeId);
      }
      
      setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
      setEdges((eds) => {
        const relatedEdges = eds.filter(
          (edge) => edge.source === selectedNodeId || edge.target === selectedNodeId
        );
        
        if (autoSaveEnabled) {
          relatedEdges.forEach(edge => {
            deleteEdgeAPI(edge.id);
          });
        }
        
        return eds.filter(
          (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId
        );
      });
      
      toast({
        title: "Deleted",
        description: `Node ${selectedNodeId} deleted`,
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    }
  }, [selectedNodeId, setNodes, setEdges, toast, autoSaveEnabled]);

  // エッジ削除処理（メニューから）
  const handleDeleteEdge = useCallback(() => {
    if (selectedEdgeId) {
      if (autoSaveEnabled) {
        deleteEdgeAPI(selectedEdgeId);
      }
      
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdgeId));
      
      toast({
        title: "Deleted",
        description: `Connection deleted`,
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    }
  }, [selectedEdgeId, setEdges, toast, autoSaveEnabled]);


    const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowInstance.current) {
        console.log('ReactFlow instance not ready');
        return;
      }

      if (!selectedProject) {
        console.log('No project selected');
        toast({
          title: "No Project",
          description: "Please select a project first",
          status: "warning",
          duration: 2000,
          isClosable: true,
        });
        return;
      }

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const nodeDataString = event.dataTransfer.getData('application/nodedata');
      let nodeData;
      try {
        nodeData = JSON.parse(nodeDataString);
      } catch (error) {
        console.error('Invalid node data:', error);
        return;
      }

      if (!nodeData) {
        console.log('No node data received');
        return;
      }

      console.log('====================================');
      console.log('🔄 NEW DROP EVENT');
      console.log('Dropped nodeData:', nodeData);
      console.log('NodeData ID:', nodeData.id);
      console.log('NodeData Label:', nodeData.label);
      console.log('====================================');
      
      let schema: SchemaFields = {
        inputs: {},
        outputs: {},
        parameters: {},
        methods: {}
      };
      let nodeType = 'calculationNode';
      let label = nodeData.label || nodeData.name || 'New Calculator';
      let fileName: string = ""
      // uploadedNodesから該当するノードのスキーマを取得
      if (uploadedNodes?.nodes && Array.isArray(uploadedNodes.nodes)) {
        console.log('Available nodes in uploadedNodes:', uploadedNodes.nodes.length);
        
        // マッチング処理
        let matchedNode: UploadedNode | null = null;
        
        // IDで完全一致を試みる
        if (nodeData.id) {
          matchedNode = uploadedNodes.nodes.find((node: UploadedNode) => node.id === nodeData.id);
          if (matchedNode) {
            console.log('✅ Matched by ID:', nodeData.id);
          }
        }
        
        // IDでマッチしない場合、ラベルで試みる
        if (!matchedNode && nodeData.label) {
          matchedNode = uploadedNodes.nodes.find((node: UploadedNode) => node.label === nodeData.label);
          if (matchedNode) {
            console.log('✅ Matched by label:', nodeData.label);
          }
        }
        
        // それでもマッチしない場合、nameで試みる
        if (!matchedNode && nodeData.name) {
          matchedNode = uploadedNodes.nodes.find((node: UploadedNode) => node.name === nodeData.name);
          if (matchedNode) {
            console.log('✅ Matched by name:', nodeData.name);
          }
        }
        
        if (matchedNode && matchedNode.schema) {
          console.log('📋 Processing schema for:', matchedNode.label);
          console.log('Original schema structure:', matchedNode.schema);
          
          // 新しい構造のスキーマをそのまま使用
          schema = matchedNode.schema;
          
          // スキーマの内容を確認
          const inputCount = schema.inputs ? Object.keys(schema.inputs).length : 0;
          const outputCount = schema.outputs ? Object.keys(schema.outputs).length : 0;
          const paramCount = schema.parameters ? Object.keys(schema.parameters).length : 0;
          const methodCount = schema.methods ? Object.keys(schema.methods).length : 0;
          
          console.log(`✅ Schema loaded: ${inputCount} inputs, ${outputCount} outputs, ${paramCount} parameters, ${methodCount} methods`);
          
          // デフォルトスキーマが必要な場合
          if (inputCount === 0 && outputCount === 0) {
            console.warn('⚠️ No ports found, using default schema');
            schema = {
              inputs: {
                "default_input": {
                  name: "default_input",
                  type: "any",
                  description: "Default input",
                  port_direction: "input"
                }
              },
              outputs: {
                "default_output": {
                  name: "default_output",
                  type: "any",
                  description: "Default output",
                  port_direction: "output"
                }
              },
              parameters: {},
              methods: {}
            };
          }
          
          // matchedNodeから正しいラベルとタイプを取得
          nodeType = matchedNode.nodeType || matchedNode.type || 'calculationNode';
          label = matchedNode.label || matchedNode.name || label;
          fileName = matchedNode.file_name || ""  
        } else {
          console.log('❌ No matching node found, using fallback schema');
          // フォールバックスキーマ
          schema = {
            inputs: {
              "input": {
                name: "input",
                type: "any",
                description: "Input",
                port_direction: "input"
              }
            },
            outputs: {
              "output": {
                name: "output",
                type: "any",
                description: "Output",
                port_direction: "output"
              }
            },
            parameters: {},
            methods: {}
          };
        }
      } else {
        console.warn('❌ uploadedNodes not available, using default schema');
      }

      // 新しいIDを生成
      const newNodeId = `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newNode: Node<CalculationNodeData> = {
        id: newNodeId,
        type: 'calculationNode',
        position,
        data: { 
          file_name: fileName,
          label: label,
          schema: schema,
          nodeType: nodeType
        },
      };

      console.log('🎯 Creating NEW node:');
      console.log('ノードデータ', newNode)
      console.log('  ID:', newNodeId);
      console.log('  Label:', label);
      console.log('  Schema:', schema);
       console.log(' file name:', fileName);
      console.log('====================================');

      // UIの更新
      setNodes((nds) => {
        const updated = nds.concat(newNode);
        console.log('Total nodes after adding:', updated.length);
        return updated;
      });

      // APIに送信
      if (autoSaveEnabled) {
        createNodeAPI(newNode);
      }
      
      // カウント計算（新しい構造に対応）
      const inputCount = schema.inputs ? Object.keys(schema.inputs).length : 0;
      const outputCount = schema.outputs ? Object.keys(schema.outputs).length : 0;
      
      toast({
        title: "Node Added",
        description: `"${label}" (${inputCount} inputs, ${outputCount} outputs)`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    },
    [setNodes, toast, selectedProject, autoSaveEnabled, uploadedNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);


  const handleViewCode = useCallback(() => {
    if (!selectedProject) {
      toast({
        title: "No Project Selected",
        description: "Please select a project first",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    onCodeOpen();
  }, [selectedProject, onCodeOpen, toast]);


  // クリーンアップ
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <HStack>
      <SideBoxArea 
        nodes={uploadedNodes} 
        isLoading={isNodesLoading}  // ノード専用
        error={error} 
      />
      <div style={{ width: '98.5vw', height: '92vh', marginLeft: '300px', position: 'relative' }}>
        <style>
          {`
            .react-flow__controls {
              background: transparent;
            }
            
            .react-flow__controls-button {
              background: white;
              border: 1px solid #e2e8f0;
              color: #4a5568;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .react-flow__controls-button:hover {
              background: #f7fafc;
              border-color: #cbd5e0;
            }
            
            .react-flow__controls-button svg {
              fill: #4a5568;
            }
            
            .react-flow__minimap {
              background-color: #f8f9fa;
              border: 1px solid #e2e8f0;
            }
            
            .react-flow__minimap-mask {
              fill: rgba(50, 50, 50, 0.8);
            }
            
            .react-flow__minimap-node {
              fill: #8b5cf6;
              stroke: #7c3aed;
            }
          `}
        </style>
        
        {/* プロジェクト選択UI */}
        <ProjectSelector
          projects={projects}
          selectedProject={selectedProject}
          onProjectChange={handleProjectChange}
          autoSaveEnabled={autoSaveEnabled}
          isConnected={isConnected}
        />
        
        {/* 説明 */}
        <Box
          position="absolute"
          top="10px"
          right="10px"
          p={4}
          bg="white"
          borderRadius="lg"
          boxShadow="lg"
          maxWidth="340px"
          zIndex={5}
          borderWidth={1}
          borderColor="gray.200"
        >
  <VStack spacing={4} align="stretch">
    {/* ヘッダー */}
    <HStack justify="space-between" align="center">
      <Text fontWeight="bold" fontSize="md" color="gray.800">
        🔬 Flow Designer
      </Text>
      {isConnected ? (
        <Badge colorScheme="green" size="sm" variant="subtle">
          Online
        </Badge>
      ) : (
        <Badge colorScheme="red" size="sm" variant="subtle">
          Offline
        </Badge>
      )}
    </HStack>
    
    {/* 説明文 */}
          <Box>
            <Text fontSize="sm" color="gray.600" lineHeight="1.4">
              Drag nodes from the left panel to build mathematical workflows. Connect outputs to inputs to create calculations.
            </Text>
          </Box>
          
          {/* Tips & Status */}
          <Box>
            <Text fontSize="xs" color="blue.600" mb={1}>
              💡 Tips: Click edges to delete • Press Delete key for selected items
            </Text>
            {!autoSaveEnabled && (
              <Text fontSize="xs" color="orange.600">
                ⚠️ Auto-save disabled
              </Text>
            )}
          </Box>
          
          {/* Action Buttons */}
          <VStack spacing={2} align="stretch">
            <Button
              leftIcon={<ViewIcon />}
              colorScheme="purple"
              variant="outline"
              size="sm"
              onClick={handleViewCode}
              isDisabled={!selectedProject}
              _hover={{ bg: "purple.50", transform: "translateY(-1px)" }}
              _disabled={{ 
                opacity: 0.4,
                cursor: "not-allowed"
              }}
              transition="all 0.2s"
            >
              {selectedProject ? "🚀 View Generated Code" : "Select Project First"}
            </Button>
            
            {selectedProject && (
              <Text fontSize="xs" color="gray.500" textAlign="center">
                Project: {projects.find(p => p.id === selectedProject)?.name || 'Unknown'}
              </Text>
            )}
          </VStack>
        </VStack>
      </Box>
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes} 
          fitView
          attributionPosition="bottom-left"
          connectionLineStyle={{ stroke: '#8b5cf6', strokeWidth: 2 }}
          defaultEdgeOptions={{
            style: { stroke: '#8b5cf6', strokeWidth: 2 },
            type: 'default',
          }}
        >
          <Controls {...controlsStyle} />
          <MiniMap {...minimapStyle} />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#cbd5e0" />
        </ReactFlow>
        
        {isLoading && (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            bg="white"
            p={4}
            borderRadius="md"
            boxShadow="lg"
            zIndex={1000}
          >
            <Text>Loading...</Text>
          </Box>
        )}
        
        {/* ノードメニュー */}
        {nodeMenuPosition && (
          <NodeMenu
            position={nodeMenuPosition}
            onDelete={handleDeleteNode}
            onView={onViewOpen}
            onEdit={onEditOpen}
            onClose={closeMenu}
          />
        )}
        
        {/* エッジメニュー */}
        {edgeMenuPosition && (
          <EdgeMenu
            position={edgeMenuPosition}
            onDelete={handleDeleteEdge}
            onClose={closeMenu}
          />
        )}
        
        {/* View Modal */}
        <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
          <ModalOverlay />
          <ModalContent maxW="1200px" w="90vw">
            <ModalHeader>Node Details: {selectedNode?.data.label}</ModalHeader>
            <ModalCloseButton />
            <ModalBody marginTop={5}>
              {/* ここに新しいコンポーネントを入れる */}
              <NodeDetailsContent  nodeData={selectedNode}/>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={onViewClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>


        <CodeEditorModal
          isOpen={isCodeOpen}
          onClose={onCodeClose}
          identifier={selectedProject}
          endpoints={{
            getCode: '/workflow/{identifier}/code/',
            saveCode: '/workflow/{identifier}/code/',
            executeCode: '/workflow/{identifier}/execute/'
          }}
          title="Workflow Editor"
          showExecute={true}
        />
      </div>
    </HStack>
  );
}
//http://localhost:3000/api/workflow/${projectId}/code/

export default HomeView;
