import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../api/axios";
import { login as loginApi } from "../api/auth";

export interface CurrentUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  employee_no: string;
  phone: string;
  organization: number | null;
  role_names: string[];
}

interface AuthContextType {
  user: CurrentUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// ==========================================================
// SESSION SETTINGS
// ==========================================================

// 30 minutes of inactivity
const IDLE_TIMEOUT = 30 * 60 * 1000;

// Store the last activity time so that refreshing the page
// does not reset the inactivity timer.
const LAST_ACTIVITY_KEY = "solarhub_last_activity";

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const idleTimerRef = useRef<number | null>(null);

  // ========================================================
  // CLEAR SESSION
  // ========================================================

  const clearSession = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem(LAST_ACTIVITY_KEY);

    setUser(null);
  };

  // ========================================================
  // LOGOUT
  // ========================================================

  const logout = () => {
    clearSession();
  };

  // ========================================================
  // LOAD CURRENT USER
  // ========================================================

  const loadCurrentUser = async () => {
    try {
      const response = await api.get<CurrentUser>("/auth/me/");

      setUser(response.data);

      // Start/update activity tracking after successful login
      localStorage.setItem(
        LAST_ACTIVITY_KEY,
        Date.now().toString()
      );
    } catch (error: any) {
      console.error(
        "Failed to load current user:",
        error
      );

      clearSession();
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // LOGIN
  // ========================================================

  const login = async (
    username: string,
    password: string
  ) => {
    const data = await loginApi(username, password);

    localStorage.setItem(
      "access_token",
      data.access
    );

    localStorage.setItem(
      "refresh_token",
      data.refresh
    );

    // Start inactivity timer from login
    localStorage.setItem(
      LAST_ACTIVITY_KEY,
      Date.now().toString()
    );

    await loadCurrentUser();
  };

  // ========================================================
  // ACTIVITY TRACKING
  // ========================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    const updateActivity = () => {
      localStorage.setItem(
        LAST_ACTIVITY_KEY,
        Date.now().toString()
      );
    };

    // User activity events
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      window.addEventListener(
        event,
        updateActivity
      );
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(
          event,
          updateActivity
        );
      });
    };
  }, [user]);

  // ========================================================
  // IDLE CHECK
  // ========================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    const checkIdle = () => {
      const lastActivity = Number(
        localStorage.getItem(
          LAST_ACTIVITY_KEY
        )
      );

      if (!lastActivity) {
        localStorage.setItem(
          LAST_ACTIVITY_KEY,
          Date.now().toString()
        );

        return;
      }

      const idleTime =
        Date.now() - lastActivity;

      if (idleTime >= IDLE_TIMEOUT) {
        console.log(
          "SolarHub session expired due to inactivity."
        );

        clearSession();
      }
    };

    // Check every 30 seconds
    idleTimerRef.current = window.setInterval(
      checkIdle,
      30 * 1000
    );

    // Check immediately
    checkIdle();

    return () => {
      if (idleTimerRef.current !== null) {
        window.clearInterval(
          idleTimerRef.current
        );
      }
    };
  }, [user]);

  // ========================================================
  // INITIAL SESSION CHECK
  // ========================================================

  useEffect(() => {
    const accessToken =
      localStorage.getItem(
        "access_token"
      );

    if (!accessToken) {
      setLoading(false);
      return;
    }

    // Check whether the previous session was idle
    const lastActivity = Number(
      localStorage.getItem(
        LAST_ACTIVITY_KEY
      )
    );

    if (
      lastActivity &&
      Date.now() - lastActivity >=
        IDLE_TIMEOUT
    ) {
      console.log(
        "Previous SolarHub session expired due to inactivity."
      );

      clearSession();
      setLoading(false);
      return;
    }

    loadCurrentUser();
  }, []);

  // ========================================================
  // CONTEXT
  // ========================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================================
// USE AUTH
// ==========================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};