import { supabase, AuthError } from "./supabase";

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  data?: any;
  error?: AuthError;
}

class AuthService {
  // サインアップ
  async signUp({ email, password, name }: SignUpData): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: {
            message: this.getErrorMessage(error.message),
            status: error.status,
          },
        };
      }

      return {
        success: true,
        data: data.user,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: "An unexpected error occurred during sign up",
        },
      };
    }
  }

  // サインイン
  async signIn({ email, password }: SignInData): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: {
            message: this.getErrorMessage(error.message),
            status: error.status,
          },
        };
      }

      return {
        success: true,
        data: data.user,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: "An unexpected error occurred during sign in",
        },
      };
    }
  }

  // サインアウト
  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: {
            message: this.getErrorMessage(error.message),
          },
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: "An unexpected error occurred during sign out",
        },
      };
    }
  }

  // パスワードリセット
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return {
          success: false,
          error: {
            message: this.getErrorMessage(error.message),
          },
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: "An unexpected error occurred during password reset",
        },
      };
    }
  }

  // パスワード更新
  async updatePassword(password: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        return {
          success: false,
          error: {
            message: this.getErrorMessage(error.message),
          },
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: "An unexpected error occurred during password update",
        },
      };
    }
  }

  // 現在のユーザー取得
  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  // 認証状態の監視
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // エラーメッセージの翻訳
  private getErrorMessage(errorMessage: string): string {
    const errorMessages: { [key: string]: string } = {
      "Invalid login credentials":
        "メールアドレスまたはパスワードが正しくありません",
      "User already registered": "このメールアドレスは既に登録されています",
      "Email not confirmed": "メールアドレスが確認されていません",
      "Signup requires a valid password": "パスワードが無効です",
      "Password should be at least 6 characters":
        "パスワードは6文字以上で入力してください",
      "Invalid email": "メールアドレスの形式が正しくありません",
      "Email rate limit exceeded":
        "メール送信の制限に達しました。しばらく待ってから再試行してください",
    };

    return errorMessages[errorMessage] || errorMessage;
  }
}

export const authService = new AuthService();
