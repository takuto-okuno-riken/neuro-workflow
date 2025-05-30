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
  Spinner,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

interface CreateFlowProjectRequest {
  name: string;
  description: string;
}

interface CreateFlowProjectResponse {
  id?: number;
  name?: string;
  description?: string;
  created_at?: string;
  error?: string;
}

const CreateFlowPj: React.FC = () => {
  const [projectName, setProjectName] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const toast = useToast();
  const navigate = useNavigate();

  const API_ENDPOINT = `http://localhost:3000/api/workflow/`;

  // ワークフロー作成API呼び出し
  const createFlowProject = async (data: CreateFlowProjectRequest): Promise<CreateFlowProjectResponse> => {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      const result: CreateFlowProjectResponse = await response.json();
      return result;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  const handleRegistration = async () => {
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

    setIsLoading(true);

    try {
      // API呼び出し用のデータを準備
      const requestData: CreateFlowProjectRequest = {
        name: projectName.trim(),
        description: note.trim(),
      };

      const response = await createFlowProject(requestData);

      if (response.id) {
        toast({
          title: 'Creation Success',
          description: `${projectName} has been created successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // フォームをリセット
        setProjectName('');
        setNote('');

        // 作成されたワークフローの詳細画面に遷移
        navigate(`/workflow/${response.id}`);
      } else {
        throw new Error(response.error || 'Creation failed');
      }
    } catch (error) {
      console.error('Error creating flow project:', error);
      
      toast({
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
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
            isDisabled={isLoading}
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
            isDisabled={isLoading}
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
            isDisabled={!projectName.trim() || isLoading}
            onClick={handleRegistration}
            boxShadow="sm"
            variant="outline"
            _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
            transition="all 0.2s"
            leftIcon={isLoading ? <Spinner size="sm" /> : undefined}
          >
            {isLoading ? 'Creating...' : 'Create'}
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
            isDisabled={isLoading}
          >
            Cancel
          </Button>
        </GridItem>
      </Grid>
    </VStack>
  );
};

export default CreateFlowPj;
