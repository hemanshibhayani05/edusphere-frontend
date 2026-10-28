import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "edusphere_user";
const TOKEN_KEY = "edusphere_token";
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true);

  // =========================================================================
  // SILENT REFRESH: Refresh 15-minute access token via 7-day HTTP-only cookie
  // =========================================================================
  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Sends HTTP-only refreshToken cookie
      });

      const data = await response.json();

      if (response.ok && data.success && data.accessToken) {
        setToken(data.accessToken);
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        if (data.user) {
          setUser(data.user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        }
        return data.accessToken;
      } else {
        // Refresh token expired or blacklisted
        console.warn("Refresh token expired or revoked. Logging out.");
        logoutLocally();
        return null;
      }
    } catch (err) {
      console.error("Token refresh network error:", err);
      return null;
    }
  }, []);

  // Helper to wipe local auth state
  const logoutLocally = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("instructor_user");
    localStorage.removeItem("user");
  };

  // =========================================================================
  // AUTH FETCH WRAPPER: Automatically attaches JWT & retries on expiry
  // =========================================================================
  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = { ...(options.headers || {}) };
      const currentToken = token || localStorage.getItem(TOKEN_KEY);

      if (currentToken) {
        headers["Authorization"] = `Bearer ${currentToken}`;
      }

      // Always include credentials for cookies
      const fetchOptions = {
        ...options,
        headers,
        credentials: "include",
      };

      let response = await fetch(url, fetchOptions);

      // If token expired (401 with TOKEN_EXPIRED), attempt transparent silent refresh
      if (response.status === 401) {
        const cloned = response.clone();
        try {
          const errData = await cloned.json();
          if (errData.code === "TOKEN_EXPIRED") {
            const newToken = await refreshAccessToken();
            if (newToken) {
              // Retry the original request with new token
              headers["Authorization"] = `Bearer ${newToken}`;
              return fetch(url, { ...options, headers, credentials: "include" });
            }
          }
        } catch (_) {}
      }

      return response;
    },
    [token, refreshAccessToken]
  );

  // =========================================================================
  // INITIAL AUTH VERIFICATION (on app start)
  // =========================================================================
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(STORAGE_KEY);

      if (storedToken) {
        try {
          // Verify with /api/auth/me
          const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
            credentials: "include",
          });

          const data = await res.json();

          if (res.ok && data.success && data.user) {
            setUser(data.user);
            setToken(storedToken);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
          } else if (data.code === "TOKEN_EXPIRED") {
            // Access token expired; try refreshing with 7-day cookie
            const newToken = await refreshAccessToken();
            if (!newToken && storedUser) {
              // Refresh failed, clean session
              logoutLocally();
            }
          } else {
            // Token blacklisted or invalid
            logoutLocally();
          }
        } catch (netErr) {
          // Offline fallback
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (_) {}
          }
        }
      } else {
        // No access token in storage, check if we have a valid refresh cookie
        await refreshAccessToken();
      }

      setLoading(false);
    };

    initializeAuth();
  }, [refreshAccessToken]);

  // =========================================================================
  // LOGIN (returns JWT Access Token + sets 7-day Refresh Cookie)
  // =========================================================================
  const login = async (email, password, role) => {
    if (!email || !password) {
      throw new Error("Please enter both email and password.");
    }

    const payload = {
      email: email.trim().toLowerCase(),
      password,
    };
    if (role) {
      payload.role = role.toString().trim().toLowerCase();
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Receives HTTP-only refreshToken cookie
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Login failed. Please check your credentials.");
    }

    const authenticatedUser = data.user;
    const accessToken = data.accessToken;

    setUser(authenticatedUser);
    setToken(accessToken);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem("loggedInUser", JSON.stringify(authenticatedUser));

    return authenticatedUser;
  };

  // =========================================================================
  // REGISTER (returns JWT Access Token + sets 7-day Refresh Cookie)
  // =========================================================================
  const register = async (data) => {
    const rawRole = (data.role || "student").toString().trim().toLowerCase();
    const validRoles = ["student", "admin", "instructor"];
    const normalizedRole = validRoles.includes(rawRole) ? rawRole : "student";

    const payload = {
      name: data.name?.trim(),
      email: data.email?.trim().toLowerCase(),
      password: data.password,
      phone: data.phone?.trim() || "",
      role: normalizedRole,
      department:
        data.department || (normalizedRole === "instructor" ? "Technology & Programming" : ""),
    };

    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Receives HTTP-only refreshToken cookie
      body: JSON.stringify(payload),
    });

    const resData = await response.json();

    if (!response.ok || !resData.success) {
      throw new Error(resData.message || "Registration failed.");
    }

    if (resData.accessToken) {
      setToken(resData.accessToken);
      localStorage.setItem(TOKEN_KEY, resData.accessToken);
    }
    if (resData.user) {
      setUser(resData.user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resData.user));
    }

    return resData.user;
  };

  // =========================================================================
  // LOGOUT (Blacklists tokens in MongoDB & clears HTTP-only cookie)
  // =========================================================================
  const logout = async () => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);

    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
        credentials: "include", // Sends refresh cookie to be blacklisted
      });
      console.log("🔒 Tokens successfully blacklisted on server.");
    } catch (err) {
      console.warn("Logout notification error:", err.message);
    } finally {
      logoutLocally();
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user),
    role: user?.role ? user.role.toLowerCase() : null,
    login,
    register,
    logout,
    updateUser,
    authFetch,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}