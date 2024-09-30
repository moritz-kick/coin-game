import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import ImageSwiper from "@/components/ui/swiper";
import { useAppContext } from "@/context/AppContext";
import { toast } from "sonner";

export default function Home() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState("Easy");
  const [selectedMatches, setSelectedMatches] = useState(1);
  const [confirmUsername, setConfirmUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  const { user, deleteUserAccount, changeUsername } = useAppContext();

  const handlePlayAI = () => {
    navigate(
      `/game-vs-ai?difficulty=${selectedDifficulty}&matches=${selectedMatches}`
    );
  };

  const handleDeleteAccount = () => {
    if (confirmUsername !== user.username) {
      toast.error("Usernames do not match");
      return;
    }

    deleteUserAccount();
  };

  const handleChangeUsername = async () => {
    if (!newUsername) {
      toast.error("Username cannot be empty");
      return;
    }

    changeUsername(newUsername);
    setNewUsername("");
    toast.success("Username updated successfully");
  };

  const images = [
    { src: "./images/placeholder1.png", alt: "Game Screenshot 1" },
    { src: "./images/placeholder2.png", alt: "Game Screenshot 2" },
    { src: "./images/placeholder3.png", alt: "Game Screenshot 3" },
  ];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Patrik's Coin Game</CardTitle>
          <CardDescription>A game of strategy and guessing</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Patrik's Coin Game is a two-player game where one player <strong>hides coins </strong> and the other <strong>tries to guess</strong> the number.
          </p>
          <div className="mt-4 space-x-4">
            {/* AI Game Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Play Against AI</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select Difficulty and Matches</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <Button
                      variant={
                        selectedDifficulty === "Easy" ? "default" : "outline"
                      }
                      onClick={() => setSelectedDifficulty("Easy")}
                    >
                      Easy
                    </Button>
                    <Button
                      variant={
                        selectedDifficulty === "Hard" ? "default" : "outline"
                      }
                      onClick={() => setSelectedDifficulty("Hard")}
                    >
                      Hard
                    </Button>
                  </div>
                  <div>
                    <label>Number of Matches: {selectedMatches}</label>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[selectedMatches]}
                      onValueChange={(value) => setSelectedMatches(value[0])}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handlePlayAI}>Start Game</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Play Against a Friend */}
            <Button asChild>
              <Link to={user ? "/waiting-room" : "/login"}>
                Play Against a Friend
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Rules Section */}
      <Card>
        <CardHeader>
          <CardTitle>Game Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4">
            <ImageSwiper images={images} autoplay={true} delay={5000} speed={1000} />
          </div>
          <Button asChild variant="outline">
            <Link to="/rules">View Game Rules</Link>
          </Button>
          <div className="p-4">
          <CardDescription>Check out the detailed rules with a short video</CardDescription>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
