import { Navigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import Spinner from "@/components/ui/Spinner";
import useToken from "@/hooks/useToken";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAppContext();
  const { token } = useToken();

  if (loading) {
    return <Spinner />;
  }

  return user || token ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
