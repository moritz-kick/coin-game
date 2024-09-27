import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner"; // Import the spinner
import { API, showErrorToast } from "@/lib/utils";
import useToken from "@/hooks/useToken";

// Utility function to get or create a unique device ID
const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID(); // Generate a UUID
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false); // State for loading spinner
  const navigate = useNavigate();
  const { updateToken } = useToken();

  useEffect(() => {
    // Generate or get existing device ID when the component mounts
    getOrCreateDeviceId();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // Start spinner

    try {
      const deviceId = getOrCreateDeviceId();
      const { data } = await API().post("/user/login", {
        username: username,
        deviceId: deviceId,
      });

      if (data) {
        updateToken(data.token);
        navigate("/waiting-room");
      }
    } catch (error) {
      showErrorToast(error);
    } finally {
      setLoading(false); // Stop spinner
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading} // Disable input during loading
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Spinner /> : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}