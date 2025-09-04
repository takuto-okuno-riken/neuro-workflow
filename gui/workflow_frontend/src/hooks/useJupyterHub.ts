import { useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";

interface JupyterHubConfig {
  baseUrl: string;
  apiEndpoint: string;
  isDevelopment?: boolean;
  jwtToken?: string; // 本番環境用のJWTトークン
}

interface JupyterSession {
  projectId: string;
  url: string;
  status: "starting" | "ready" | "error";
  error?: string;
}

interface UseJupyterHubReturn {
  launchJupyter: (projectId: string) => Promise<string | null>;
  isLoading: (projectId: string) => boolean;
  isReady: (projectId: string) => boolean;
  getUrl: (projectId: string) => string | null;
  getError: (projectId: string) => string | null;
  closeSession: (projectId: string) => void;
  sessions: Record<string, JupyterSession>;
}

const useJupyterHub = (
  config: JupyterHubConfig = {
    baseUrl: "http://localhost:8000",
    apiEndpoint: "/api/jupyterhub",
    isDevelopment: true, // デフォルトは開発モード
  }
): UseJupyterHubReturn => {
  const toast = useToast();
  const [sessions, setSessions] = useState<Record<string, JupyterSession>>({});

  // JupyterHubセッションを起動
  const launchJupyter = useCallback(
    async (projectId: string): Promise<string | null> => {
      try {
        // 既存のセッションがある場合はそのURLを返す
        if (sessions[projectId]?.status === "ready") {
          console.log(`Project ${projectId} session already exists`);
          return sessions[projectId].url;
        }

        // セッション状態を更新
        setSessions((prev) => ({
          ...prev,
          [projectId]: {
            projectId,
            url: "",
            status: "starting",
          },
        }));

        let jupyterUrl: string;

        if (config.isDevelopment) {
          // 開発モード: プロジェクトIDを含むURLに直接アクセス
          jupyterUrl = `${config.baseUrl}/project/${projectId}`;

          console.log(`Development mode: Accessing ${jupyterUrl}`);

          // 開発モードでは簡易待機のみ
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          // 本番モード: Django APIを通してJWT認証
          const requestBody: any = {
            project_id: projectId,
          };

          // JWTトークンが設定されている場合は追加
          if (config.jwtToken) {
            requestBody.token = config.jwtToken;
          }

          const response = await fetch(`${config.apiEndpoint}/launch/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // JWTトークンをAuthorizationヘッダーにも設定
              ...(config.jwtToken && {
                Authorization: `Bearer ${config.jwtToken}`,
              }),
            },
            credentials: "include",
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error ||
                `HTTP ${response.status}: Failed to launch JupyterHub`
            );
          }

          const data = await response.json();

          // 本番環境でもプロジェクトIDを含むURLを使用
          jupyterUrl =
            data.jupyterhub_url || `${config.baseUrl}/project/${projectId}`;

          // トークンがある場合はURLに追加（iframe用）
          if (config.jwtToken && !data.jupyterhub_url) {
            jupyterUrl += `?token=${config.jwtToken}`;
          }

          // JupyterHubの準備完了を待機
          await waitForJupyterReady(config.baseUrl, projectId);
        }

        // セッション状態を完了に更新
        setSessions((prev) => ({
          ...prev,
          [projectId]: {
            projectId,
            url: jupyterUrl,
            status: "ready",
          },
        }));

        toast({
          title: "JupyterLab Ready",
          description: config.isDevelopment
            ? `開発モード: Project "${projectId}" のJupyterLabが起動しました`
            : `Project "${projectId}" のJupyterLabが起動しました`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        return jupyterUrl;
      } catch (error) {
        console.error("JupyterHub launch error:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // セッション状態をエラーに更新
        setSessions((prev) => ({
          ...prev,
          [projectId]: {
            projectId,
            url: "",
            status: "error",
            error: errorMessage,
          },
        }));

        toast({
          title: "JupyterHub起動エラー",
          description: errorMessage,
          status: "error",
          duration: 5000,
          isClosable: true,
        });

        return null;
      }
    },
    [config, toast, sessions]
  );

  // JupyterHubの準備完了を待機
  const waitForJupyterReady = async (
    baseUrl: string,
    projectId: string,
    maxAttempts = 20
  ): Promise<void> => {
    console.log(
      `Waiting for JupyterHub to be ready for project ${projectId}...`
    );

    for (let i = 0; i < maxAttempts; i++) {
      try {
        // ヘルスチェック用のエンドポイントを確認
        // Named serverを使用している場合のパスも考慮
        const healthCheckUrl = `${baseUrl}/hub/api`;

        // フェッチリクエストを送信
        await fetch(healthCheckUrl, {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-cache",
        });

        // 最低限の待機時間（3秒）
        if (i >= 2) {
          console.log(`JupyterHub is ready for project ${projectId}`);
          return;
        }
      } catch (error) {
        // エラーは期待される（CORSなど）ので無視
      }

      // 1秒待機
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // タイムアウトしても続行（実際にはiframeで確認される）
    console.warn("JupyterHub health check timed out, but continuing...");
  };

  // セッションの状態確認ヘルパー関数
  const isLoading = useCallback(
    (projectId: string): boolean => {
      return sessions[projectId]?.status === "starting";
    },
    [sessions]
  );

  const isReady = useCallback(
    (projectId: string): boolean => {
      return sessions[projectId]?.status === "ready";
    },
    [sessions]
  );

  const getUrl = useCallback(
    (projectId: string): string | null => {
      const session = sessions[projectId];
      return session?.status === "ready" ? session.url : null;
    },
    [sessions]
  );

  const getError = useCallback(
    (projectId: string): string | null => {
      const session = sessions[projectId];
      return session?.status === "error"
        ? session.error || "Unknown error"
        : null;
    },
    [sessions]
  );

  // セッションを閉じる
  const closeSession = useCallback(
    (projectId: string) => {
      console.log(`Closing session for project ${projectId}`);

      setSessions((prev) => {
        const newSessions = { ...prev };
        delete newSessions[projectId];
        return newSessions;
      });

      toast({
        title: "セッション終了",
        description: `Project "${projectId}" のセッションを終了しました`,
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    },
    [toast]
  );

  return {
    launchJupyter,
    isLoading,
    isReady,
    getUrl,
    getError,
    closeSession,
    sessions, // デバッグ用にセッション情報も公開
  };
};

export default useJupyterHub;
