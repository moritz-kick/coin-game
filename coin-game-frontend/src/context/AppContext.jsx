import { getSocket } from "@/lib/socket";
import { API, showErrorToast } from "@/lib/utils";
import { createContext, useContext, useEffect, useState } from "react";

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const updateToken = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const socket = getSocket();

  useEffect(() => {
    if (!token && !user) return;

    if (token && !user) {
      (async () => {
        try {
          const { data } = await API().get("/user");

          setUser(data.user);
        } catch (error) {
          showErrorToast(error);
        }
      })();
    }
  }, [token, user]);

  useEffect(() => {
    if (user) {
      socket.emit("joinWaitingRoom", user?._id);
    }
  }, [user]);

  return (
    <AppContext.Provider value={{ user, setUser, updateToken }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
