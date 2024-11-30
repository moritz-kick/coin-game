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
import estimatorImage from "@/images/webanwendung_pcg_estimator.png";
import gameInviteImage from "@/images/gameinvite.png";
import { API, showErrorToast } from "@/lib/utils";

export default function Home() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState([3]); // Default to 3 matches
  const [confirmUsername, setConfirmUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  const { user, deleteUserAccount, changeUsername } = useAppContext();

  /**
   * Handles the "Play Against AI" button click.
   * Opens the dialog to select the number of matches.
   */
  const handlePlayAI = async () => {
    if (!user) {
      toast.error("Please log in to play against the AI");
      navigate("/login");
      return;
    }
    setIsDialogOpen(true);
  };

  /**
   * Initiates the AI game with the selected number of matches.
   */
  const startAIGame = async () => {
    try {
      const { data } = await API.post("/game/create-ai-game", {
        matches: selectedMatches[0],
        // Since there's only one AI mode, we can set it to a fixed value, e.g., "Standard"
        aiDifficulty: "Standard",
      });

      if (data && data.game && data.game._id) {
        const gameId = data.game._id;
        navigate(`/game-vs-ai/${gameId}`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error starting AI game:", error);
      toast.error("Failed to start AI game. Please try again.");
    } finally {
      setIsDialogOpen(false);
    }
  };

  /**
   * Handles the deletion of a user account.
   */
  const handleDeleteAccount = () => {
    if (confirmUsername !== user.username) {
      toast.error("Usernames do not match");
      return;
    }

    deleteUserAccount();
  };

  /**
   * Handles the change of a user's username.
   */
  const handleChangeUsername = async () => {
    if (!newUsername) {
      toast.error("Username cannot be empty");
      return;
    }

    try {
      await changeUsername(newUsername);
      setNewUsername("");
      toast.success("Username updated successfully");
    } catch (error) {
      console.error("Error changing username:", error);
      toast.error("Failed to update username. Please try again.");
    }
  };

  const images = [
    { src: estimatorImage, alt: "Estimators move in Round 1" },
    { src: gameInviteImage, alt: "Game invite and Match number selection" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Patrik's Coin Game</CardTitle>
          <CardDescription>A game of strategy and guessing</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Patrik's Coin Game is a two-player game where one player{" "}
            <strong>hides coins</strong> and the other <strong>tries to guess</strong> the number.
          </p>
          <div className="mt-4 space-x-4">
            {/* Play Against AI */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handlePlayAI}>Play Against AI</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Select Number of Matches</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Matches Slider */}
                  <div>
                    <label className="block mb-2 font-medium">
                      Number of Matches: {selectedMatches[0]}
                    </label>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={selectedMatches}
                      onValueChange={(value) => setSelectedMatches(value)}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6 space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={startAIGame} disabled={selectedMatches[0] < 1}>
                    Start Game
                  </Button>
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
            <CardDescription>Check out the detailed rules with a short video.</CardDescription>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
