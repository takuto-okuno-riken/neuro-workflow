import KeywordSearch from '@/shared/keyWordSearch/keyWordSearch';
import { 
  VStack,
  Box,
  Text,
  SimpleGrid,
  Icon,
  Heading,
  Divider,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { IconType } from 'react-icons';

interface SidebarProps {
  nodes: nodes | null;
}

interface NodeType {
  id: string;
  type: string;
  label: string;
  icon: IconType;
  description: string;
  category: string;
}

interface nodes {
  nodes: NodeType[];
}

const SideBoxArea: React.FC<SidebarProps> = ({ nodes }) => {
  const [searchResult, setSearchResult] = useState<string>('');
  const [filteredNodes, setFilteredNodes] = useState<NodeType[]>([]);
  
  useEffect(() => {
    if (nodes && nodes.nodes) {
      setFilteredNodes(nodes.nodes);
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
      setFilteredNodes(nodes.nodes);
    } else {
      const filtered = nodes.nodes.filter(node => 
        node.label.toLowerCase().includes(keyword.toLowerCase()) ||
        node.description.toLowerCase().includes(keyword.toLowerCase()) ||
        node.category.toLowerCase().includes(keyword.toLowerCase())
      );
      setFilteredNodes(filtered);
    }
  };
  
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/nodedata', JSON.stringify({ type: nodeType, label }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const nodesByCategory = filteredNodes.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, NodeType[]>);
  
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
            {nodes === null ? (
              <Box 
                textAlign="center" 
                py={8} 
                color="gray.500"
              >
                <Text>No nodes available</Text>
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
                            onDragStart={(event) => onDragStart(event, node.type, node.label)}
                            draggable
                          >
                            <Box display="flex" alignItems="center" mb={2}>
                              <Icon 
                                as={node.icon} 
                                boxSize={5} 
                                color="blue.400" 
                                mr={2}
                              />
                              <Text fontWeight="bold" fontSize="sm">
                                {node.label}
                              </Text>
                            </Box>
                            <Text fontSize="xs" color="gray.400">
                              {node.description}
                            </Text>
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
