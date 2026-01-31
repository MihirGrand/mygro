import ky from "ky";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = ky.create({
  prefixUrl: API_BASE_URL,
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: Array<{
    message: string;
    code?: string;
    path?: string[];
  }>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}

// extracts error message from api response
function getErrorMessage(response: ApiResponse<unknown>): string {
  if (response.error && response.error.length > 0) {
    return response.error[0].message;
  }
  return "An unexpected error occurred";
}

export async function signIn(data: SignInRequest): Promise<User> {
  try {
    const response = await api
      .post("api/auth/signin", { json: data })
      .json<ApiResponse<User>>();

    if (!response.success || !response.data) {
      throw new Error(getErrorMessage(response));
    }

    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorResponse = await error.response.json();
      throw new Error(getErrorMessage(errorResponse));
    }
    throw error;
  }
}

export async function signUp(data: SignUpRequest): Promise<User> {
  try {
    const response = await api
      .post("api/auth/signup", { json: data })
      .json<ApiResponse<User>>();

    if (!response.success || !response.data) {
      throw new Error(getErrorMessage(response));
    }

    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorResponse = await error.response.json();
      throw new Error(getErrorMessage(errorResponse));
    }
    throw error;
  }
}

export default api;
