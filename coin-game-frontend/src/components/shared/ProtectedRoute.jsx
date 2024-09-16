import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token"); // Check if token exists in local storage

  return token ? children : <Navigate to="/login" />; // Redirect to login if no token
};

export default ProtectedRoute;
