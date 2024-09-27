import { Navigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import Spinner from "@/components/ui/spinner";
import useToken from "@/hooks/useToken";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAppContext();
  const { token } = useToken();

  if (loading) {
    return <Spinner aria-label="Loading user data" />;
  }

  return user || token ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
