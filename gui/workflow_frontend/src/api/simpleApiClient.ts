// lib/simpleApiClient.ts
import { ApiClientManager, withErrorHandling } from "./apiManager";
import { useState } from "react";

// HTTP メソッドの型定義
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// API呼び出しのオプション
export interface ApiOptions {
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, any>; // クエリパラメータ
}

// API レスポンスの型
export interface ApiResponse<T = any> {
  data: T | null;
  error: {
    status: number;
    message: string;
    details?: any;
  } | null;
  success: boolean;
}

// HTTPメソッドからAspidaメソッド名へのマッピング
const HTTP_METHOD_MAP = {
  GET: "$get",
  POST: "$post",
  PUT: "$put",
  DELETE: "$delete",
  PATCH: "$patch",
} as const;

// メインのAPI呼び出し関数
export const apiCall = async <T = any>(
  method: HttpMethod,
  path: string,
  data?: any,
  options?: ApiOptions
): Promise<ApiResponse<T>> => {
  try {
    const client = await ApiClientManager.getInstance();

    // パスの処理
    let processedPath = path.startsWith("/") ? path.substring(1) : path;

    // パラメータ付きパスの処理（例: users/123 -> users._id(123)）
    const pathParts = processedPath.split("/");
    let currentApi = client;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];

      // 数字または文字列IDの場合
      if (i > 0 && /^[a-zA-Z0-9-_]+$/.test(part) && !currentApi[part]) {
        // 前のパートが配列的なリソースの場合、IDとして扱う
        const prevPart = pathParts[i - 1];
        if (currentApi[`_${prevPart.slice(0, -1)}`]) {
          // 複数形から単数形への変換を試行（例: users -> user）
          currentApi = currentApi[`_${prevPart.slice(0, -1)}`](part);
          continue;
        } else if (currentApi._id) {
          // 汎用的な _id メソッドを使用
          currentApi = currentApi._id(part);
          continue;
        }
      }

      if (currentApi[part]) {
        currentApi = currentApi[part];
      } else {
        throw new Error(`API path not found: ${path} (failed at: ${part})`);
      }
    }

    // HTTPメソッドに対応するaspidaメソッドを取得
    const aspidaMethod = HTTP_METHOD_MAP[method];
    if (!currentApi[aspidaMethod]) {
      throw new Error(`Method ${method} not supported for path: ${path}`);
    }

    // aspidaの呼び出しパラメータを構築
    const aspidaParams: any = {};

    if (options?.params && Object.keys(options.params).length > 0) {
      aspidaParams.query = options.params;
    }

    if (data && method !== "GET") {
      aspidaParams.body = data;
    }

    // API呼び出し実行
    const { data: responseData, error } = await withErrorHandling(async () => {
      return await currentApi[aspidaMethod](
        Object.keys(aspidaParams).length > 0 ? aspidaParams : undefined
      );
    });

    if (error) {
      return {
        data: null,
        error: {
          status: error.status || 500,
          message: error.message || "API request failed",
          details: error.details,
        },
        success: false,
      };
    }

    return {
      data: responseData,
      error: null,
      success: true,
    };
  } catch (err: any) {
    console.error(`API call failed: ${method} ${path}`, err);

    return {
      data: null,
      error: {
        status: 500,
        message: err.message || "Unexpected error occurred",
        details: err,
      },
      success: false,
    };
  }
};

// 便利なヘルパー関数
export const api = {
  get: <T = any>(path: string, options?: ApiOptions) =>
    apiCall<T>("GET", path, undefined, options),

  post: <T = any>(path: string, data?: any, options?: ApiOptions) =>
    apiCall<T>("POST", path, data, options),

  put: <T = any>(path: string, data?: any, options?: ApiOptions) =>
    apiCall<T>("PUT", path, data, options),

  patch: <T = any>(path: string, data?: any, options?: ApiOptions) =>
    apiCall<T>("PATCH", path, data, options),

  delete: <T = any>(path: string, options?: ApiOptions) =>
    apiCall<T>("DELETE", path, undefined, options),
};

// カスタムフック
export const useApiCall = () => {
  const [loading, setLoading] = useState(false);

  const callApi = async <T = any>(
    method: HttpMethod,
    path: string,
    data?: any,
    options?: ApiOptions
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    try {
      return await apiCall<T>(method, path, data, options);
    } finally {
      setLoading(false);
    }
  };

  return { callApi, loading };
};

// 認証関連のヘルパー
export const authApi = {
  // トークンリフレッシュ後にAPIクライアントをリセット
  refreshClient: async () => {
    ApiClientManager.resetInstance();
    return await ApiClientManager.getInstance();
  },

  // 強制的にクライアントを更新
  forceRefresh: async () => {
    return await ApiClientManager.forceRefresh();
  },

  // 現在のクライアントの状態確認
  hasClient: () => {
    return ApiClientManager.hasInstance();
  },
};
