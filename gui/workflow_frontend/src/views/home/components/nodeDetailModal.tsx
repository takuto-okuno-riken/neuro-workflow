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
  Input,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { ViewIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { CalculationNodeData, SchemaFields } from '../type';
import { Node } from '@xyflow/react';

interface NodeDetailsContentProps {
  nodeData: Node<CalculationNodeData> | null;
  onNodeUpdate?: (nodeId: string, updatedData: Partial<CalculationNodeData>) => void;
  onRefreshNodeData?: (filename: string) => Promise<any>;
  onSyncWorkflowNodes?: (filename: string, updatedSchema: SchemaFields) => void;
}

const OpenJupyter = (filename : string) => {
    window.open("http://localhost:8000/user/user1/lab/workspaces/auto-E/tree/upload_nodes/"+filename+".py", "_blank");
  };

const NodeDetailsContent: React.FC<NodeDetailsContentProps> = ({ nodeData, onNodeUpdate, onRefreshNodeData, onSyncWorkflowNodes }) => {
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'default_value' | 'constraints' | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const toast = useToast();

  // パラメータの更新API呼び出し
  const updateParameter = async (parameterKey: string, parameterValue: any, parameterField: 'default_value' | 'constraints') => {
    try {
      const response = await fetch('/api/box/parameters/update/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parameter_key: parameterKey,
          parameter_field: parameterField,
          parameter_value: parameterValue,
          filename: nodeData.data.file_name
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // DBから最新データを再取得またはローカル状態を更新
      if (nodeData && onNodeUpdate) {
        console.log('Starting post-update refresh process for node:', nodeData.id);
        console.log('onRefreshNodeData available:', !!onRefreshNodeData);
        
        let updatedSchema: SchemaFields;
        
        if (onRefreshNodeData) {
          try {
            console.log('Attempting to refresh data for file:', nodeData.data.file_name);
            const refreshedData = await onRefreshNodeData(nodeData.data.file_name);
            console.log('Refresh result:', refreshedData);
            
            if (refreshedData && refreshedData.schema) {
              console.log('Updating node with refreshed schema:', refreshedData.schema);
              updatedSchema = refreshedData.schema;
              onNodeUpdate(nodeData.id, { schema: updatedSchema });
            } else {
              console.log('No refreshed data returned, using fallback local update');
              // 再取得に失敗した場合のフォールバック
              updatedSchema = { ...nodeData.data.schema };
              if (updatedSchema.parameters && updatedSchema.parameters[parameterKey]) {
                updatedSchema.parameters[parameterKey] = {
                  ...updatedSchema.parameters[parameterKey],
                  [parameterField]: parameterValue
                };
                onNodeUpdate(nodeData.id, { schema: updatedSchema });
              }
            }
          } catch (error) {
            console.error('Failed to refresh node data:', error);
            console.log('Using fallback local update due to refresh error');
            // エラー時のフォールバック: ローカルの状態を更新
            updatedSchema = { ...nodeData.data.schema };
            if (updatedSchema.parameters && updatedSchema.parameters[parameterKey]) {
              updatedSchema.parameters[parameterKey] = {
                ...updatedSchema.parameters[parameterKey],
                [parameterField]: parameterValue
              };
              onNodeUpdate(nodeData.id, { schema: updatedSchema });
            }
          }
        } else {
          console.log('onRefreshNodeData not available, using local update');
          // onRefreshNodeDataが提供されていない場合、ローカル状態を更新
          updatedSchema = { ...nodeData.data.schema };
          if (updatedSchema.parameters && updatedSchema.parameters[parameterKey]) {
            updatedSchema.parameters[parameterKey] = {
              ...updatedSchema.parameters[parameterKey],
              [parameterField]: parameterValue
            };
            onNodeUpdate(nodeData.id, { schema: updatedSchema });
          }
        }
        
        // ワークフロー内の同一ファイルノードも同期更新
        if (onSyncWorkflowNodes && updatedSchema) {
          console.log('Syncing workflow nodes with same file_name:', nodeData.data.file_name);
          onSyncWorkflowNodes(nodeData.data.file_name, updatedSchema);
        }
      }

      toast({
        title: "Success",
        description: `Parameter ${parameterField} updated successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      return true;
    } catch (error) {
      console.error('Error updating parameter:', error);
      toast({
        title: "Error",
        description: `Failed to update parameter: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  };

  // 編集開始
  const startEditing = (paramKey: string, field: 'default_value' | 'constraints', currentValue: any) => {
    setEditingParam(paramKey);
    setEditingField(field);
    setEditValue(typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue));
  };

  // 編集保存
  const saveEdit = async () => {
    if (!editingParam || !editingField) return;

    let parsedValue: any;
    try {
      // JSONとして解析を試行、失敗したら文字列として扱う
      parsedValue = JSON.parse(editValue);
    } catch {
      parsedValue = editValue;
    }

    const success = await updateParameter(editingParam, parsedValue, editingField);
    if (success) {
      // 編集状態をクリア
      setEditingParam(null);
      setEditingField(null);
      setEditValue('');
    }
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingParam(null);
    setEditingField(null);
    setEditValue('');
  };

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

    // ノードのファイル名を取得（nodeData.data.filenameまたはnodeData.data.sourceFileなど、実際の構造に合わせて調整）
  const getNodeFileName = () => {
    // 以下は例です。実際のデータ構造に合わせて調整してください
    return nodeData.data.file_name;
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
                {/* Default Value - 編集可能 */}
                {param.default_value !== undefined && (
                  <HStack align="start" spacing={2}>
                    <Text fontSize="xs" color="gray.400" minW="80px">default_value:</Text>
                    {editingParam === key && editingField === 'default_value' ? (
                      <HStack flex="1" spacing={1}>
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          size="xs"
                          bg="gray.600"
                          color="white"
                          fontSize="xs"
                        />
                        <IconButton
                          aria-label="Save"
                          icon={<CheckIcon />}
                          size="xs"
                          colorScheme="green"
                          onClick={saveEdit}
                        />
                        <IconButton
                          aria-label="Cancel"
                          icon={<CloseIcon />}
                          size="xs"
                          colorScheme="red"
                          onClick={cancelEdit}
                        />
                      </HStack>
                    ) : (
                      <HStack flex="1" spacing={1}>
                        <Code colorScheme="gray" fontSize="xs" bg="gray.600" color="white" flex="1">
                          {typeof param.default_value === 'string' 
                            ? `"${param.default_value}"` 
                            : String(param.default_value)}
                        </Code>
                        <Tooltip label="Edit default value" hasArrow>
                          <IconButton
                            aria-label="Edit default value"
                            icon={<EditIcon />}
                            size="xs"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => startEditing(key, 'default_value', param.default_value)}
                          />
                        </Tooltip>
                      </HStack>
                    )}
                  </HStack>
                )}
                
                {/* Constraints - 編集可能 */}
                <HStack align="start" spacing={2}>
                  <Text fontSize="xs" color="gray.400" minW="80px">constraints:</Text>
                  {editingParam === key && editingField === 'constraints' ? (
                    <HStack flex="1" spacing={1}>
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        size="xs"
                        bg="gray.600"
                        color="white"
                        fontSize="xs"
                        placeholder="Enter constraints (JSON format)"
                      />
                      <IconButton
                        aria-label="Save"
                        icon={<CheckIcon />}
                        size="xs"
                        colorScheme="green"
                        onClick={saveEdit}
                      />
                      <IconButton
                        aria-label="Cancel"
                        icon={<CloseIcon />}
                        size="xs"
                        colorScheme="red"
                        onClick={cancelEdit}
                      />
                    </HStack>
                  ) : (
                    <HStack flex="1" spacing={1}>
                      <Code colorScheme="blue" fontSize="xs" bg="blue.600" color="white" flex="1">
                        {param.constraints ? formatDataForDisplay(param.constraints) : 'None'}
                      </Code>
                      <Tooltip label="Edit constraints" hasArrow>
                        <IconButton
                          aria-label="Edit constraints"
                          icon={<EditIcon />}
                          size="xs"
                          colorScheme="blue"
                          variant="ghost"
                          onClick={() => startEditing(key, 'constraints', param.constraints || '')}
                        />
                      </Tooltip>
                    </HStack>
                  )}
                </HStack>
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

    </>
  );
};

export default NodeDetailsContent;
