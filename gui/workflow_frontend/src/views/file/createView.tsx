import React, { useState } from 'react';
import {
  Button,
  Text,
  Input,
  VStack,
  useToast,
  FormControl,
  FormLabel,
  Textarea,
  Grid,
  GridItem,
  Divider,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const CreateFlowPj: React.FC = () => {
  const [projectName, setProjectName] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const toast = useToast();
  const navigate = useNavigate();

  const handleRegistration = () => {
    if (!projectName.trim()) {
      toast({
        title: 'Input Error',
        description: 'Please enter a project name',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    toast({
      title: 'Creation Success',
      description: `${projectName} has been created`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    setProjectName('');
    setNote('');
  };

  const handleCancel = () => {
    setProjectName('');
    setNote('');
    navigate(-1);
  };

  return (
    <VStack spacing={6} width="100%" p={6}>
      <Text fontSize="2xl" fontWeight="bold" mb={2}>
        Create Flow Project
      </Text>

      <Divider my={4} />

      <VStack width="100%" spacing={5} align="start">
        <FormControl isRequired>
          <FormLabel htmlFor="projectName">Project name</FormLabel>
          <Input 
            id="projectname" 
            placeholder="Project name ..."
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
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
            isDisabled={!projectName.trim()}
            onClick={handleRegistration}
            boxShadow="sm"
            variant="outline"
            _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
            transition="all 0.2s"
          >
            Create
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

export default CreateFlowPj;
