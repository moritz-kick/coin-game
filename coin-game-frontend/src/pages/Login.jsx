import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { API, showErrorToast } from "@/lib/utils";
import axios from "axios";
import { useAppContext } from "@/context/AppContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const { updateToken } = useAppContext();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const { data: IPDATA } = await axios.get(
        "https://api.ipify.org/?format=json"
      );

      const { data } = await API().post("/user/login", {
        username: username,
        deviceId: IPDATA.ip,
      });

      if (data) {
        updateToken(data.token);
        navigate("/waiting-room");
      }
    } catch (error) {
      showErrorToast(error);
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
          />
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
