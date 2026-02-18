
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { authApi, setAuthToken } from '../lib/api';

export interface User {
  username: string;
  role: string;
  userId?: number;
  fName?: string;
  lName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for token in cookies on mount
    const token = Cookies.get('access_token');
    
    if (token) {
      try {
        const decoded = jwtDecode<User>(token);
        // Check for expiration
        const currentTime = Date.now() / 1000;
        if ((decoded as any).exp && (decoded as any).exp < currentTime) {
           logout();
        } else {
            console.log("Found valid token, setting user:", decoded);
            setUser(decoded);
            setAuthToken(token);
        }

      } catch (error) {
        console.error('Invalid token:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = (token: string) => {
    Cookies.set('access_token', token, { expires: 1 }); // Expires in 1 day
    setAuthToken(token);
    const decoded = jwtDecode<User>(token);
    setUser(decoded);
    
    // Redirect based on role
    const role = decoded.role.toLowerCase();
    console.log(`Logging in as ${role}`);
    
    if (role === 'admin') router.push('/admin');
    else if (role === 'staff') router.push('/staff');
    else router.push('/student');
  };

  const logout = () => {
    Cookies.remove('access_token');
    setAuthToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
