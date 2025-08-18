import { Box, Button } from "@chakra-ui/react";

export const EdgeMenu = ({ 
  position, 
  onDelete, 
  onClose 
}: {
  position: { x: number, y: number },
  onDelete: () => void,
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
        colorScheme="red"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        Delete Edge
      </Button>
    </Box>
  );
};
