import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Box,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Badge,
  IconButton,
  Tooltip,
  VStack,
  useToast,
  Code,
} from '@chakra-ui/react';
import { ExternalLinkIcon, RepeatIcon, SettingsIcon, CopyIcon } from '@chakra-ui/icons';

interface JupyterModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  title?: string;
  jupyterBaseUrl?: string;
  isDevelopment?: boolean; // 開発モード切り替え
  jwtToken?: string; // 本番環境用のJWTトークン
}

interface JupyterStatus {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  url: string | null;
}

const JupyterModal: React.FC<JupyterModalProps> = ({
  isOpen,
  onClose,
  projectId,
  title = "Jupyter Lab",
  jupyterBaseUrl = "http://localhost:8000",
  isDevelopment = true, // デフォルトは開発モード
  jwtToken, // 本番環境用
}) => {

  const toast = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<JupyterStatus>({
    isLoading: false,
    isReady: false,
    error: null,
    url: null
  });

  // JupyterHubの起動とURL取得
  const initializeJupyter = async () => {
    if (!projectId) {
      setStatus({
        isLoading: false,
        isReady: false,
        error: "プロジェクトIDが指定されていません",
        url: null
      });
      return;
    }

    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let jupyterUrl: string;

      if (isDevelopment) {
        // 開発モード: プロジェクトIDを含むURLに直接アクセス
        jupyterUrl = `http://localhost:8000/hub/login?username=user1&password=password`;
        
        console.log(`Development mode: Initializing Jupyter for project ${projectId}`);
        console.log(`URL: ${jupyterUrl}`);
        
        // 簡易的な待機（実際のヘルスチェックは省略）
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } else {
        // 本番モード: Django APIを通してJWT認証
        const requestBody: any = {
          project_id: projectId,
        };

        // JWTトークンが利用可能な場合は追加
        if (jwtToken) {
          requestBody.token = jwtToken;
        }

        console.log(`Production mode: Requesting Jupyter for project ${projectId}`);

        const response = await fetch('/api/jupyterhub/launch/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // JWTトークンをAuthorizationヘッダーにも設定
            ...(jwtToken && {
              'Authorization': `Bearer ${jwtToken}`
            }),
          },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to launch JupyterHub`);
        }

        const data = await response.json();
        
        // 本番環境でもプロジェクトIDを含むURLを使用
        jupyterUrl = data.jupyterhub_url || 
                    `${jupyterBaseUrl}/project/${projectId}`;

        // トークンがある場合はURLに追加（iframe用）
        if (jwtToken && !data.jupyterhub_url) {
          jupyterUrl += `?token=${jwtToken}`;
        }
        
        console.log(`Production URL: ${jupyterUrl}`);
        
        // JupyterHubの準備完了を待機
        await waitForJupyterReady(jupyterBaseUrl, projectId);
      }
      
      setStatus({
        isLoading: false,
        isReady: true,
        error: null,
        url: jupyterUrl
      });

      toast({
        title: "Jupyter Lab Ready",
        description: isDevelopment 
          ? `Project "${projectId}" のJupyterLabが起動しました（開発モード）` 
          : `Project "${projectId}" のJupyterLabが起動しました`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('JupyterHub initialization error:', error);
      
      const errorMessage = error instanceof Error ? error.message : "起動に失敗しました";
      
      setStatus({
        isLoading: false,
        isReady: false,
        error: errorMessage,
        url: null
      });

      toast({
        title: "JupyterHub起動エラー",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // JupyterHubの準備完了を待機
  const waitForJupyterReady = async (
    baseUrl: string, 
    projectId: string,
    maxAttempts = 30
  ): Promise<void> => {
    console.log(`Waiting for JupyterHub to be ready for project ${projectId}...`);
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        // CORSエラーを避けるため、ヘルスチェック用のエンドポイントを使用
        const healthCheckUrl = `${baseUrl}/hub/api`;
        
        await fetch(healthCheckUrl, { 
          method: 'HEAD',
          mode: 'no-cors' // CORSエラーを避ける
        });
        
        // no-corsモードでは常に opaque response が返される
        // 実際の起動確認は時間ベースで行う
        if (i >= 3) { // 最低3秒は待機
          console.log(`JupyterHub is ready for project ${projectId}`);
          return;
        }
      } catch (error) {
        // エラーは無視して続行
      }
      
      // 1秒待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('JupyterHubの起動がタイムアウトしました');
  };

  // モーダルが開かれた時にJupyterを初期化
  useEffect(() => {
    if (isOpen && projectId && !status.isReady && !status.isLoading) {
      initializeJupyter();
    }
  }, [isOpen, projectId]);

  // プロジェクトIDが変更された場合はステータスをリセット
//   useEffect(() => {
//     if (!isOpen || !projectId) {
//       setStatus({
//         isLoading: false,
//         isReady: false,
//         error: null,
//         url: null
//       });
//     }
//   }, [isOpen, projectId]);

  // 再試行
  const handleRetry = () => {
    initializeJupyter();
  };

  // 新しいタブで開く
  const handleOpenInNewTab = () => {
    if (status.url) {
      window.open(status.url, '_blank');
    }
  };

  // URLをコピー
  const handleCopyUrl = () => {
    if (status.url) {
      navigator.clipboard.writeText(status.url);
      toast({
        title: "copy",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // iframe のロードエラーハンドラー
  const handleIframeError = () => {
    console.error('iframe load error');
    setStatus(prev => ({
      ...prev,
      error: "JupyterLabの読み込みに失敗しました"
    }));
  };

  // iframe のロード成功ハンドラー
  const handleIframeLoad = () => {
    console.log('iframe loaded successfully');
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="full"
      closeOnOverlayClick={false}
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent 
        maxW="95vw" 
        maxH="95vh" 
        m={4}
        bg="white"
        borderRadius="lg"
        overflow="hidden"
      >
        <ModalHeader 
          bg="gray.700" 
          borderBottom="1px" 
          borderColor="gray.200"
          py={3}
        >
          <HStack justify="space-between" align="center">
            <HStack spacing={3}>
              <Text fontWeight="bold" fontSize="sm">
                {title}
              </Text>
              {projectId && (
                <Badge colorScheme="purple" variant="subtle">
                  Project: {projectId}
                </Badge>
              )}
              
              {/* 開発/本番モード表示 */}
              <Badge 
                colorScheme={isDevelopment ? "green" : "blue"} 
                variant="outline" 
                size="sm"
              >
                {isDevelopment ? "Development" : "Production"}
              </Badge>
            </HStack>
            
            <HStack spacing={2}>
              {status.isReady && (
                <>
                  <Tooltip label="URLをコピー">
                    <IconButton
                      aria-label="URLをコピー"
                      icon={<CopyIcon />}
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyUrl}
                    />
                  </Tooltip>
                  
                  <Tooltip label="新しいタブで開く">
                    <IconButton
                      aria-label="新しいタブで開く"
                      icon={<ExternalLinkIcon />}
                      size="sm"
                      variant="ghost"
                      onClick={handleOpenInNewTab}
                    />
                  </Tooltip>
                  
                  <Tooltip label="リロード">
                    <IconButton
                      aria-label="リロード"
                      icon={<RepeatIcon />}
                      size="sm"
                      variant="ghost"
                      onClick={handleRetry}
                    />
                  </Tooltip>
                </>
              )}
              
              <Tooltip label="設定">
                <IconButton
                  aria-label="設定"
                  icon={<SettingsIcon />}
                  size="sm"
                  variant="ghost"
                  isDisabled
                />
              </Tooltip>
            </HStack>
          </HStack>
        </ModalHeader>
        
        <ModalCloseButton 
          size="lg"
          top={2}
          right={2}
          bg="white"
          _hover={{ bg: "gray.100" }}
        />
        
        <ModalBody p={0} bg="gray.50">
          {status.isLoading && (
            <VStack 
              justify="center" 
              align="center" 
              h="70vh"
              spacing={4}
            >
              <Spinner size="xl" color="purple.500" thickness="4px" />
              <VStack spacing={2} textAlign="center">
                <Text fontSize="lg" fontWeight="semibold">
                  JupyterLabを起動中...
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Project ID: <Code>{projectId}</Code>
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {isDevelopment 
                    ? "開発モード（認証なし・自動ログイン）" 
                    : "本番モード（JWT認証・ユーザー環境準備中）"
                  }
                </Text>
              </VStack>
            </VStack>
          )}
          
          {status.error && (
            <Box p={8}>
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>起動エラー</AlertTitle>
                  <AlertDescription mt={2}>
                    {status.error}
                  </AlertDescription>
                  {projectId && (
                    <Text fontSize="sm" color="gray.600" mt={2}>
                      Project ID: <Code>{projectId}</Code>
                    </Text>
                  )}
                </Box>
              </Alert>
              
              <HStack mt={4} justify="center">
                <Button 
                  colorScheme="red" 
                  variant="outline"
                  onClick={handleRetry}
                  leftIcon={<RepeatIcon />}
                >
                  再試行
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  閉じる
                </Button>
              </HStack>
            </Box>
          )}
          
          {status.isReady && status.url && (
            <Box h="calc(95vh - 120px)" w="100%">
              <iframe
                ref={iframeRef}
                src={status.url}
                width="100%"
                height="100%"
                style={{
                  border: 'none',
                  borderRadius: '0 0 8px 8px',
                  backgroundColor: 'white'
                }}
                title={`Jupyter Lab - Project ${projectId}`}
                onError={handleIframeError}
                onLoad={handleIframeLoad}
                sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-modals allow-popups allow-popups-to-escape-sandbox"
              />
            </Box>
          )}
        </ModalBody>
        
        <ModalFooter 
          bg="gray.50" 
          borderTop="1px" 
          borderColor="gray.200"
          py={2}
        >
          <HStack spacing={3} justify="space-between" w="100%">
            <HStack spacing={2}>
              {status.isReady && (
                <>
                  <Text fontSize="xs" color="gray.500">
                    💡 Tip: Ctrl+S でノートブックを保存
                  </Text>
                  <Text fontSize="xs" color="gray.400">|</Text>
                  <Text fontSize="xs" color="gray.500">
                    📁 作業フォルダ: /projects/{projectId}
                  </Text>
                </>
              )}
            </HStack>
            
            <Button variant="ghost" onClick={onClose} size="sm">
              閉じる
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default JupyterModal;
