/**
 * Authentication Context for managing user authentication state
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  google_id?: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signIn: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing session/JWT token
        const token = localStorage.getItem('access_token');
        if (token) {
          // Validate token and get user info
          // This would make an API call to validate the JWT
          // For now, simulate loading state
          setTimeout(() => {
            setIsLoading(false);
          }, 500);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = useCallback((userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Clear session storage
      sessionStorage.clear();

      // Reset state
      setUser(null);
      setIsAuthenticated(false);
      
      // Optionally make API call to invalidate server-side session
      // await fetch('/api/auth/signout', { method: 'POST' });
      
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, []);

  const value: AuthContextValue = {
    isAuthenticated,
    user,
    isLoading,
    signOut,
    signIn
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};