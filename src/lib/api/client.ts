import { ApiResponse } from "../types";

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (
    typeof window !== "undefined" &&
    (window.location.hostname.includes("vercel.app") ||
      window.location.hostname !== "localhost")
  ) {
    return "https://inventory-backend-mauve-pi.vercel.app/api";
  }
  return "http://localhost:5000/api";
};

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        // Handle token expiration or unauthenticated
        if (response.status === 401 && typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          if (!window.location.pathname.startsWith("/login")) {
            window.location.href = "/login?expired=true";
          }
        }

        // Handle forced password change
        if (
          response.status === 403 &&
          data.code === "PASSWORD_CHANGE_REQUIRED" &&
          typeof window !== "undefined"
        ) {
          if (!window.location.pathname.startsWith("/change-password")) {
            window.location.href = "/change-password?required=true";
          }
        }

        const error = new Error(
          data.message || "API request failed",
        ) as Error & {
          code?: string;
          errors?: Record<string, string>;
          status?: number;
        };
        error.code = data.code;
        error.errors = data.errors;
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (err: any) {
      if (err.status) throw err;
      throw new Error(err.message || "Network connection failed");
    }
  }

  get<T>(
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          searchParams.append(key, String(val));
        }
      });
      const queryStr = searchParams.toString();
      if (queryStr) {
        url += (url.includes("?") ? "&" : "?") + queryStr;
      }
    }
    return this.request<T>(url, { method: "GET" });
  }

  post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient();
