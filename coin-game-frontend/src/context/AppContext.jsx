import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API, showErrorToast } from "@/lib/utils";
import { initSocket, getSocket } from "@/lib/socket";
import useToken from "@/hooks/useToken";

const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const { token, updateToken } = useToken(); // Use the useToken hook
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize socket connection when the component mounts
  useEffect(() => {
    initSocket();
  }, []);

  const socket = getSocket();

  // Fetch user data if token exists
  useEffect(() => {
    if (token) {
      (async () => {
        try {
          console.log("Token found, attempting to fetch user...");
          const { data } = await API().get("/user/get-user");
          console.log("User data fetched:", data.user);
          setUser(data.user);
        } catch (error) {
          console.error("Error fetching user:", error.response?.data || error.message);
          showErrorToast("Session expired, please log in again.");
          localStorage.removeItem("token");
          updateToken(null);
          setUser(null);
          navigate("/login");
        } finally {
          setLoading(false);
        }
      })();
    } else {
      console.log("No token found in localStorage.");
      setLoading(false);
    }
  }, [token, navigate, updateToken]);

  // Join the waiting room when user is set
  useEffect(() => {
    if (user) {
      console.log("User logged in, joining waiting room...");
      socket.emit("joinWaitingRoom", user._id);
    }
  }, [user, socket]);

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    updateToken(null);
    setUser(null);
    navigate("/login");
  };

  // Delete user account
  const deleteUserAccount = async () => {
    try {
      await API().delete("/user/delete-account");
      logout();
    } catch (error) {
      showErrorToast("Error deleting account. Please try again.");
    }
  };

  // Change username
  const changeUsername = async (newUsername) => {
    try {
      const response = await API().put("/user/update-username", {
        username: newUsername,
      });
      setUser(response.data.user);
    } catch (error) {
      showErrorToast("Error updating username. Please try again.");
    }
  };

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