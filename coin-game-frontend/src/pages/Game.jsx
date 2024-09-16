import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useNavigate, useParams } from "react-router-dom";
import { API } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";

const strategies = [
  [0, 1, 2],
  [0, 1, 3],
  [0, 1, 4],
  [0, 1, 5],
  [0, 2, 3],
  [0, 2, 4],
  [0, 2, 5],
  [0, 3, 4],
  [0, 3, 5],
  [0, 4, 5],
  [0, 5, 5],
  [1, 0, 2],
  [1, 0, 3],
  [1, 0, 4],
  [1, 0, 5],
  [1, 2, 0],
  [1, 2, 3],
  [1, 2, 4],
  [1, 2, 5],
  [1, 3, 0],
  [1, 3, 4],
  [1, 3, 5],
  [1, 4, 0],
  [1, 4, 5],
  [1, 5, 0],
  [1, 5, 5],
  [2, 0, 3],
  [2, 0, 4],
  [2, 0, 5],
  [2, 3, 0],
  [2, 3, 4],
  [2, 3, 5],
  [2, 4, 0],
  [2, 4, 5],
  [2, 5, 0],
  [2, 5, 5],
  [3, 0, 4],
  [3, 0, 5],
  [3, 4, 0],
  [3, 4, 5],
  [3, 5, 0],
  [3, 5, 5],
  [4, 0, 5],
  [4, 5, 0],
  [4, 5, 5],
  [5, 0, 5],
  [5, 5, 0],
  [5, 5, 5],
];

