import { useState, useCallback } from 'react';
import { Project } from '../type'
import {
  HStack,
  Box,
  VStack,
  Select,
  FormLabel,
  Badge,
  Text,
  Flex,
  IconButton,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { CheckIcon, WarningIcon, DeleteIcon } from '@chakra-ui/icons';
import { FiMenu, FiPlay } from 'react-icons/fi';
import { useTabContext } from '../../../components/tabs/TabManager';

export const ProjectSelector = ({ 
  projects, 
  selectedProject, 
  onProjectChange, 
  onProjectDelete,
  autoSaveEnabled = true,
  isConnected = true 
}: {
  projects: Project[];
  selectedProject: string | null;
  onProjectChange: (projectId: string) => void;
  onProjectDelete?: (project: Project) => void;
  autoSaveEnabled?: boolean;
  isConnected?: boolean;
}) => {
  const toast = useToast();
  // アイランドメニュー開閉管理
  const [isIslandProjectOpen, setIslandProjectOpen] = useState(true);
  // タブシステムのコンテキストを使用
  const { addJupyterTab } = useTabContext();
  
  const getStatusBadge = () => {
    if (!isConnected) {
      return (
        <Badge colorScheme="red" size="sm" variant="subtle">
          <HStack spacing={1}>
            <WarningIcon w={2} h={2} />
            <Text fontSize="xs">Offline</Text>
          </HStack>
        </Badge>
      );
    }
    
    if (autoSaveEnabled) {
      return (
        <Badge colorScheme="green" size="sm" variant="subtle">
          <HStack spacing={1}>
            <CheckIcon w={2} h={2} />
            <Text fontSize="xs">Auto-save</Text>
          </HStack>
        </Badge>
      );
    }
    
    return (
      <Badge colorScheme="orange" size="sm" variant="subtle">
        <HStack spacing={1}>
          <WarningIcon w={2} h={2} />
          <Text fontSize="xs">Manual save</Text>
        </HStack>
      </Badge>
    );
  };

  const getStatusMessage = () => {
    if (!isConnected) {
      return "⚠️ Connection lost - changes not saved";
    }
    if (autoSaveEnabled) {
      return "💾 Changes are automatically saved";
    }
    return "⚠️ Remember to save manually";
  };

  // ワークフロープロジェクトのソースコード表示
  const handleOpenJupyter = useCallback(async () => {
    if (!selectedProject) {
      toast({
        title: "No Project Selected",
        description: "Please select a project first",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    try {
      let projectId = localStorage.getItem('projectId');
      projectId = projectId ? projectId : "";
      // プロジェクト名を取得
      const projectName = projects.find(p => p.id === selectedProject)?.name || selectedProject;
      // 先頭大文字化
      const trimedProjectName = projectName.replace(/\s/g, '');
      const capitalizedProjectName = trimedProjectName.charAt(0).toUpperCase() + trimedProjectName.slice(1);

      // JupyterLab URLを構築（開発モード）
      const jupyterUrl = "http://localhost:8000/user/user1/lab/workspaces/auto-E/tree/codes/projects/"+capitalizedProjectName+"/"+capitalizedProjectName+".py"
      
      // 新しいタブを作成
      addJupyterTab(selectedProject, projectName, jupyterUrl);
      
      toast({
        title: "JupyterLab Tab Created",
        description: `Created tab for project "${projectName}"`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error creating JupyterLab tab:', error);
      toast({
        title: "Error",
        description: "Failed to create JupyterLab tab",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [selectedProject, projects, addJupyterTab, toast]);


  return (
    <Box
      position="absolute"
      top="8px"
      left="8px"
    >
      <HStack spacing={2}>
        <IconButton
          position="absolute"
          top="16px"
          left="16px"
          zIndex={1000}
          aria-label="メニュー開閉"
          icon={<FiMenu />}
          onClick={() => setIslandProjectOpen(!isIslandProjectOpen)}
          colorScheme="gray"
          bg="gray.300"
          _hover={{ bg: 'gray.600' }}
        />
        <IconButton
          position="absolute"
          top="16px"
          left="64px"
          zIndex={1000}
          aria-label="実行"
          icon={<FiPlay />}
          onClick={() => handleOpenJupyter()}
          colorScheme="gray"
          bg="pink.300"
          _hover={{ bg: 'gray.600' }}
        />
      </HStack>
      <Box
        position="absolute"
        top="0px"
        left="0px"
        p={4}
        bg="white"
        borderRadius="md"
        boxShadow="md"
        zIndex={5}
        minWidth="320px"
        borderWidth={1}
        borderColor="gray.200"
        display={isIslandProjectOpen ? 'block' : 'none'}
      >
        <VStack spacing={3} align="stretch" width="100%">
          {/* ヘッダー部分 */}
          <Flex justify="space-between" align="center">
            <Box marginLeft={24}>
              <FormLabel fontSize="sm" mb={0} color="gray.700" fontWeight="semibold">
                Project Workspace
              </FormLabel>
              {getStatusBadge()}
            </Box>
          </Flex>
          
          {/* プロジェクト選択 */}
          <HStack spacing={2}>
            <Select 
              value={selectedProject || ''} 
              onChange={(e) => onProjectChange(e.target.value)}
              onLoad={(e) => onProjectChange(e.target.value)}
              size="sm"
              bg="white"
              color="gray.800"
              borderColor="gray.300"
              placeholder="Choose a project..."
              _hover={{
                borderColor: "blue.300"
              }}
              _focus={{
                borderColor: "blue.500",
                boxShadow: "0 0 0 1px #3182ce"
              }}
              flex="1"
              marginTop={2}
            >
              {projects.map(project => (
                <option key={project.id} value={project.id} style={{color: '#2D3748'}}>
                  {project.name}
                </option>
              ))}
            </Select>
            
            {selectedProject && onProjectDelete && (
              <Tooltip label="Delete project" placement="top">
                <IconButton
                  aria-label="Delete project"
                  icon={<DeleteIcon />}
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => {
                    const project = projects.find(p => p.id === selectedProject);
                    if (project) {
                      onProjectDelete(project);
                    }
                  }}
                  _hover={{
                    bg: "red.50",
                    borderColor: "red.400"
                  }}
                  marginTop={2}
                />
              </Tooltip>
            )}
          </HStack>
          
          {/* ステータスメッセージ */}
          {selectedProject && (
            <Text 
              fontSize="xs" 
              color={!isConnected ? "red.600" : autoSaveEnabled ? "green.600" : "orange.600"}
              textAlign="center"
              py={1}
              px={2}
              bg={!isConnected ? "red.50" : autoSaveEnabled ? "green.50" : "orange.50"}
              borderRadius="sm"
              borderWidth={1}
              borderColor={!isConnected ? "red.200" : autoSaveEnabled ? "green.200" : "orange.200"}
            >
              {getStatusMessage()}
            </Text>
          )}
          
          {/* プロジェクト情報（選択時のみ表示） */}
          {selectedProject && (
            <Box pt={2} borderTop="1px" borderColor="gray.100">
              <Text fontSize="xs" color="gray.500">
                Project ID: {selectedProject}
              </Text>
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
};
