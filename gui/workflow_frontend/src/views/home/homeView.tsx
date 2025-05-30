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
  MiniMapProps,
  ControlProps,
  ReactFlowInstance,
  NodeMouseHandler,
  Handle,
  Position,
  NodeProps,
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Select,
  Input,
  FormControl,
  FormLabel,
  Flex,
  IconButton,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, CheckIcon } from '@chakra-ui/icons';
import '@xyflow/react/dist/style.css';
import SideBoxArea from '../box/boxView';

// 型定義
interface SchemaField {
  title: string;
  type: string;
  description?: string;
}

interface CalculationNodeData {
  label: string;
  schema: SchemaField[];
  nodeType?: string;
  operation?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface FlowData {
  nodes: Node[];
  edges: Edge[];
}

// 計算ノードのカスタムコンポーネント
const CalculationNode = ({ data, isConnectable }: NodeProps<CalculationNodeData>) => {
  const schema = data.schema || [];
  
  return (
    <Box
      bg="white"
      border="2px solid #e2e8f0"
      borderRadius="lg"
      minWidth="200px"
      maxWidth="280px"
      boxShadow="md"
      _hover={{ boxShadow: "lg" }}
      position="relative"
    >
      {/* ヘッダー */}
      <Box 
        bg="purple.500" 
        color="white" 
        p={2} 
        borderTopRadius="lg"
        fontWeight="bold"
        textAlign="center"
        fontSize="sm"
      >
        {data.label}
      </Box>
      
      {/* パラメータ・結果 */}
      <Box p={0}>
        {schema.map((field, index) => (
          <Box
            key={index}
            position="relative"
            py={1.5}
            px={2}
            borderBottom={index < schema.length - 1 ? "1px solid #e2e8f0" : "none"}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            minHeight="28px"
            bg={field.title === 'result' ? 'green.50' : 'gray.50'}
          >
            <Text fontSize="xs" fontWeight="medium">{field.title}</Text>
            <Badge 
              colorScheme={field.type === 'number' ? 'blue' : 'gray'} 
              size="sm"
              fontSize="10px"
            >
              {field.type}
            </Badge>
            
            {/* 入力パラメータの場合は左側にハンドル */}
            {field.title !== 'result' && (
              <Handle
                type="target"
                position={Position.Left}
                id={`${field.title}-input`}
                style={{
                  background: '#e53e3e',
                  border: '2px solid #fff',
                  width: 10,
                  height: 10,
                  left: -5,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  position: 'absolute',
                }}
                isConnectable={isConnectable}
              />
            )}
            
            {/* 結果の場合は右側にハンドル */}
            {field.title === 'result' && (
              <Handle
                type="source"
                position={Position.Right}
                id={`${field.title}-output`}
                style={{
                  background: '#38a169',
                  border: '2px solid #fff',
                  width: 10,
                  height: 10,
                  right: -5,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  position: 'absolute',
                }}
                isConnectable={isConnectable}
              />
            )}
            
            {/* 値出力ノードの場合は右側にハンドル */}
            {field.title === 'value' && (
              <Handle
                type="source"
                position={Position.Right}
                id={`${field.title}-output`}
                style={{
                  background: '#38a169',
                  border: '2px solid #fff',
                  width: 10,
                  height: 10,
                  right: -5,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  position: 'absolute',
                }}
                isConnectable={isConnectable}
              />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const controlsStyle: Partial<ControlProps> = {
  style: {
    background: 'transparent',
  },
  showZoom: true,
  showFitView: true,
  showInteractive: true,
};

const minimapStyle: Partial<MiniMapProps> = {
  style: {
    background: '#f8f9fa',
    border: '1px solid #e2e8f0',
  },
  maskColor: 'rgb(50, 50, 50, 0.8)',
  nodeColor: '#8b5cf6',
};

// ノードメニューコンポーネント
const NodeMenu = ({ 
  position, 
  onDelete, 
  onView, 
  onEdit, 
  onClose 
}: {
  position: { x: number, y: number },
  onDelete: () => void,
  onView: () => void,
  onEdit: () => void,
  onClose: () => void,
}) => {
  return (
    <Box
      position="fixed" 
      left={`${position.x}px`}
      top={`${position.y}px`}
      zIndex={1000}
      bg="white"
      border="1px solid #e2e8f0"
      borderRadius="md"
      boxShadow="lg"
      width="120px"
      overflow="hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        width="100%"
        justifyContent="flex-start"
        borderRadius="0"
        variant="ghost"
        size="sm"
        onClick={() => {
          onView();
          onClose();
        }}
      >
        View
      </Button>
      <Button
        width="100%"
        justifyContent="flex-start"
        borderRadius="0"
        variant="ghost"
        size="sm"
        onClick={() => {
          onEdit();
          onClose();
        }}
      >
        Edit
      </Button>
      <Button
        width="100%"
        justifyContent="flex-start"
        borderRadius="0"
        variant="ghost"
        size="sm"
        colorScheme="red"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        Delete
      </Button>
    </Box>
  );
};

// プロジェクト選択コンポーネント
const ProjectSelector = ({ 
  projects, 
  selectedProject, 
  onProjectChange, 
  onSave, 
  isSaving 
}: {
  projects: Project[];
  selectedProject: string | null;
  onProjectChange: (projectId: string) => void;
  onSave: () => void;
  isSaving: boolean;
}) => {
  return (
    <Box
      position="absolute"
      top="10px"
      left="10px"
      p={4}
      bg="white"
      borderRadius="md"
      boxShadow="md"
      zIndex={5}
      minWidth="300px"
    >
      <Flex align="center" gap={3}>
        <FormControl>
          <FormLabel fontSize="sm" mb={1}>Project</FormLabel>
          <Select 
            value={selectedProject || ''} 
            onChange={(e) => onProjectChange(e.target.value)}
            size="sm"
          >
            <option value="">Select Project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </FormControl>
        <IconButton
          icon={<CheckIcon />}
          colorScheme="blue"
          size="sm"
          onClick={onSave}
          isLoading={isSaving}
          isDisabled={!selectedProject}
          aria-label="Save"
        />
      </Flex>
    </Box>
  );
};

// nodeTypesをコンポーネント外で定義
const nodeTypes = {
  calculationNode: CalculationNode,
};

// API Base URL を環境変数から取得（今は使わない）
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const HomeView = () => {
  const toast = useToast();

  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CalculationNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [selectedNode, setSelectedNode] = useState<Node<CalculationNodeData> | null>(null);
  const [editingSchema, setEditingSchema] = useState<SchemaField[]>([]);

  // プロジェクト一覧を取得
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('Fetching projects...'); // デバッグ用
        const response = await fetch('/api/workflow/', {
          credentials: 'include',  // Cookie（セッション）を含める
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        console.log('Projects response status:', response.status); // デバッグ用
        console.log('Projects response headers:', response.headers.get('content-type')); // デバッグ用
        
        if (response.ok) {
          const data: Project[] = await response.json();
          console.log('Projects data:', data); // デバッグ用
          setProjects(data);
        } else {
          console.error('Projects API failed with status:', response.status);
          const text = await response.text();
          console.error('Response text:', text.substring(0, 200)); // 最初の200文字だけ表示
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
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
      const response = await fetch(`http://localhost:3000/api/workflow/${projectId}/flow/`, {
        credentials: 'include',  // Cookie（セッション）を含める
      });
      if (response.ok) {
        const flowData: FlowData = await response.json();
        setNodes(flowData.nodes as Node<CalculationNodeData>[] || []);
        setEdges(flowData.edges || []);
        setSelectedProject(projectId);
        
        toast({
          title: "Loaded",
          description: "Flow data loaded successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch flow data:', error);
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

  // フローデータを保存
  const handleSave = async () => {
    if (!selectedProject) return;

    setIsSaving(true);
    try {
      const response = await fetch(`http://localhost:3000/api/workflow/${selectedProject}/flow/`, {
        method: 'PUT',
        credentials: 'include',  // Cookie（セッション）を含める
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes,
          edges,
        }),
      });

      if (response.ok) {
        toast({
          title: "Saved",
          description: "Flow data saved successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Failed to save flow:', error);
      toast({
        title: "Error",
        description: "Failed to save",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = { 
        ...params, 
        style: { stroke: '#8b5cf6', strokeWidth: 2 }
      };
      setEdges((eds) => addEdge(newEdge, eds));
      
      toast({
        title: "Connected",
        description: `Created connection between calculation nodes`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    },
    [setEdges, toast],
  );

  const onNodeClick: NodeMouseHandler<Node<CalculationNodeData>> = useCallback((event, node) => {
    event.preventDefault();
    
    setMenuPosition({
      x: event.clientX,
      y: event.clientY,
    });
    
    setSelectedNodeId(node.id);
    setSelectedNode(node);
    setEditingSchema([...node.data.schema]);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuPosition(null);
    setSelectedNodeId(null);
  }, []);

  const onPaneClick = useCallback(() => {
    closeMenu();
  }, [closeMenu]);

  // ノード削除処理
  const handleDeleteNode = useCallback(() => {
    if (selectedNodeId) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
      setEdges((eds) => eds.filter(
        (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId
      ));
      
      toast({
        title: "Deleted",
        description: `Node ${selectedNodeId} deleted`,
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    }
  }, [selectedNodeId, setNodes, setEdges, toast]);

  // スキーマ編集
  const handleSchemaChange = (index: number, field: keyof SchemaField, value: string) => {
    const newSchema = [...editingSchema];
    newSchema[index] = { ...newSchema[index], [field]: value };
    setEditingSchema(newSchema);
  };

  const addSchemaField = () => {
    setEditingSchema([...editingSchema, { title: '', type: 'number' }]);
  };

  const removeSchemaField = (index: number) => {
    const newSchema = editingSchema.filter((_, i) => i !== index);
    setEditingSchema(newSchema);
  };

  const saveSchemaChanges = () => {
    if (selectedNode) {
      setNodes((nds) => 
        nds.map((node) => 
          node.id === selectedNode.id 
            ? { ...node, data: { ...node.data, schema: editingSchema } }
            : node
        )
      );
      
      toast({
        title: "Updated",
        description: "Schema updated successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
    onEditClose();
  };

  // ドロップ処理
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowInstance.current) return;

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

      if (!nodeData) return;

      // ノードタイプに基づいてスキーマを決定（強制的に正しいスキーマを設定）
      let schema: SchemaField[] = [];
      let nodeType = 'calculationNode';

      // ラベルで判定して強制的に正しいスキーマを設定
      if (nodeData.label.includes('Number A') || nodeData.label.includes('Number B')) {
        schema = [{ title: 'value', type: 'number', description: 'Input value' }];
        nodeType = 'NumberInput';
      } else if (nodeData.label.includes('Addition')) {
        schema = [
          { title: 'a', type: 'number', description: 'First number' },
          { title: 'b', type: 'number', description: 'Second number' },
          { title: 'result', type: 'number', description: 'Sum result' }
        ];
      } else if (nodeData.label.includes('Subtraction')) {
        schema = [
          { title: 'a', type: 'number', description: 'First number' },
          { title: 'b', type: 'number', description: 'Second number' },
          { title: 'result', type: 'number', description: 'Difference result' }
        ];
      } else if (nodeData.label.includes('Multiplication')) {
        schema = [
          { title: 'a', type: 'number', description: 'First number' },
          { title: 'b', type: 'number', description: 'Second number' },
          { title: 'result', type: 'number', description: 'Product result' }
        ];
      } else if (nodeData.label.includes('Division')) {
        schema = [
          { title: 'a', type: 'number', description: 'Dividend' },
          { title: 'b', type: 'number', description: 'Divisor' },
          { title: 'result', type: 'number', description: 'Quotient result' }
        ];
      } else {
        // デフォルト：汎用計算ノード
        schema = [
          { title: 'input', type: 'number', description: 'Input value' },
          { title: 'result', type: 'number', description: 'Output result' }
        ];
      }

      console.log(`Creating node with label: ${nodeData.label}, schema:`, schema); // デバッグ用

      const newNode: Node<CalculationNodeData> = {
        id: `calc_${Date.now()}`,
        type: 'calculationNode',
        position,
        data: { 
          label: nodeData.label || 'New Calculator',
          schema: schema,
          nodeType: nodeType
        },
      };

      setNodes((nds) => nds.concat(newNode));
      
      toast({
        title: "Node Added",
        description: `New calculation node "${nodeData.label}" added`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    },
    [setNodes, toast]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  const handleViewEditClick = useCallback(() => {
    onViewClose();
    onEditOpen();
  }, [onViewClose, onEditOpen]);

  // サンプルノードテンプレートを取得
  interface NodeTemplate {
    id: string;
    type: string;
    label: string;
    icon: any;
    description: string;
    category: string;
  }

  const [nodeTemplates, setNodeTemplates] = useState<{ nodes: NodeTemplate[] }>({ nodes: [] });

  useEffect(() => {
    const fetchSampleFlow = async () => {
      try {
        console.log('Fetching sample flow data...'); // デバッグ用
        const response = await fetch('/api/workflow/sample-flow/', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        console.log('Response status:', response.status); // デバッグ用
        console.log('Response headers:', response.headers.get('content-type')); // デバッグ用
        
        if (response.ok) {
          const sampleData: FlowData = await response.json();
          console.log('Sample data received:', sampleData); // デバッグ用
          console.log('First node schema:', sampleData.nodes[0]?.data); // 最初のノードのデータを詳しく確認
          
          // サンプルデータからノードテンプレートを作成
          const templates: NodeTemplate[] = sampleData.nodes.map(node => {
            const nodeData = node.data as CalculationNodeData;
            console.log(`Node ${node.id} data:`, nodeData); // 各ノードのデータを確認
            return {
              id: node.id,
              type: 'calculationNode',
              label: nodeData.label,
              icon: null,
              description: nodeData.schema ? `${nodeData.schema.length} parameters` : 'Calculation node',
              category: nodeData.label.includes('Number') ? 'Input Nodes' : 'Calculation Nodes'
            };
          });
          
          console.log('Generated templates:', templates); // デバッグ用
          setNodeTemplates({ nodes: templates });
        } else {
          console.warn('Sample flow API returned non-OK status:', response.status);
          setNodeTemplates({ nodes: getDefaultTemplates() });
        }
      } catch (error) {
        console.error('Failed to fetch sample flow:', error);
        setNodeTemplates({ nodes: getDefaultTemplates() });
      }
    };

    // デフォルトテンプレートを返す関数
    const getDefaultTemplates = (): NodeTemplate[] => [
      {
        id: 'number-input',
        type: 'calculationNode',
        label: 'Number Input',
        icon: null,
        description: 'Input number value',
        category: 'Input Nodes'
      },
      {
        id: 'addition',
        type: 'calculationNode',
        label: 'Addition',
        icon: null,
        description: 'Add two numbers',
        category: 'Calculation Nodes'
      },
      {
        id: 'subtraction',
        type: 'calculationNode',
        label: 'Subtraction',
        icon: null,
        description: 'Subtract two numbers',
        category: 'Calculation Nodes'
      },
      {
        id: 'multiplication',
        type: 'calculationNode',
        label: 'Multiplication',
        icon: null,
        description: 'Multiply two numbers',
        category: 'Calculation Nodes'
      },
      {
        id: 'division',
        type: 'calculationNode',
        label: 'Division',
        icon: null,
        description: 'Divide two numbers',
        category: 'Calculation Nodes'
      }
    ];

    fetchSampleFlow();
  }, []);

  return (
    <HStack>
      <SideBoxArea nodes={nodeTemplates} />
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
          onSave={handleSave}
          isSaving={isSaving}
        />
        
        {/* 説明 */}
        <Box
          position="absolute"
          top="10px"
          right="10px"
          p={3}
          bg="white"
          borderRadius="md"
          boxShadow="md"
          maxWidth="300px"
          zIndex={5}
        >
          <Text fontWeight="bold" fontSize="sm">Calculation Flow Designer</Text>
          <Text fontSize="xs" color="gray.600">
            Drag and drop calculation nodes from the left panel to create mathematical workflows. Connect outputs to inputs to build complex calculations.
          </Text>
        </Box>
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes} 
          fitView
          attributionPosition="bottom-left"
          connectionLineStyle={{ stroke: '#8b5cf6', strokeWidth: 2 }}
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
        {menuPosition && (
          <NodeMenu
            position={menuPosition}
            onDelete={handleDeleteNode}
            onView={onViewOpen}
            onEdit={onEditOpen}
            onClose={closeMenu}
          />
        )}
        
        {/* View Modal */}
        <Modal isOpen={isViewOpen} onClose={onViewClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Node Details: {selectedNode?.data.label}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold">Node Name: {selectedNode?.data.label}</Text>
                  <Text>ID: {selectedNode?.id}</Text>
                  <Text>Type: {selectedNode?.data.nodeType || 'Calculation'}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold" mb={2}>Parameters & Results</Text>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Parameter</Th>
                        <Th>Data Type</Th>
                        <Th>Description</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {selectedNode?.data.schema?.map((field, index) => (
                        <Tr key={index}>
                          <Td fontWeight={field.title === 'result' ? 'bold' : 'normal'}>
                            {field.title}
                          </Td>
                          <Td>
                            <Badge colorScheme="blue">{field.type}</Badge>
                          </Td>
                          <Td fontSize="sm">{field.description}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={handleViewEditClick}>
                Edit
              </Button>
              <Button variant="ghost" onClick={onViewClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        
        {/* Edit Modal */}
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Parameters: {selectedNode?.data.label}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Button leftIcon={<AddIcon />} onClick={addSchemaField} size="sm">
                  Add Parameter
                </Button>
                
                {editingSchema.map((field, index) => (
                  <Flex key={index} gap={2} align="center">
                    <Input
                      placeholder="Parameter Name"
                      value={field.title}
                      onChange={(e) => handleSchemaChange(index, 'title', e.target.value)}
                      size="sm"
                    />
                    <Select
                      value={field.type}
                      onChange={(e) => handleSchemaChange(index, 'type', e.target.value)}
                      size="sm"
                      width="150px"
                    >
                      <option value="number">number</option>
                      <option value="string">string</option>
                      <option value="boolean">boolean</option>
                    </Select>
                    <IconButton
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => removeSchemaField(index)}
                      aria-label="Delete"
                    />
                  </Flex>
                ))}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={saveSchemaChanges}>
                Save
              </Button>
              <Button variant="ghost" onClick={onEditClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </HStack>
  );
}

export default HomeView;
