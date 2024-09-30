import { Navigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Spinner } from "@/components/ui/spinner";

const ProtectedRoute = ({ children }) => {
  const { user, loading, token } = useAppContext();

  if (loading) {
    return <Spinner aria-label="Loading user data" />;
  }

  return user || token ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
