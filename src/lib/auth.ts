import Cookies from "js-cookie";

const USER_COOKIE_KEY = "user";

export interface UserData {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
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
};

export const isAuthenticated = (): boolean => {
  return !!getUser();
};

export const clearAuth = () => {
  removeUser();
};
