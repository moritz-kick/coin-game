import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RefreshCw } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";
import { API, showErrorToast } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function WaitingRoom() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { user: loggedInUser } = useAppContext();

  const navigate = useNavigate();

  const socket = getSocket();

  const [selectedLevels, setSelectedLevels] = useState("1");
  const [isOpen, setIsOpen] = useState(false);

  const levelOptions = ["1", "3", "5", "10"];

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await API().get("/user/online-users");

      setUsers(data.users);
    } catch (error) {
      showErrorToast(error);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlayRequest = (challengedId) => {
    socket.emit("challengeUser", {
      challengerId: loggedInUser._id,
      challengedId,
      levels: selectedLevels,
    });
    setIsOpen(false);
  };

  useEffect(() => {
    if (!loggedInUser || !socket) return;

    socket?.on("updateWaitingRoom", (user) => {
      if (user._id === loggedInUser._id) return;
      toast.success(`${user?.username} joined the waiting room`);
      setUsers((prevUsers) => {
        const index = prevUsers.findIndex((u) => u._id === user._id);
        if (index === -1) {
          return [...prevUsers, user];
        }

        return prevUsers;
      });
    });

    return () => socket?.off("updateWaitingRoom");
  }, [socket, loggedInUser]);

  const handleAcceptChallenge = (challengerId, challengedId, levels) => {
    socket?.emit("acceptChallenge", {
      challengerId,
      challengedId,
      levels,
    });
  };

  useEffect(() => {
    socket?.on("challengeReceived", ({ challenger, challenged, levels }) => {
      toast(
        `${challenger?.username} has challenged you for a ${levels} levels game`,
        {
          action: {
            label: "Accept",
            onClick: () =>
              handleAcceptChallenge(challenger._id, challenged._id, levels),
          },
        }
      );
    });

    socket?.on("gameCreated", ({ gameId }) => {
      navigate(`/game/${gameId}`);
    });
  }, [socket]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Waiting Room</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={fetchUsers} size="icon" variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-[400px] rounded-md border p-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage
                    src={`https://api.dicebear.com/6.x/initials/svg?seed=${user.username}`}
                  />
                  <AvatarFallback>
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">
                    {user.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user.status === "online" ? "Online" : "In Game"}
                  </p>
                </div>
              </div>

              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button disabled={user.status === "in-game"} size="sm">
                    Play
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Select Number of Levels</DialogTitle>
                  </DialogHeader>
                  <RadioGroup
                    value={selectedLevels}
                    onValueChange={setSelectedLevels}
                    className="grid grid-cols-2 gap-4 pt-4"
                  >
                    {levelOptions.map((levels) => (
                      <div key={levels}>
                        <RadioGroupItem
                          value={levels}
                          id={`level-${levels}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`level-${levels}`}
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          {levels} {parseInt(levels) === 1 ? "Level" : "Levels"}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => handlePlayRequest(user._id)}>
                      Continue
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
