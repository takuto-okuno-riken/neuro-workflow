import KeywordSearch from '@/shared/keyWordSearch/keyWordSearch';
import { 
  Drawer, 
  DrawerBody, 
  DrawerOverlay, 
  DrawerContent, 
  DrawerCloseButton,
  VStack,
  Box,
  Text,
  SimpleGrid,
  Icon,
  Heading,
  Divider,
} from '@chakra-ui/react';
import { useState } from 'react';
import { IconType } from 'react-icons';
import { 
  FiDatabase, 
} from 'react-icons/fi';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NodeTemplate {
  id: string;
  type: string;
  label: string;
  icon: IconType;
  description: string;
  category: string;
}

const nodeTemplates: NodeTemplate[] = [
  { 
    id: 'input-node', 
    type: 'input', 
    label: 'TestClass1', 
    icon: FiDatabase,
    description: 'args:{int, str}',
    category: 'Input/Output'
  },
  { 
    id: 'input-node', 
    type: 'input', 
    label: 'TestClass2', 
    icon: FiDatabase,
    description: 'args:{int, str}',
    category: 'Input/Output'
  },
  { 
    id: 'input-node-2', 
    type: 'input', 
    label: 'TestClass3', 
    icon: FiDatabase,
    description: 'args:{int, str}',
    category: 'Input/Output'
  },
  { 
    id: 'input-node-3', 
    type: 'input', 
    label: 'TestClass4', 
    icon: FiDatabase,
    description: 'args:{int, str}',
    category: 'Input/Output'
  },
  { 
    id: 'input-node-4', 
    type: 'input', 
    label: 'TestClass5', 
    icon: FiDatabase,
    description: 'args:{int, str}',
    category: 'Input/Output'
  },
  { 
    id: 'input-node-4', 
    type: 'input', 
    label: 'TestClass6', 
    icon: FiDatabase,
    description: 'args:{int, str}',
    category: 'Input/Output'
  },
  { 
    id: 'input-node-4', 
    type: 'input', 
    label: 'TestClass7', 
    icon: FiDatabase,
    description: 'args:{int, str}',
    category: 'Input/Output'
  },
  { 
    id: 'input-node-4', 
    type: 'input', 
    label: 'TestClass8', 
    icon: FiDatabase,
    description: 'args:{int, str}',
    category: 'Input/Output'
  },
  { 
    id: 'input-node-4', 
    type: 'input', 
    label: 'TestClass9', 
    icon: FiDatabase,
    description: 'args:{int, str}',
    category: 'Input/Output'
  },
  { 
    id: 'input-node-4', 
    type: 'input', 
    label: 'TestClass10', 
    icon: FiDatabase,
    description: 'args:{int, str}',
    category: 'Input/Output'
  }
];

const SideBoxArea: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [searchResult, setSearchResult] = useState<string>('');
  const [filteredNodes, setFilteredNodes] = useState<NodeTemplate[]>(nodeTemplates);
  
  const handleSearch = (keyword: string) => {
    console.log('Searching for:', keyword);
    setSearchResult(keyword);
    
    // Filter nodes based on search keyword
    if (keyword.trim() === '') {
      setFilteredNodes(nodeTemplates);
    } else {
      const filtered = nodeTemplates.filter(node => 
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

  // Group nodes by category
  const nodesByCategory = filteredNodes.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, NodeTemplate[]>);
  
  return (
    <Drawer
      isOpen={isOpen}
      placement="left"
      onClose={onClose}
    >
      <DrawerOverlay />
      <DrawerContent 
        bg="gray.900" 
        color="white"
        marginTop="64px" 
        maxHeight="calc(100vh - 64px)"
        width="320px"
        maxWidth="320px"
      >
        <DrawerCloseButton />
        <DrawerBody 
          p={4}
          overflowY="auto"
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
              <Heading size="md" mb={4}>Node Library</Heading>
              <KeywordSearch 
                onSearch={handleSearch}
                placeholder="Search nodes..."
                size="md"
                width="100%"
              />
            </Box>
            
            <Divider borderColor="gray.700" />
            
            <Box>
              {Object.entries(nodesByCategory).map(([category, nodes]) => (
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
                    {nodes.map((node) => (
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
              ))}
              
              {filteredNodes.length === 0 && (
                <Box 
                  textAlign="center" 
                  py={8} 
                  color="gray.500"
                >
                  <Text>No nodes found matching "{searchResult}"</Text>
                </Box>
              )}
            </Box>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default SideBoxArea;