export default function Game() {
  const { gameId } = useParams();

  const [gameState, setGameState] = useState(null);

  const socket = getSocket();

  const navigate = useNavigate();

  useEffect(() => {
    if (!gameId) return;

    (async () => {
      try {
        const { data } = await API().get(`/game/${gameId}`);
        setGameState({
          ...data?.game,
          timer: 10,
        });
      } catch (error) {
        console.error(error);
      }
    })();
  }, [gameId]);

  const [selectedCoins, setSelectedCoins] = useState(null);
  const [guess, setGuess] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const [validChoices, setValidChoices] = useState([0, 1, 2, 3, 4, 5]);

  const { user } = useAppContext();

  useEffect(() => {
    if (!gameState) return;
    if (gameState?.timer > 0 && gameState?.status === "in-progress") {
      const timerId = setTimeout(() => {
        setGameState((prevState) => ({
          ...prevState,
          timer: prevState.timer - 1,
        }));
      }, 1000);
      return () => clearTimeout(timerId);
    } else if (gameState.timer === 0) {
      // Handle time's up scenario
      handleTimeUp();
    }
  }, [gameState?.timer, gameState?.status]);

  useEffect(() => {
    if (gameState && gameState.currentRound > 1) {
      // Get last coin selection made by coin-player in the previous round
      const lastSelection =
        gameState.coinSelections[gameState.coinSelections.length - 1]?.coins;

      // Filter the strategies to only those that match the previous round's selection
      const nextStrategies = strategies.filter((s) => s[0] === lastSelection);

      // Extract the second coin value from the filtered strategies
      const nextValidChoices = [...new Set(nextStrategies.map((s) => s[1]))];

      // Update valid choices for the next round
      setValidChoices(nextValidChoices);
    }
  }, [gameState]);

  const handleCoinSelection = (coins) => {
    if (validChoices.includes(coins)) {
      setSelectedCoins(coins);
    } else {
      toast.error("Invalid selection");
    }
  };

  const handleGuess = (guessedCoins) => {
    if (validChoices.includes(guessedCoins)) {
      setGuess(guessedCoins);
    } else {
      toast.error("Invalid guess");
    }
  };

  const handleSubmit = () => {
    const guessedPlayerKey =
      gameState?.player1 === user?._id ? "player1Role" : "player2Role";

    // Update game state, switch active player, etc.
    socket.emit("submitRound", {
      gameId,
      selection:
        gameState?.[guessedPlayerKey] === "coin-player" ? selectedCoins : guess,
      actionBy:
        gameState?.[guessedPlayerKey] === "coin-player"
          ? "coin-player"
          : "estimator",
    });
    setSubmitted(true);
  };

  const handleTimeUp = () => {
    socket.emit("changeRound", {
      gameId,
    });
  };

  useEffect(() => {
    if (!socket) return;

    socket?.on("roundChanged", (game) => {
      setGameState({
        ...game,
        timer: 10,
      });
      setSelectedCoins(null);
      setGuess(null);
      setSubmitted(false);
    });

    socket?.on("roundSubmitted", (game) => {
      setGameState({
        ...game,
        timer: gameState.timer,
      });
    });

    socket?.on("levelCompleted", (game) => {
      toast.success("Level Completed");
      setGameState({
        ...game,
        timer: 10,
      });
      setValidChoices([0, 1, 2, 3, 4, 5]);
      setSelectedCoins(null);
      setGuess(null);
      setSubmitted(false);
    });

    socket?.on("gameCompleted", (game) => {
      toast.success("Game Completed");
      navigate("/scoreboard");
    });

    socket?.on("gameAborted", (game) => {
      toast.error("Game Aborted");
      navigate("/waiting-room");
    });

    return () => {
      socket.off("roundChanged");
      socket.off("levelCompleted");
      socket.off("gameCompleted");
      socket.off("roundSubmitted");
      socket.off("gameAborted");
    };
  }, [socket]);

  useEffect(() => {
    let userConfirmed = false;

    const handleBeforeUnload = (event) => {
      // Show the confirmation prompt
      event.preventDefault();
      event.returnValue = ""; // This is required for the prompt to show up in some browsers
      return ""; // This is required for the prompt to show up in some browsers
    };

    const handleUnload = () => {
      if (userConfirmed) {
        // Your custom function to run when the user confirms they want to leave
        socket.emit("userLeft", {
          userId: user._id,
          gameId,
        });
        window.location.href = "/waiting-room";
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        userConfirmed = true;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [socket, user]);

  const renderGameControls = () => {
    // const guessedPlayer = gameState?.player1

    const guessedPlayerKey =
      gameState?.player1 === user?._id ? "player1Role" : "player2Role";

    if (gameState?.[guessedPlayerKey] === "coin-player") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select coins:</h3>
          <div className="flex space-x-2">
            {validChoices?.map((coins) => (
              <Button
                key={coins}
                onClick={() => handleCoinSelection(coins)}
                variant={selectedCoins === coins ? "default" : "outline"}
              >
                {coins}
              </Button>
            ))}
          </div>

          {submitted ? (
            <div>Coins selected: {selectedCoins}</div>
          ) : (
            <Button onClick={handleSubmit} disabled={selectedCoins === null}>
              Submit
            </Button>
          )}
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Make your guess:</h3>
          <div className="flex space-x-2">
            {validChoices.map((coins) => (
              <Button
                key={coins}
                onClick={() => handleGuess(coins)}
                variant={guess === coins ? "default" : "outline"}
              >
                {coins}
              </Button>
            ))}
          </div>

          {submitted ? (
            <div>Your guess: {guess}</div>
          ) : (
            <Button onClick={handleSubmit} disabled={guess === null}>
              Submit Guess
            </Button>
          )}
        </div>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game in Progress</CardTitle>
      </CardHeader>
      {gameState && (
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>
              Round: {gameState?.currentRound}/{gameState.rounds}
            </span>
            <span>
              Level: {gameState?.currentLevel}/{gameState.levels}
            </span>
            <span>
              Active Player:{" "}
              {gameState.activePlayer === "coinPlayer"
                ? "Coin Player"
                : "Estimator"}
            </span>
          </div>
          <Progress value={(gameState?.timer / 30) * 100} />
          <div>Time Remaining: {gameState?.timer} seconds</div>
          {/* <div className="flex justify-between">
            <span>Coin Player Score: {gameState.score.coinPlayer}</span>
            <span>Estimator Score: {gameState.score.estimator}</span>
          </div> */}
          {renderGameControls()}
        </CardContent>
      )}
    </Card>
  );
}
