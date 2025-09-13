/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import { 
  Box, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Heading, 
  Text, 
  Flex, 
  Container,
  HStack,
  Spacer,
  IconButton
} from '@chakra-ui/react';
import KeywordSearch from '@/shared/keyWordSearch/keyWordSearch';
import { Link as RouterLink } from 'react-router-dom'

const FileListView = () => {
  const [searchResult, setSearchResult] = useState<string>('');
  const [files, setFiles] = useState([
    {
      id: 1,
      fileName: 'Project1',
      lastModified: '2025-04-25T14:30:00',
      className: 'UserController'
    },
    {
      id: 2,
      fileName: 'Project2',
      lastModified: '2025-04-26T09:15:00',
      className: 'ProductService',
    },
    {
      id: 3,
      fileName: 'Project3',
      lastModified: '2025-04-27T10:45:00',
      className: 'DataAnalyzer',
    },
    {
      id: 4,
      fileName: 'Project4',
      lastModified: '2025-04-24T16:20:00',
      className: 'EmailNotification',
    }
  ]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSearch = (keyword: string) => {
    console.log('Searching for:', keyword);
    setSearchResult(keyword);
  };

  return (
    <Box height="100%" width="100%" overflow="auto" bg="gray.900">
      <Container maxW="6xl" p={6} bg="gray.800" boxShadow="lg" borderRadius="lg" minHeight="100vh">
      <HStack 
      width="100%" 
      spacing={4} 
      mb={6}
    >
      <Heading as="h1" size="lg">File list</Heading>
      <Spacer />
      <IconButton
        as={RouterLink}
        to="/file/new"
        aria-label="Create File"
        icon={<Text fontSize="xl">+</Text>}
        colorScheme="green"
        variant="solid"/>
      <KeywordSearch 
        onSearch={handleSearch}
        placeholder="Enter keywords..."
        size="md"
        width="300px"
      />
    </HStack>
      <Box overflowX="auto">
        <Table variant="simple" size="md">
          <Thead>
            <Tr bg="gray.400">
              <Th>File Name</Th>
              <Th>Class Name</Th>
              <Th>Created At</Th>
            </Tr>
          </Thead>
          <Tbody>
            {files.map((file) => (
              <Tr key={file.id} _hover={{ bg: "gray.700" }}>
                <Td>
                  <Flex align="center">
                    {/* <Box w="8" textAlign="center" mr={2}>
                      {file.fileName.endsWith('.php') && <Badge colorScheme="purple">PHP</Badge>}
                      {file.fileName.endsWith('.js') && <Badge colorScheme="yellow">JS</Badge>}
                      {file.fileName.endsWith('.py') && <Badge colorScheme="blue">PY</Badge>}
                      {file.fileName.endsWith('.java') && <Badge colorScheme="red">JAVA</Badge>}
                    </Box> */}
                    <Text>{file.fileName}</Text>
                  </Flex>
                </Td>
                <Td fontWeight="medium">{file.className}</Td>
                <Td color="gray.600">{formatDate(file.lastModified)}</Td>
                {/* <Td>
                  <VStack align="flex-start" spacing={1}>
                    {file.requiredArgs.map((arg, index) => (
                      <Flex key={index}>
                        <Text fontWeight="medium" mr={2}>{arg.name}:</Text>
                        <Text color="blue.600" fontStyle="italic">{arg.type}</Text>
                      </Flex>
                    ))}
                  </VStack>
                </Td> */}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      
      <Text mt={6} color="gray.600" fontSize="sm">
        Displayed: {files.length}
      </Text>
      </Container>
    </Box>
  );
};

export default FileListView;
