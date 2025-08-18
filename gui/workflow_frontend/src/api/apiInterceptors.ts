import { supabase } from "../auth/supabase";
import { createAuthHeaders } from "./authHeaders";
import { isDebugMode } from "./config";

// リクエストインターセプター
export const onRequest = async (
  url: string,
  requestConfig: RequestInit
): Promise<RequestInit> => {
  // 毎回最新のトークンを取得
  const freshHeaders = await createAuthHeaders();
  requestConfig.headers = {
    ...requestConfig.headers,
    ...freshHeaders,
  };

  // リクエストログ
  if (isDebugMode()) {
    console.log(`🚀 API Request: ${requestConfig.method || "GET"} ${url}`);
    console.log("Headers:", requestConfig.headers);
  }

  return requestConfig;
};

// レスポンスインターセプター
export const onResponse = async (response: Response): Promise<Response> => {
  if (isDebugMode()) {
    console.log(`✅ API Response: ${response.status} ${response.url}`);
  }

  // 401エラー処理（認証失敗）
  if (response.status === 401) {
    console.warn("🔒 Unauthorized - token may be expired");

    // 自動ログアウト
    try {
      await supabase.auth.signOut();

      // ログインページにリダイレクト
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error during automatic logout:", error);
    }
  }

  // 403エラー処理（権限不足）
  if (response.status === 403) {
    console.warn("🚫 Forbidden - insufficient permissions");

    // 必要に応じてユーザーに通知
    if (typeof window !== "undefined") {
      // トースト通知などでユーザーに伝える
      console.warn(
        "Access denied: You do not have permission to perform this action"
      );
    }
  }

  // 500エラー処理（サーバーエラー）
  if (response.status >= 500) {
    console.error("🔥 Server Error:", response.status);

    // サーバーエラーの場合は詳細ログを記録
    if (isDebugMode()) {
      console.error("Response details:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });
    }
  }

  return response;
};

// エラーハンドリング
export const onError = (error: Error): never => {
  if (isDebugMode()) {
    console.error("❌ API Error:", error);
  }

  // ネットワークエラー
  if (error.name === "TypeError" && error.message.includes("fetch")) {
    console.error("🌐 Network error - server may be down");

    // ネットワークエラーの場合はより詳細な情報を提供
    const networkError = new Error(
      "Network connection failed. Please check your internet connection and try again."
    );
    networkError.name = "NetworkError";
    throw networkError;
  }

  // タイムアウトエラー
  if (error.message.includes("timeout")) {
    const timeoutError = new Error("Request timed out. Please try again.");
    timeoutError.name = "TimeoutError";
    throw timeoutError;
  }

  throw error;
};

// レスポンスデータの解析
export const parseResponse = async (response: Response): Promise<any> => {
  const contentType = response.headers.get("content-type");

  try {
    if (contentType?.includes("application/json")) {
      return await response.json();
    } else if (contentType?.includes("text/")) {
      return await response.text();
    } else {
      return await response.blob();
    }
  } catch (error) {
    console.error("Error parsing response:", error);
    throw new Error("Failed to parse response data");
  }
};
