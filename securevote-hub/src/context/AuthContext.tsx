import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { loginAPI, registerAPI, logoutAPI } from "@/services/auth.service";
import { ethers } from "ethers";
import contractABI from "@/abi/Voting.json";

export type UserRole = "admin" | "subadmin" | "voter";

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  walletAddress: string;
  aadhaarId: string;
  isApproved: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, walletAddress?: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  aadhaarId: string;
  role: UserRole;
  walletAddress: string;
}

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ---------------- RESTORE SESSION ---------------- */

  useEffect(() => {
    const savedToken = localStorage.getItem("bv_token");
    const savedUser = localStorage.getItem("bv_user");


    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    setIsLoading(false);


  }, []);

  /* ---------------- CONNECT WALLET ---------------- */

  const connectWallet = async () => {


    const ethereum = (window as any).ethereum;

    if (!ethereum) {
      throw new Error("MetaMask not installed");
    }

    const provider = new ethers.BrowserProvider(ethereum);

    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();

    const address = await signer.getAddress();

    return { provider, signer, address };


  };

  /* ---------------- LOGIN ---------------- */

  const login = async (email: string, password: string, walletAddress?: string) => {


    setIsLoading(true);

    try {

      let address = walletAddress;

      if (!address) {
        const connection = await connectWallet();
        address = connection.address;
      }

      const res = await loginAPI(email, password, address);

      const { user: userData, accessToken } = res.data.data;

      setUser(userData);
      setToken(accessToken);

      localStorage.setItem("bv_token", accessToken);
      localStorage.setItem("bv_user", JSON.stringify(userData));

    } finally {

      setIsLoading(false);

    }


  };

  /* ---------------- REGISTER ON BLOCKCHAIN ---------------- */

  const registerOnBlockchain = async (name: string) => {


    const { signer } = await connectWallet();

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      contractABI.abi,
      signer
    );

    const tx = await contract.registerVoter(name);

    await tx.wait();


  };

  /* ---------------- REGISTER USER ---------------- */

  const register = async (data: RegisterData) => {


    setIsLoading(true);

    try {

      const { address } = await connectWallet();

      /* Register voter on blockchain first */

      if (data.role === "voter") {
        await registerOnBlockchain(data.fullName);
      }

      const res = await registerAPI({
        ...data,
        walletAddress: address
      });

      const { user: userData, accessToken } = res.data.data;

      setUser(userData);
      setToken(accessToken);

      localStorage.setItem("bv_token", accessToken);
      localStorage.setItem("bv_user", JSON.stringify(userData));

    } finally {

      setIsLoading(false);

    }


  };

  /* ---------------- LOGOUT ---------------- */

  const logout = async () => {


    try {
      await logoutAPI();
    } catch { }

    setUser(null);
    setToken(null);

    localStorage.removeItem("bv_token");
    localStorage.removeItem("bv_user");


  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {

  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}
