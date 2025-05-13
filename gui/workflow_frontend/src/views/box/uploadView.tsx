import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  Input,
  VStack,
  useToast,
  HStack,
  Icon,
  List,
  ListItem,
  FormControl,
  FormLabel,
  Textarea,
  Grid,
  GridItem,
  Divider,
} from '@chakra-ui/react';
import { AttachmentIcon, CloseIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

const BoxUpload: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedFiles.length > 0 && fileName === '') {
      const fullName = selectedFiles[0].name;
      const nameWithoutExtension = fullName.replace(/\.py$/, '');
      setFileName(nameWithoutExtension);
    }
  }, [selectedFiles, fileName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const rejectedFiles: { name: string; reason: string }[] = [];

    Array.from(files).forEach((file) => {
      if (!file.name.endsWith('.py')) {
        rejectedFiles.push({
          name: file.name,
          reason: 'only upload python file ',
        });
        return;
      }

      newFiles.push(file);
    });

    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach((file) => {
        toast({
          title: 'File rejected',
          description: `${file.name}: ${file.reason}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
    }

    if (newFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    
    if (selectedFiles.length === 1) {
      setFileName('');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = e.dataTransfer.files;
      
      const newFiles: File[] = [];
      const rejectedFiles: { name: string; reason: string }[] = [];

      Array.from(files).forEach((file) => {
        if (!file.name.endsWith('.py')) {
          rejectedFiles.push({
            name: file.name,
            reason: 'Only Python files (.py) can be uploaded',
          });
          return;
        }

        newFiles.push(file);
      });

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach((file) => {
          toast({
            title: 'File rejected',
            description: `${file.name}: ${file.reason}`,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        });
      }

      if (newFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    }
  };

  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };

  const handleRegistration = () => {
    // 入力検証
    if (selectedFiles.length === 0) {
      toast({
        title: 'input error',
        description: 'Upload your Python file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!fileName.trim()) {
      toast({
        title: 'input error',
        description: 'Please enter a file name',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    toast({
      title: 'Registration Success',
      description: `${fileName} has been registered!`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    setSelectedFiles([]);
    setFileName('');
    setClassName('');
    setNote('');
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setFileName('');
    setClassName('');
    setNote('');
    navigate(-1);
  };

  return (
    <VStack spacing={6} width="100%" p={6}>
      <Text fontSize="2xl" fontWeight="bold" mb={2}>
        File Upload
      </Text>
      
      <Flex
        direction="column"
        align="center"
        justify="center"
        p={8}
        borderWidth={2}
        borderRadius="lg"
        borderStyle="dashed"
        borderColor="blue.300"
        bg="blue.50"
        width="100%"
        minHeight="200px"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        cursor="pointer"
        onClick={() => fileInputRef.current?.click()}
        _hover={{ bg: 'blue.100' }}
        transition="all 0.2s"
      >
        <Input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".py"
          display="none"
        />
        <Icon as={AttachmentIcon} w={12} h={12} color="blue.500" mb={4} />
        <Text fontWeight="bold" fontSize="xl" mb={3} color="blue.700">
            Drop Python files here
        </Text>
        <Text fontSize="md" color="blue.600">
            Or, click to select a file
        </Text>
        <Text fontSize="sm" color="gray.500" mt={2}>
            .py files only
        </Text>
      </Flex>

      {selectedFiles.length > 0 && (
        <Box width="100%" border="1px" borderColor="gray.200" borderRadius="md" p={4}>
          <Text fontWeight="semibold" mb={3}>
          Selected files ({selectedFiles.length})
          </Text>
          <List spacing={2} width="100%">
            {selectedFiles.map((file, index) => (
              <ListItem key={index}>
                <HStack
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                  justifyContent="space-between"
                  borderLeft="4px"
                  borderLeftColor="blue.400"
                >
                  <HStack>
                    <Text fontWeight="medium">
                      {file.name}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      ({formatFileSize(file.size)})
                    </Text>
                  </HStack>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => removeFile(index)}
                  >
                    <Icon as={CloseIcon} />
                  </Button>
                </HStack>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Divider my={4} />

      <VStack width="100%" spacing={5} align="start">
        <FormControl isRequired>
          <FormLabel htmlFor="fileName">File name</FormLabel>
          <Input 
            id="fileName" 
            placeholder="File name ..."
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="className">Class name</FormLabel>
          <Input 
            id="className" 
            placeholder="Class name ..."
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="note">Note</FormLabel>
          <Textarea
            id="note"
            placeholder="Note ..."
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </FormControl>
      </VStack>

      <Grid templateColumns="repeat(2, 1fr)" gap={4} width="100%" mt={4}>
      <GridItem>
          <Button
            colorScheme="green"
            size="lg"
            width="100%"
            fontWeight="bold"
            isDisabled={selectedFiles.length === 0 || !fileName.trim()}
            onClick={handleRegistration}
            boxShadow="sm"
            variant="outline"
            _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
            transition="all 0.2s"
          >
            Regist
          </Button>
        </GridItem>
        <GridItem>
          <Button
            colorScheme="red"
            variant="outline"
            size="lg"
            width="100%"
            onClick={handleCancel}
            _hover={{ bg: "red.50" }}
          >
            Cancel
          </Button>
        </GridItem>
      </Grid>
    </VStack>
  );
};

export default BoxUpload;
