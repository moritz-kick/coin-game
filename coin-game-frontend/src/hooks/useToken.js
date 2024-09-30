import { useState, useEffect, useCallback } from "react";

const useToken = () => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const updateToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem("token");
      setToken(null);
    }
  }, []);

  return { token, updateToken };
};

export default useToken;
