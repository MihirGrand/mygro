"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

const USER_QUERY_KEY = ["user"];
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
  Cookies.remove(TOKEN_COOKIE_KEY);
};

export const getToken = (): string | null => {
  return Cookies.get(TOKEN_COOKIE_KEY) || null;
};

export const setToken = (token: string) => {
  Cookies.set(TOKEN_COOKIE_KEY, token, { expires: 30 });
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

  const {
    data: serverUser,
    isLoading: isFetchingUser,
    refetch,
  } = useQuery<UserData | null>({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      const cookieUser = getUser();
      if (!cookieUser) return null;
      // for now just return cookie user, later implement server validation
      return cookieUser;
    },
    enabled: !!user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const signOut = () => {
    removeUser();
    setUserState(null);

    queryClient.setQueryData(USER_QUERY_KEY, null);
    queryClient.clear();
    queryClient.removeQueries();

    toast.success("Signed out successfully");
    router.push("/sign-in");
    router.refresh();
  };

  const refreshUser = async () => {
    if (!user) return;
    await refetch();
  };

  return {
    user: user || serverUser,
    isLoading: isLoading || (!!user && isFetchingUser),
    isAuthenticated: !!user,
    refetch: refreshUser,
    signOut,
  };
};

export default useUser;
