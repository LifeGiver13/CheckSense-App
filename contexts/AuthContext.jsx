import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "../theme/constants.jsx";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Load stored auth data and verify session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("auth_token");
        const storedUser = await AsyncStorage.getItem("auth_user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Verify session with backend
          const res = await fetch(`${API_BASE_URL}/v2/auth/verify-session`, {
            method: "GET",
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          const data = await res.json();

          if (!res.ok || !data.tokenValid) {
            await AsyncStorage.removeItem("auth_token");
            await AsyncStorage.removeItem("auth_user");
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error("Session verification error:", err);
        await AsyncStorage.removeItem("auth_token");
        await AsyncStorage.removeItem("auth_user");
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/v2/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || "Login failed" };

      setToken(data.token);
      setUser(data.user);

      await AsyncStorage.setItem("auth_token", data.token);
      await AsyncStorage.setItem("auth_user", JSON.stringify(data.user));

      if (!data.user?.profile?.defaultClass) setNeedsOnboarding(true);

      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const register = async (data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/v2/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          profile: { school: data.school },
          meta: { referralCode: data.referralCode },
        }),
      });

      const result = await res.json();
      if (!res.ok) return { success: false, error: result.message || "Registration failed" };
      return { success: true };
    } catch (err) {
      console.error("Register error:", err);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/v2/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ token }),
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("auth_user");
      setToken(null);
      setUser(null);
    }
  };

  const verifySession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("auth_token");
      if (!storedToken) return false;

      const res = await fetch(`${API_BASE_URL}/v2/auth/verify-session`, {
        method: "GET",
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      const data = await res.json();
      if (!res.ok || !data.tokenValid) {
        await AsyncStorage.removeItem("auth_token");
        await AsyncStorage.removeItem("auth_user");
        setToken(null);
        setUser(null);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Session verification error:", err);
      return false;
    }
  };

  const updateUserProfile = async (profileData) => {
    if (!user) return;

    const updatedUser = { ...user, profile: { ...(user.profile || {}), ...profileData } };
    setUser(updatedUser);
    await AsyncStorage.setItem("auth_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        needsOnboarding,
        login,
        register,
        logout,
        verifySession,
        updateUserProfile,
        setNeedsOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
