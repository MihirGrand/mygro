"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

const USER_COOKIE_KEY = "user";

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt?: string;
}

// cookie helpers
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

export const useUser = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [user, setUserState] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = getUser();
    setUserState(userData);
    setIsLoading(false);
  }, []);

  const signOut = () => {
    removeUser();
    setUserState(null);
    queryClient.clear();
    toast.success("Signed out successfully");
    router.push("/sign-in");
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    signOut,
  };
};

export default useUser;
