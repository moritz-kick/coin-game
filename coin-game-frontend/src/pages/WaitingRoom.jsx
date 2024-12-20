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
import { Slider } from "@/components/ui/slider";

export default function WaitingRoom() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { user: loggedInUser } = useAppContext();
  const navigate = useNavigate();
  const socket = getSocket();
  const [selectedMatches, setSelectedMatches] = useState([1]);
  const [selectedUser, setSelectedUser] = useState(null);

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
      matches: selectedMatches[0],
    });
    setSelectedUser(null);
    toast.success(
      `Challenge sent to ${users.find((u) => u._id === challengedId)?.username}`
    );
  };

  useEffect(() => {
    if (!loggedInUser || !socket) return;

    const handleUpdateWaitingRoom = (user) => {
      if (user._id === loggedInUser._id) return;
      toast.success(`${user?.username} joined the waiting room`);
      setUsers((prevUsers) => {
        const index = prevUsers.findIndex((u) => u._id === user._id);
        if (index === -1) {
          return [...prevUsers, user];
        }
        return prevUsers;
      });
    };

    socket.on("updateWaitingRoom", handleUpdateWaitingRoom);

    return () => {
      socket.off("updateWaitingRoom", handleUpdateWaitingRoom);
    };
  }, [socket, loggedInUser]);

  const handleAcceptChallenge = (challengerId, challengedId, matches) => {
    socket?.emit("acceptChallenge", {
      challengerId,
      challengedId,
      matches,
    });
  };

  useEffect(() => {
    if (!socket) return;

    const handleChallengeReceived = ({ challenger, challenged, matches }) => {
      toast(
        `${challenger?.username} has challenged you for a ${matches} ${
          matches > 1 ? "matches" : "match"
        } game`,
        {
          action: {
            label: "Accept",
            onClick: () =>
              handleAcceptChallenge(challenger._id, challenged._id, matches),
          },
        }
      );
    };

    const handleGameCreated = ({ gameId }) => {
      navigate(`/game/${gameId}`);
    };

    socket.on("challengeReceived", handleChallengeReceived);
    socket.on("gameCreated", handleGameCreated);

    return () => {
      socket.off("challengeReceived", handleChallengeReceived);
      socket.off("gameCreated", handleGameCreated);
    };
  }, [socket, navigate]);

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
              key={user._id}
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

              {/* Use DialogTrigger to open dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    disabled={user.status === "in-game"}
                    size="sm"
                    onClick={() => setSelectedUser(user)}
                  >
                    Play
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Select Number of Matches</DialogTitle>
                  </DialogHeader>
                  <div className="pt-4">
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={selectedMatches}
                      onValueChange={(values) => setSelectedMatches(values)}
                    />
                    <div className="text-center mt-2">
                      Matches: {selectedMatches[0]}
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedUser(null)}
                    >
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
