import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import student_api from "../api/student-api";
import admin_api from "../api/admin-api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const getApi = (isAdmin) => {
    
    const api = isAdmin ? admin_api : student_api;
    return api;
  };

  useEffect(() => {
    const validateAuth = async () => {
      const storedAuth = localStorage.getItem("auth");
      if (storedAuth) {
        try {
          const parsedAuth = JSON.parse(storedAuth);
          const isAdmin = parsedAuth?.role === 'admin';
          const api = getApi(isAdmin);
          
          const response = await api.get('/validate');

          if (response.data && response.data.status === 'success') {
            setAuth(parsedAuth);
          } else {
            throw new Error('Invalid validation response');
          }
        } catch (error) {
          console.error('Validation error:', error);
          
          // Clear auth state for all 401 errors
          if (error.response?.status === 401) {
            localStorage.removeItem("auth");
            setAuth(null);
            
            // Show specific error messages based on the error
            const errorMessage = error.response?.data?.message;
            
          }
        }
      }
      setIsLoading(false);
    };
    
    validateAuth();
  }, []);

  const login = async (ldapId, password, isAdmin) => {
    const api = isAdmin ? admin_api : student_api;
    setIsLoading(true);
    try {
      const { data } = await api.post("/login", { username: ldapId, password });
      if (data.success) {
        const authData = isAdmin 
          ? { role: 'admin' }
          : { 
              userData: data.user, 
              role: data.user.role,
              user: data.user 
            };
        setAuth(authData);
        localStorage.setItem("auth", JSON.stringify(authData));
        toast.success('Successfully logged in!', {
          toastId: 'login-success'
        });
      } else {
        throw new Error(data.message || "Authentication failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuth(null);
      localStorage.removeItem("auth");
      toast.error(error.response?.data?.message || 'Login failed. Please try again.', {
        toastId: 'login-error'
      });
      throw error.response?.data?.message || error.message || "Authentication failed";
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const api = auth?.role === 'admin' ? admin_api : student_api;
    setIsLoading(true);
    try {
      await api.post("/logout");
      toast.info('You have been logged out successfully.', {
        toastId: 'logout-success'
      });
    } catch (error) {
      console.error("Logout error:", error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.', {
          toastId: 'logout-error'
        });
      }
    } finally {
      setAuth(null);
      localStorage.removeItem("auth");
      setIsLoading(false);
      navigate("/");
    }
  };

  // Prevent navigation during loading
  useEffect(() => {
    if (auth === null && !isLoading) {
      navigate("/", { replace: true });
    }
  }, [auth, navigate, isLoading]);

  return (
    <AuthContext.Provider value={{ auth, login, logout, isLoading, setIsLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;