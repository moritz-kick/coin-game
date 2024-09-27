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
      <header className="bg-primary text-primary-foreground p-4 md:p-4 sm:p-2">
      <nav className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl sm:text-xl font-bold">
          Patrik's Coin Game
        </Link>
        <div className="space-x-4 sm:space-x-2 flex flex-wrap">
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
            <Button variant="secondary" asChild onClick={logout}>
              <Link to="/">Logout</Link>
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
