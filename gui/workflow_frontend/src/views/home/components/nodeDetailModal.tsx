import React, { useState } from 'react';
import {
  VStack,
  HStack,
  Box,
  Text,
  Code,
  SimpleGrid,
  Flex,
  Button,
  Tooltip,
} from '@chakra-ui/react';
import { ViewIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { CalculationNodeData, SchemaFields } from '../type';
import { Node } from '@xyflow/react';
import { CodeEditorModal } from './codeEditorModal'; // インポートパスは調整してください

const OpenJupyter = (filename : string) => {
    /*window.open("http://localhost:8888/lab/tree//home/gen/oist/workflow/hiyoko/workflow_backend/django-project/media/python_files/Sample2NetworkNode.py?token=oistworkflow1234", "_blank");*/
    window.open("http://localhost:8888/lab/tree/media/python_files/"+filename+".py?token=oistworkflow1234", "_blank");
  };

const NodeDetailsContent: React.FC<{ nodeData: Node<CalculationNodeData> | null }> = ({ nodeData }) => {
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  if (!nodeData) {
    return (
      <Flex align="center" justify="center" h="200px">
        <Text color="gray.500" fontStyle="italic" fontSize="lg">
          No node selected
        </Text>
      </Flex>
    );
  }

  console.log("これデータ",nodeData)

  const schema: SchemaFields = nodeData.data.schema || { inputs: {}, outputs: {}, parameters: {}, methods: {} };
  
  const renderDataTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'OBJECT': 'purple',
      'DICT': 'blue',
      'BOOL': 'green',
      'BOOLEAN': 'green',
      'INT': 'orange',
      'FLOAT': 'teal',
      'STR': 'pink',
      'STRING': 'pink',
      'LIST': 'cyan',
      'ARRAY': 'cyan',
      'ANY': 'gray',
    };
    return colorMap[type.toUpperCase()] || 'gray';
  };

  // データをクリーンに表示するためのヘルパー関数
  const formatDataForDisplay = (data: any) => {
    if (Array.isArray(data)) {
      // 配列の場合、各要素を簡潔に表示
      return data.map(item => {
        if (typeof item === 'object' && item !== null) {
          // オブジェクトの場合、キーのみまたは重要なプロパティのみを表示
          if (item.name) return item.name;
          if (item.type) return item.type;
          return JSON.stringify(item);
        }
        return String(item);
      }).join(', ');
    }
    
    if (typeof data === 'object' && data !== null) {
      return JSON.stringify(data);
    }
    
    return String(data);
  };

  const renderParametersSection = () => {
    if (!schema.parameters || Object.keys(schema.parameters).length === 0) {
      return (
        <Flex align="center" justify="center" h="100px">
          <Text color="gray.500" fontStyle="italic">
            No parameters defined
          </Text>
        </Flex>
      );
    }

    return (
      <VStack spacing={3} align="stretch">
        {Object.entries(schema.parameters).map(([key, param]) => (
          <Box 
            key={key} 
            p={4} 
            bg="gray.700" 
            borderRadius="md" 
            borderWidth="1px" 
            borderColor="orange.400"
            boxShadow="sm"
          >
            <VStack align="stretch" spacing={3}>
              <Text fontWeight="bold" fontSize="md" color="orange.200">"{key}"</Text>
              
              {param.description && (
                <HStack align="start">
                  <Text fontSize="xs" color="gray.400" minW="80px">description:</Text>
                  <Text fontSize="sm" color="gray.300">
                    {param.description}
                  </Text>
                </HStack>
              )}
              
              <VStack align="stretch" spacing={2}>
                {param.default_value !== undefined && (
                  <HStack>
                    <Text fontSize="xs" color="gray.400" minW="80px">default_value:</Text>
                    <Code colorScheme="gray" fontSize="xs" bg="gray.600" color="white">
                      {typeof param.default_value === 'string' 
                        ? `"${param.default_value}"` 
                        : String(param.default_value)}
                    </Code>
                  </HStack>
                )}
                
                {param.constraints && (
                  <HStack align="start">
                    <Text fontSize="xs" color="gray.400" minW="80px">constraints:</Text>
                    <Code colorScheme="blue" fontSize="xs" bg="blue.600" color="white">
                      {formatDataForDisplay(param.constraints)}
                    </Code>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </Box>
        ))}
      </VStack>
    );
  };

  const renderPortsSection = (ports: Record<string, any>, title: string, colorScheme: string) => {
    if (!ports || Object.keys(ports).length === 0) {
      return (
        <Flex align="center" justify="center" h="100px">
          <Text color="gray.500" fontStyle="italic">
            No {title.toLowerCase()} defined
          </Text>
        </Flex>
      );
    }

    return (
      <VStack spacing={3} align="stretch">
        {Object.entries(ports).map(([portName, portData]) => (
          <HStack key={portName} spacing={3} align="center">
            <Text fontWeight="bold" fontSize="md" color={`${colorScheme}.200`}>
              {portName}
            </Text>
            <Text color="gray.400">:</Text>
            <Text 
              fontWeight="semibold" 
              fontSize="md" 
              color={`${renderDataTypeColor(portData.type || 'any')}.300`}
            >
              {portData.type || 'any'}
            </Text>
          </HStack>
        ))}
      </VStack>
    );
  };

  const renderMethodsSection = () => {
    if (!schema.methods || Object.keys(schema.methods).length === 0) {
      return (
        <Flex align="center" justify="center" h="100px">
          <Text color="gray.500" fontStyle="italic">
            No methods defined
          </Text>
        </Flex>
      );
    }

    return (
      <VStack spacing={3} align="stretch">
        {Object.entries(schema.methods).map(([methodName, method]) => (
          <Box 
            key={methodName} 
            p={4} 
            bg="gray.700" 
            borderRadius="md" 
            borderWidth="1px" 
            borderColor="purple.400"
            boxShadow="sm"
          >
            <VStack align="stretch" spacing={3}>
              <Text fontWeight="bold" fontSize="md" color="purple.200">"{methodName}"</Text>
              
              {method.description && (
                <HStack align="start">
                  <Text fontSize="xs" color="gray.400" minW="80px">description:</Text>
                  <Text fontSize="sm" color="gray.300">
                    {method.description}
                  </Text>
                </HStack>
              )}
              
              <VStack align="stretch" spacing={2}>
                {method.inputs && method.inputs.length > 0 && (
                  <HStack align="start">
                    <Text fontSize="xs" color="gray.400" minW="80px">inputs:</Text>
                    <Code colorScheme="blue" fontSize="xs" bg="blue.600" color="white">
                      {formatDataForDisplay(method.inputs)}
                    </Code>
                  </HStack>
                )}
                
                {method.outputs && method.outputs.length > 0 && (
                  <HStack align="start">
                    <Text fontSize="xs" color="gray.400" minW="80px">outputs:</Text>
                    <Code colorScheme="green" fontSize="xs" bg="green.600" color="white">
                      {formatDataForDisplay(method.outputs)}
                    </Code>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </Box>
        ))}
      </VStack>
    );
  };

  // ノードのファイル名を取得（nodeData.data.filenameまたはnodeData.data.sourceFileなど、実際の構造に合わせて調整）
  const getNodeFileName = () => {
    // 以下は例です。実際のデータ構造に合わせて調整してください
    return nodeData.data.file_name;
  };

  return (
    <>
      <Box p={6} h="100%" overflowY="auto" maxW="none" w="100%">
        <VStack spacing={6} align="stretch" maxW="none">
          {/* Node Info Header with View Code Button */}
          <Box bg="gray.800" borderRadius="lg" boxShadow="md" marginTop={-5} p={4}>
            <HStack justify="space-between" align="start">
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold" fontSize="xl" color="purple.300">
                  {nodeData.data.label}
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Node ID: {nodeData.id}
                </Text>
              </VStack>
              
              {/* View Code Button */}
              <HStack spacing={2}>
                <Tooltip label="View source code for this node" placement="left">
                  <Button
                    leftIcon={<ViewIcon />}
                    rightIcon={<ExternalLinkIcon />}
                    colorScheme="blue"
                    variant="outline"
                    size="sm"
                    /* onClick={() => setIsCodeModalOpen(true)} */
                    onClick={() => OpenJupyter(getNodeFileName())}
                    _hover={{
                      bg: 'blue.500',
                      color: 'white',
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg',
                    }}
                    transition="all 0.2s"
                  >
                    View Code
                  </Button>
                </Tooltip>
              </HStack>
            </HStack>
          </Box>

          {/* 4つのセクションを2x2グリッドで配置 */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} w="100%" templateColumns={{ lg: "1fr 1fr" }}>
            {/* Inputs */}
            <Box>
              <Text fontWeight="bold" fontSize="lg" mb={4} color="blue.300">
                ・Inputs
              </Text>
              <Box
                bg="gray.800"
                p={6}
                borderRadius="lg"
                border="2px"
                borderColor="blue.500"
                h="150px"
                overflowY="auto"
                boxShadow="lg"
              >
                {renderPortsSection(schema.inputs || {}, 'Inputs', 'blue')}
              </Box>
            </Box>

            {/* Outputs */}
            <Box>
              <Text fontWeight="bold" fontSize="lg" mb={4} color="green.300">
                ・Outputs
              </Text>
              <Box
                bg="gray.800"
                p={6}
                borderRadius="lg"
                border="2px"
                borderColor="green.500"
                h="150px"
                overflowY="auto"
                boxShadow="lg"
              >
                {renderPortsSection(schema.outputs || {}, 'Outputs', 'green')}
              </Box>
            </Box>

            {/* Methods */}
            <Box>
              <Text fontWeight="bold" fontSize="lg" mb={4} color="purple.300">
                ・Methods
              </Text>
              <Box
                bg="gray.800"
                p={6}
                borderRadius="lg"
                border="2px"
                borderColor="purple.500"
                h="500px"
                overflowY="auto"
                boxShadow="lg"
              >
                {renderMethodsSection()}
              </Box>
            </Box>

            {/* Parameters */}
            <Box>
              <Text fontWeight="bold" fontSize="lg" mb={4} color="orange.300">
                ・Parameters
              </Text>
              <Box
                bg="gray.800"
                p={6}
                borderRadius="lg"
                border="2px"
                borderColor="orange.500"
                h="500px"
                overflowY="auto"
                boxShadow="lg"
              >
                {renderParametersSection()}
              </Box>
            </Box>
          </SimpleGrid>
        </VStack>
      </Box>

      {/* Code Editor Modal */}
      <CodeEditorModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        identifier={getNodeFileName()}
        endpoints={{
          baseUrl: 'http://localhost:3000/api/box', // 必要に応じて調整
          getCode: '/files/{identifier}/code/',
          saveCode: '/files/{identifier}/code/',
        }}
        title={`Code: ${nodeData.data.label}`}
        downloadFileName={getNodeFileName()}
        showExecute={false} // ノードのコードは実行しない
        language="python"
      />
    </>
  );
};

export default NodeDetailsContent;
