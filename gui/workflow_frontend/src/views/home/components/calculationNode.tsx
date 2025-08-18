import { Handle, NodeProps, Position } from "@xyflow/react";
import { CalculationNodeData } from "../type";
import { Badge, Box, Text } from "@chakra-ui/react";

export const CalculationNode = ({ id, data, isConnectable, selected }: NodeProps<CalculationNodeData>) => {
  const schema = data.schema || { inputs: {}, outputs: {} };

  console.log("これがスキーマデータ", schema);
  
  // ハンドルIDを一意に生成する関数
  const generateHandleId = (nodeId: string, fieldName: string, handleType: 'input' | 'output', portType: string) => {
    return `${nodeId}-${fieldName}-${handleType}-${portType}`;
  };
  
  // inputs、outputsを配列に変換
  const inputEntries = schema.inputs ? Object.entries(schema.inputs) : [];
  const outputEntries = schema.outputs ? Object.entries(schema.outputs) : [];
  
  // すべてのフィールドを結合（inputsを先、outputsを後）
  const allFields = [
    ...inputEntries.map(([name, data]) => ({
      name,
      type: data.type || 'any',
      description: data.description,
      port_direction: 'input'
    })),
    ...outputEntries.map(([name, data]) => ({
      name,
      type: data.type || 'any',
      description: data.description,
      port_direction: 'output'
    }))
  ];
  
  return (
    <Box
      bg="white"
      border="2px solid"
      borderColor={selected ? "purple.500" : "#e2e8f0"}
      borderRadius="lg"
      minWidth="200px"
      maxWidth="280px"
      boxShadow={selected ? "lg" : "md"}
      _hover={{ boxShadow: "lg", borderColor: "purple.400" }}
      position="relative"
      transition="all 0.2s"
    >
      {/* ヘッダー */}
      <Box 
        bg={selected ? "purple.600" : "purple.500"}
        color="white" 
        p={2} 
        borderTopRadius="lg"
        fontWeight="bold"
        textAlign="center"
        fontSize="sm"
        transition="all 0.2s"
      >
        {data.label}
      </Box>
      
      {/* フィールド表示 */}
      <Box p={0}>
        {allFields.map((field, index) => {
          const isInput = field.port_direction === 'input';
          const isOutput = field.port_direction === 'output';
          
          return (
            <Box
              key={`${field.port_direction}-${field.name}`}
              position="relative"
              py={1.5}
              px={3}
              borderBottom={index < allFields.length - 1 ? "1px solid #e2e8f0" : "none"}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              minHeight="32px"
              bg={isOutput ? 'green.50' : isInput ? 'blue.50' : 'gray.50'}
              _hover={{ bg: isOutput ? 'green.100' : isInput ? 'blue.100' : 'gray.100' }}
              transition="background-color 0.2s"
            >
              <Text 
                fontSize="xs" 
                fontWeight="medium"
                color={isOutput ? 'green.700' : isInput ? 'blue.700' : 'gray.700'}
                maxWidth="150px"
                isTruncated
                title={field.description || field.name}
              >
                {field.name}
              </Text>
              
              <Badge 
                colorScheme={
                  field.type === 'int' || field.type === 'float' || field.type === 'number' ? 
                    (isOutput ? 'green' : isInput ? 'blue' : 'gray') : 
                  field.type === 'str' || field.type === 'string' ? 'purple' :
                  field.type === 'bool' || field.type === 'boolean' ? 'orange' :
                  field.type === 'list' || field.type === 'array' ? 'teal' :
                  field.type === 'dict' || field.type === 'object' ? 'yellow' :
                  'gray'
                }
                size="sm"
                fontSize="10px"
                variant="subtle"
              >
                {field.type}
              </Badge>
              
              {/* 入力ハンドル */}
              {isInput && (
                <Handle
                  type="target"
                  position={Position.Left}
                  id={generateHandleId(id, field.name, 'input', field.type)}
                  style={{
                    background: '#3182ce',
                    border: '2px solid #fff',
                    width: 12,
                    height: 12,
                    left: -6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    position: 'absolute',
                    boxShadow: '0 0 0 2px #3182ce40',
                  }}
                  isConnectable={isConnectable}
                />
              )}
              
              {/* 出力ハンドル */}
              {isOutput && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={generateHandleId(id, field.name, 'output', field.type)}
                  style={{
                    background: '#38a169',
                    border: '2px solid #fff',
                    width: 12,
                    height: 12,
                    right: -6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    position: 'absolute',
                    boxShadow: '0 0 0 2px #38a16940',
                  }}
                  isConnectable={isConnectable}
                />
              )}
            </Box>
          );
        })}
      </Box>
      
      {/* デバッグ情報（開発時のみ表示） */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          position="absolute"
          bottom="-20px"
          left="0"
          fontSize="8px"
          color="gray.500"
          bg="white"
          px={1}
          borderRadius="sm"
          border="1px solid #e2e8f0"
        >
          ID: {id}
        </Box>
      )}
    </Box>
  );
};
