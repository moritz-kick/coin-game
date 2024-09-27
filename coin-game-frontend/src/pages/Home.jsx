import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Rules from "./Rules";
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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Patrik's Coin Game</CardTitle>
          <CardDescription>A game of strategy and guessing</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Patrik's Coin Game is a two-player game where one player hides coins
            and the other tries to guess the number. It's a game of strategy and
            a bit of luck!
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
          <div className="space-y-4">
            <div>
              <img src="./images/placeholder1.png" alt="Game Screenshot 1" />
              <p>Explanation for Screenshot 1</p>
            </div>
            <div>
              <img src="./images/placeholder2.png" alt="Game Screenshot 2" />
              <p>Explanation for Screenshot 2</p>
            </div>
            <div>
              <img src="./images/placeholder3.png" alt="Game Screenshot 3" />
              <p>Explanation for Screenshot 3</p>
            </div>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer">
              Read More &amp; Watch Tutorial
            </summary>
            <div className="mt-2">
              <Rules />
            </div>
          </details>
        </CardContent>
      </Card>

      {/* Video Section */}
      <Card>
        <CardHeader>
          <CardTitle>Watch the Tutorial Video</CardTitle>
        </CardHeader>
        <CardContent>
        {/* Video Section */}
        <div className="lg:w-1/3 p-4">
          <video
            ref={videoRef}
            src="/videos/game-demo.mp4"
            controls
            className="w-full h-auto"
          >
            Your browser does not support the video tag.
          </video>
          {/* Speed Control Buttons */}
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={() => handleSpeedChange(0.5)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              0.5x
            </button>
            <button
              onClick={() => handleSpeedChange(1)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              1x
            </button>
            <button
              onClick={() => handleSpeedChange(1.5)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              1.5x
            </button>
            <button
              onClick={() => handleSpeedChange(2)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              2x
            </button>
          </div>

          {/* Caption */}
          <p className="mt-4 text-center text-sm italic">
            Yes, folks, you're watching the legendary Patrik himself explain his genius game. 
            Don't blink, or you might miss his mind-blowing strategies ;)
          </p>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
