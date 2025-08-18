import KeywordSearch from '@/shared/keyWordSearch/keyWordSearch';
import { 
  VStack,
  Box,
  Text,
  SimpleGrid,
  Icon,
  Heading,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { IconType } from 'react-icons';
import { FiBox } from 'react-icons/fi'; // デフォルトアイコンとして使用
import { SchemaFields } from '../home/type';

interface SidebarProps {
  nodes: UploadedNodesResponse | null;
  isLoading?: boolean;
  error?: string;
}

// バックエンドのレスポンス型に合わせて定義
interface UploadedNodesResponse {
  nodes: BackendNodeType[];
  total_files: number;
  total_nodes: number;
}

interface BackendNodeType {
  id: string;
  type: string;
  label: string;
  description: string;
  category: string;
  file_id: string;
  class_name: string;
  file_name: string;
  schema: SchemaFields;
}

interface NodeTypeWithIcon extends Omit<BackendNodeType, 'icon'> {
  icon: IconType;
}

const SideBoxArea: React.FC<SidebarProps> = ({ nodes, isLoading = false, error }) => {
  const [searchResult, setSearchResult] = useState<string>('');
  const [filteredNodes, setFilteredNodes] = useState<NodeTypeWithIcon[]>([]);

  console.log("サイドボックスエリア", filteredNodes)
  
  useEffect(() => {
    if (nodes && nodes.nodes) {
      // バックエンドのノードにアイコンを追加
      const nodesWithIcons: NodeTypeWithIcon[] = nodes.nodes.map(node => ({
        ...node,
        icon: FiBox, // デフォルトアイコン（必要に応じて変更）
      }));
      setFilteredNodes(nodesWithIcons);
    } else {
      setFilteredNodes([]);
    }
  }, [nodes]);
  
  const handleSearch = (keyword: string) => {
    console.log('Searching for:', keyword);
    setSearchResult(keyword);
    
    if (!nodes || !nodes.nodes) {
      setFilteredNodes([]);
      return;
    }
    
    if (keyword.trim() === '') {
      const nodesWithIcons: NodeTypeWithIcon[] = nodes.nodes.map(node => ({
        ...node,
        icon: FiBox,
      }));
      setFilteredNodes(nodesWithIcons);
    } else {
      const filtered = nodes.nodes
        .filter(node => 
          node.label.toLowerCase().includes(keyword.toLowerCase()) ||
          node.description.toLowerCase().includes(keyword.toLowerCase()) ||
          node.category.toLowerCase().includes(keyword.toLowerCase()) ||
          node.file_name.toLowerCase().includes(keyword.toLowerCase())
        )
        .map(node => ({
          ...node,
          icon: FiBox,
        }));
      setFilteredNodes(filtered);
    }
  };
  
  const onDragStart = (event: React.DragEvent, node: NodeTypeWithIcon) => {
    // バックエンドの詳細な情報もドラッグデータに含める
    const dragData = {
      type: node.type,
      label: node.label,
      file_id: node.file_id,
      class_name: node.class_name,
      file_name: node.file_name,
      schema: node.schema,
      description: node.description,
    };
    
    event.dataTransfer.setData('application/reactflow', node.type);
    event.dataTransfer.setData('application/nodedata', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const nodesByCategory = filteredNodes.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, NodeTypeWithIcon[]>);
  
  return (
    <Box
      position="fixed"
      left={0}
      top="64px"
      height="calc(100vh - 64px)"
      width="320px"
      bg="gray.900"
      color="white"
      borderRight="1px solid"
      borderColor="gray.700"
      zIndex={10}
      display="flex"
      flexDirection="column"
    >
      <Box 
        p={4}
        overflowY="auto"
        height="100%"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            width: '8px',
            background: '#2D3748',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#4A5568',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#718096',
          },
        }}
      >
        <VStack spacing={6} align="stretch">
          <Box position="sticky" top={0} bg="gray.900" pb={2} zIndex={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Heading size="md">Node Library</Heading>
              {nodes && (
                <Text fontSize="xs" color="gray.400">
                  {nodes.total_nodes} nodes from {nodes.total_files} files
                </Text>
              )}
            </Box>
            <KeywordSearch 
              onSearch={handleSearch}
              placeholder="Search nodes..."
              size="md"
              width="100%"
            />
          </Box>
          
          <Divider borderColor="gray.700" />
          
          <Box>
            {isLoading ? (
              <Box 
                textAlign="center" 
                py={8}
              >
                <Spinner color="blue.400" size="lg" />
                <Text mt={4} color="gray.400">Loading nodes...</Text>
              </Box>
            ) : error ? (
              <Alert status="error" bg="red.900" borderColor="red.700">
                <AlertIcon />
                <Text fontSize="sm">{error}</Text>
              </Alert>
            ) : nodes === null || !nodes.nodes || nodes.nodes.length === 0 ? (
              <Box 
                textAlign="center" 
                py={8} 
                color="gray.500"
              >
                <Text>No nodes available</Text>
                <Text fontSize="sm" mt={2}>Upload Python files to add custom nodes</Text>
              </Box>
            ) : (
              <>
                {Object.entries(nodesByCategory).length > 0 ? (
                  Object.entries(nodesByCategory).map(([category, categoryNodes]) => (
                    <Box key={category} mb={6}>
                      <Text 
                        fontSize="sm" 
                        fontWeight="bold" 
                        color="gray.400" 
                        mb={3}
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        {category}
                      </Text>
                      <SimpleGrid columns={1} spacing={2}>
                        {categoryNodes.map((node) => (
                          <Box
                            key={node.id}
                            p={3}
                            bg="gray.800"
                            borderRadius="md"
                            border="1px solid"
                            borderColor="gray.700"
                            cursor="grab"
                            _hover={{
                              bg: "gray.700",
                              borderColor: "blue.500",
                              transform: "translateY(-2px)",
                              transition: "all 0.2s"
                            }}
                            onDragStart={(event) => onDragStart(event, node)}
                            draggable
                          >
                            <Box display="flex" alignItems="center" mb={2}>
                              <Icon 
                                as={node.icon} 
                                boxSize={5} 
                                color="blue.400" 
                                mr={2}
                              />
                              <Box flex={1}>
                                <Text fontWeight="bold" fontSize="sm">
                                  {node.label}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  from {node.file_name}
                                </Text>
                              </Box>
                            </Box>
                            <Text fontSize="xs" color="gray.400" mb={2}>
                              {node.description}
                            </Text>
                            {node.schema && (Object.keys(node.schema.outputs).length  > 0 || Object.keys(node.schema.inputs).length  > 0) && (
                              <Box>
                                <Text fontSize="xs" color="gray.500" mb={1}>
                                  Ports: {Object.keys(node.schema.inputs).length}in / {Object.keys(node.schema.outputs).length}out
                                </Text>
                              </Box>
                            )}
                          </Box>
                        ))}
                      </SimpleGrid>
                    </Box>
                  ))
                ) : (
                  <Box 
                    textAlign="center" 
                    py={8} 
                    color="gray.500"
                  >
                    <Text>No nodes found matching "{searchResult}"</Text>
                  </Box>
                )}
              </>
            )}
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

export default SideBoxArea;
