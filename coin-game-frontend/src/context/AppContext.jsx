import { getSocket } from "@/lib/socket";
import { API, showErrorToast } from "@/lib/utils";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useToken from "@/hooks/useToken"; // Import the useToken hook

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const { token, updateToken } = useToken(); // Use the useToken hook
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      (async () => {
        try {
          const { data } = await API().get("/user", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          setUser(data.user);
        } catch (error) {
          showErrorToast("Session expired, please log in again.");
          localStorage.removeItem("token");
          setUser(null);
          navigate("/login");
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [token, navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const deleteUserAccount = async () => {
    try {
      await API().delete("/user/delete-account", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      logout();
      navigate("/login");
    } catch (error) {
      showErrorToast("Error deleting account. Please try again.");
    }
  };

  const changeUsername = async (newUsername) => {
    try {
      const response = await API().put(
        "/user/update-username",
        { username: newUsername },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUser(response.data.user);
    } catch (error) {
      showErrorToast("Error updating username. Please try again.");
    }
  };

  const socket = getSocket();

  useEffect(() => {
    if (user) {
      socket.emit("joinWaitingRoom", user?._id);
    }
  }, [user, socket]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        loading,
        updateToken,
        logout,
        deleteUserAccount,
        changeUsername,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
