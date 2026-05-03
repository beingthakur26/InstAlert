"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import socket, { updateSocketAuth } from "@/lib/socket";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Member, Organization } from "@/types";

export interface AuthUser extends User {
  id?: string;
}

export interface AuthOrganization extends Omit<Organization, "members"> {
  members: Member[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  organization: AuthOrganization | null;
  userRole: string;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setOrganization: (org: AuthOrganization | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userRole, setUserRole] = useState<string>("member");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const userRes = await apiClient.get("/auth/me");
      setUser(userRes.data.user);
      
      try {
        const orgRes = await apiClient.get("/organization/get-my-org");
        setOrganization(orgRes.data.organization);
        setUserRole(orgRes.data.userRole || "member");
      } catch {
        setOrganization(null);
        setUserRole("member");
      }
    } catch (err) {
      setUser(null);
      setOrganization(null);
      setUserRole("member");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const res = await apiClient.post("/auth/login", credentials, {
        withCredentials: true,
      });
      setUser(res.data.user);
      
      if (res.data.token && typeof window !== "undefined") {
        localStorage.setItem("auth_token", res.data.token);
        updateSocketAuth(res.data.token);
      }
      
      try {
        const orgRes = await apiClient.get("/organization/get-my-org");
        setOrganization(orgRes.data.organization);
        setUserRole(orgRes.data.userRole || "member");
      } catch {
        setOrganization(null);
        setUserRole("member");
      }
      
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.message ||
                           (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data?.error || "Login failed";
      toast.error(errorMessage);
      throw err;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const res = await apiClient.post("/auth/register", userData);
      setUser(res.data.user);
      
      if (res.data.token && typeof window !== "undefined") {
        localStorage.setItem("auth_token", res.data.token);
        updateSocketAuth(res.data.token);
      }
      
      setOrganization(null);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
                           (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.message || "Registration failed";
      toast.error(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
      setUser(null);
      setOrganization(null);
      setUserRole("member");
      
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        updateSocketAuth(null);
      }
      
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (err) {
      console.error("Logout error", err);
      setUser(null);
      setOrganization(null);
      setUserRole("member");
      
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        updateSocketAuth(null);
      }
      
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, organization, userRole, loading, login, register, logout, refreshUser, setOrganization }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
