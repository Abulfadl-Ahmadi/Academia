import {
  markLoggedIn,
  markLoggedOut,
  isLogin,
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
      const userData = res.data[0];
      const{
        user: {
          username,
          email,
          role,
          id,
        },
      } = userData;
      setUser({
        username,
        email,
        role,
        id,
      });
      // console.log("User fetched:", res.data);
      markLoggedIn();
    } catch (err) {
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
