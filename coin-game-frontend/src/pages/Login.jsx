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
import { Spinner } from "@/components/ui/spinner";
import { API, showErrorToast } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";

// Utility function to get or create a unique device ID
const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }
  console.log("Device ID:", deviceId); // Log device ID
  return deviceId;
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { updateToken } = useAppContext();

  useEffect(() => {
    // Generate or get existing device ID when the component mounts
    getOrCreateDeviceId();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Attempting login for username:", username);

    try {
      const deviceId = getOrCreateDeviceId();
      const { data } = await API().post("/user/login", {
        username: username,
        deviceId: deviceId,
      });

      console.log("Login response:", data);

      if (data && data.token) {
        console.log("Token received, updating...");
        updateToken(data.token);
        console.log("Token updated, navigating to waiting room...");
        navigate("/waiting-room");
      } else {
        console.error("No token received in response");
        showErrorToast("Login failed: No token received");
      }
    } catch (error) {
      // Handle if the username is already taken
      if (error.response?.status === 400 && error.response?.data?.error === "Username is already taken. Please choose a different one.") {
        showErrorToast("Username is already taken. Please choose a different one.");
      } else {
        console.error("Login error:", error.response?.data || error.message);
        showErrorToast(`Login failed: ${error.response?.data?.error || error.message}`);
      }
    } finally {
      setLoading(false);
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
            disabled={loading}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Spinner /> : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
