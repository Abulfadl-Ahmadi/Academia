import {
  markLoggedIn,
  markLoggedOut,
} from "@/lib/axios";
import axiosInstance from "@/lib/axios";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type User = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "student" | "teacher";
  id: number;
};

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  fetchUser: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axiosInstance.get("/profiles/", {
        withCredentials: true,
      });
      
      console.log("API Response:", res.data); // Debug log
      
      // Handle both old format (array) and new format (pagination object)
      let userData;
      if (res.data.results && Array.isArray(res.data.results)) {
        // New pagination format
        userData = res.data.results[0];
        console.log("Using pagination format, userData:", userData);
      } else if (Array.isArray(res.data)) {
        // Old array format
        userData = res.data[0];
        console.log("Using array format, userData:", userData);
      } else {
        throw new Error("Invalid response format");
      }
      
      if (!userData) {
        throw new Error("No user data found");
      }
      
      const {
        user: {
          username,
          first_name,
          last_name,
          email,
          role,
          id,
        },
      } = userData;
      setUser({
        username,
        first_name,
        last_name,
        email,
        role,
        id,
      });
      console.log("User set successfully:", { username, first_name, last_name, email, role, id });
      markLoggedIn();
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setUser(null);
      markLoggedOut();
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    // Just fetch user — assumes HttpOnly cookie already set by server after login
    await fetchUser();
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/api/logout/", {}, {
        withCredentials: true,
      });
    } catch (e) {
      console.warn("Logout failed:", e);
    } finally {
      setUser(null);
      markLoggedOut();
      window.location.href = "/login";
    }
  };

  return (
    <UserContext.Provider
      value={{ user, setUser, loading, fetchUser, login, logout }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
}
