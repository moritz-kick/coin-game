import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { getSocket } from "@/lib/socket";

export default function Header() {
  const { user, setUser } = useAppContext();

  const socket = getSocket();

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    socket?.disconnect();
  };

  return (
    <header className="bg-primary text-primary-foreground p-4">
      <nav className="container mx-auto flex flex-col sm:flex-row sm:justify-between items-center">
        <Link to="/" className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">
          Patrik's Coin Game
        </Link>
        <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2">
          {user && (
            <>
              <Button variant="ghost" asChild>
                <Link to="/waiting-room">Waiting Room</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/manage-account">Manage Account</Link>
              </Button>
            </>
          )}
          <Button variant="ghost" asChild>
            <Link to="/scoreboard">Scoreboard</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/rules">Rules</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/about">About the Game</Link>
          </Button>
          {user ? (
            <Button variant="secondary" onClick={logout}>
              Logout
            </Button>
          ) : (
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
