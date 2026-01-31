import Cookies from "js-cookie";

const USER_COOKIE_KEY = "pca_user";
const TOKEN_COOKIE_KEY = "pca_token";

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: "PARENT" | "ADMIN";
  createdAt?: string;
  updatedAt?: string;
}

export const getUser = (): UserData | null => {
  const userData = Cookies.get(USER_COOKIE_KEY);
  if (!userData) return null;
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

export const setUser = (user: UserData) => {
  Cookies.set(USER_COOKIE_KEY, JSON.stringify(user), { expires: 30 });
};

export const removeUser = () => {
  Cookies.remove(USER_COOKIE_KEY);
  Cookies.remove(TOKEN_COOKIE_KEY);
};

export const getToken = (): string | null => {
  return Cookies.get(TOKEN_COOKIE_KEY) || null;
};

export const setToken = (token: string) => {
  Cookies.set(TOKEN_COOKIE_KEY, token, { expires: 30 });
};

export const isAuthenticated = (): boolean => {
  return !!getUser() && !!getToken();
};

export const clearAuth = () => {
  removeUser();
};
