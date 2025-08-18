import aspida from "@aspida/fetch";
import api from "@/api/$api";
import { getApiConfig } from "./config";
import { createAuthHeaders } from "./authHeaders";
import { onRequest, onResponse, onError } from "./apiInterceptors";

// APIクライアントの作成
const createApiClient = async () => {
  const config = getApiConfig();
  const headers = await createAuthHeaders();

  return api(
    aspida(fetch, {
      baseURL: config.baseURL,
      headers,
      timeout: config.timeout,
      onRequest,
      onResponse,
      onError,
    })
  );
};

// シングルトンパターンでAPIクライアントを管理
class ApiClientManager {
  private static instance: ReturnType<typeof api> | null = null;
  private static isInitializing = false;

  static async getInstance(): Promise<ReturnType<typeof api>> {
    if (this.isInitializing) {
      // 初期化中の場合は完了まで待機
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    if (!this.instance) {
      this.isInitializing = true;
      try {
        this.instance = await createApiClient();
      } finally {
        this.isInitializing = false;
      }
    }

    return this.instance;
  }

  // トークン更新時にインスタンスをリセット
  static resetInstance(): void {
    this.instance = null;
  }

  // 強制的に新しいインスタンスを作成
  static async forceRefresh(): Promise<ReturnType<typeof api>> {
    this.instance = null;
    return this.getInstance();
  }

  // インスタンスの状態確認
  static hasInstance(): boolean {
    return this.instance !== null;
  }
}

export { ApiClientManager };

// API呼び出し用ヘルパー関数
export const withErrorHandling = async <T>(
  apiCall: () => Promise<T>
): Promise<{ data: T | null; error: any }> => {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error: any) {
    console.error("API call failed:", error);

    const apiError = {
      status: error.status || 500,
      message: error.message || "Unknown error occurred",
      details: error.response?.data,
      name: error.name || "ApiError",
    };

    return { data: null, error: apiError };
  }
};
