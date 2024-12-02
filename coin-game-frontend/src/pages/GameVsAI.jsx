// GameVsAI.jsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate, useParams } from "react-router-dom";
import { API } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";


export default function GameVsAI() {
  const { gameId } = useParams();

  const [gameState, setGameState] = useState(null);

  const socket = getSocket();

  const navigate = useNavigate();

  const [selectedCoins, setSelectedCoins] = useState(null);
  const [guess, setGuess] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [validChoices, setValidChoices] = useState([0, 1, 2, 3, 4, 5]);

  const { user } = useAppContext();

  /**
   * Fetch game data and join the game room
   */
  useEffect(() => {
    if (!gameId || !socket) return;

    (async () => {
      try {
        const { data } = await API().get(`/game/${gameId}`);
        setGameState({
          ...data?.game,
          timer: 30,
        });

        // **Join the game room**
        socket.emit("joinGameRoom", { gameId });
        console.log(`Emitted 'joinGameRoom' event for game ${gameId}`);
      } catch (error) {
        console.error("Error fetching game data:", error);
        toast.error("Failed to load game data.");
      }
    })();
  }, [gameId, socket]);

  // Player scores
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);

  useEffect(() => {
    if (gameState && gameState.matchWinners) {
      const player1Id = gameState.player1._id;
      const player2Id = gameState.player2._id;
      let p1Score = 0;
      let p2Score = 0;
      gameState.matchWinners.forEach((match) => {
        if (match.winner.toString() === player1Id.toString()) {
          p1Score += 1;
        } else if (match.winner.toString() === player2Id.toString()) {
          p2Score += 1;
        }
      });
      setPlayer1Score(p1Score);
      setPlayer2Score(p2Score);
    }
  }, [gameState]);

  // Timer useEffect
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

  /**
   * Update valid choices based on the current round and match
   */
  useEffect(() => {
    if (!gameState) return;

    const currentRound = gameState.currentRound;
    const currentMatch = gameState.currentMatch;

    // Check if 0 has already been played
    const zeroPlayed = gameState.coinSelections.some(
      (cs) => cs.coins === 0 && cs.match === currentMatch
    );

    if (currentRound === 1) {
      // First round: any number from 0 to 5
      setValidChoices([0, 1, 2, 3, 4, 5]);
    } else if (currentRound === 2) {
      // Second round
      const selectionRound1 = gameState.coinSelections.find(
        (cs) => cs.round === 1 && cs.match === currentMatch
      )?.coins;

      // Valid choices:
      // - Numbers greater than selection in Round 1
      // - 0 (if not already played)
      // - 5 (always allowed)
      const validChoices = [];

      for (let num = selectionRound1 + 1; num <= 5; num++) {
        validChoices.push(num);
      }

      if (!zeroPlayed) {
        validChoices.push(0); // 0 can be played once
      }

      if (!validChoices.includes(5)) {
        validChoices.push(5); // Ensure 5 is included
      }

      setValidChoices(Array.from(new Set(validChoices)));
    } else if (currentRound === 3) {
      // Third round
      const selectionRound1 = gameState.coinSelections.find(
        (cs) => cs.round === 1 && cs.match === currentMatch
      )?.coins;
      const selectionRound2 = gameState.coinSelections.find(
        (cs) => cs.round === 2 && cs.match === currentMatch
      )?.coins;

      if (selectionRound2 === 0) {
        // If 0 was selected in Round 2
        // Valid choices are numbers higher than selection in Round 1 or 5 again
        const validChoices = [];

        for (let num = selectionRound1 + 1; num <= 5; num++) {
          validChoices.push(num);
        }

        validChoices.push(5); // 5 can always be played

        setValidChoices(Array.from(new Set(validChoices)));
      } else {
        // Valid choices:
        // - Numbers greater than selection in Round 2
        // - 0 (if not already played)
        // - 5 (always allowed)
        const validChoices = [];

        for (let num = selectionRound2 + 1; num <= 5; num++) {
          validChoices.push(num);
        }

        if (!zeroPlayed) {
          validChoices.push(0); // 0 can be played once
        }

        if (!validChoices.includes(5)) {
          validChoices.push(5); // Ensure 5 is included
        }
        // Reset valid choices for the first round
        setValidChoices(Array.from(new Set(validChoices)));
      }
    }
  }, [gameState]);

  /**
   * Handle coin selection by the user
   */
  const handleCoinSelection = (coins) => {
    if (validChoices.includes(coins)) {
      setSelectedCoins(coins);
      console.log(`User selected coins: ${coins}`);
    } else {
      toast.error("Invalid selection");
    }
  };

  /**
   * Handle guess by the user
   */
  const handleGuess = (guessedCoins) => {
    if (validChoices.includes(guessedCoins)) {
      setGuess(guessedCoins);
      console.log(`User made a guess: ${guessedCoins}`);
    } else {
      toast.error("Invalid guess");
    }
  };

  /**
   * Handle submission of the round
   */
  const handleSubmit = () => {
    const guessedPlayerKey =
      gameState?.player1._id === user?._id ? "player1Role" : "player2Role";

    // Emit submitRound event
    socket.emit("submitRound", {
      gameId,
      selection:
        gameState?.[guessedPlayerKey] === "coin-player"
          ? selectedCoins
          : guess,
      actionBy:
        gameState?.[guessedPlayerKey] === "coin-player"
          ? "coin-player"
          : "estimator",
    });
    setSubmitted(true);
    console.log(`User submitted: ${gameState?.[guessedPlayerKey] === "coin-player" ? selectedCoins : guess}`);
  };

  /**
   * Handle time's up scenario
   */
  const handleTimeUp = () => {
    socket.emit("playerTimeout", { gameId, userId: user._id });
    console.log(`User timed out in game ${gameId}`);
  };

  /**
   * Listen to socket events
   */
  useEffect(() => {
    if (!socket) return;

    /**
     * Handle roundChanged event
     */
    socket.on("roundChanged", (game) => {
      console.log("Received 'roundChanged' event:", game);
      setGameState({
        ...game,
        timer: 30,
      });
      setSelectedCoins(null);
      setGuess(null);
      setSubmitted(false);
    });

    /**
     * Handle roundSubmitted event
     */
    socket.on("roundSubmitted", (game) => {
      console.log("Received 'roundSubmitted' event:", game);
      setGameState({
        ...game,
        timer: gameState.timer,
      });
    });

    /**
     * Handle matchCompleted event
     */
    socket.on("matchCompleted", (game) => {
      console.log("Received 'matchCompleted' event:", game);
      setGameState({
        ...game,
        timer: 30,
      });
      setValidChoices([0, 1, 2, 3, 4, 5]);
      setSelectedCoins(null);
      setGuess(null);
      setSubmitted(false);

      // Display the result message with last moves
      const myUserId = user._id;
      const lastMatchWinner = game.matchWinners[game.matchWinners.length - 1];

      if (!lastMatchWinner) return;

      // Determine the last match number
      const lastMatchNumber = lastMatchWinner.match;

      // Extract the last round of the last match
      const lastRoundNumber = game.rounds; // Assuming rounds are sequential and fixed per match
      const lastCoinSelection = game.coinSelections.find(
        (cs) => cs.match === lastMatchNumber && cs.round === lastRoundNumber
      )?.coins;
      const lastGuess = game.guesses.find(
        (g) => g.match === lastMatchNumber && g.round === lastRoundNumber
      )?.guess;

      // Determine who made the last moves based on roles
      const playerRole =
        game.player1._id === myUserId
          ? game.player1Role
          : game.player2Role;
      const aiRole =
        game.player1._id === "AI" ? game.player1Role : game.player2Role;

      // Construct the message
      let message = "";
      if (lastMatchWinner.winner.toString() === myUserId.toString()) {
        message += "You Won the Match!\n";
        if (playerRole === "coin-player") {
          message += `Your last move: Selected ${lastCoinSelection} coins.\n`;
          message += `AI's last guess: ${lastGuess}.`;
        } else {
          message += `AI's last move: Selected ${lastCoinSelection} coins.\n`;
          message += `Your last guess: ${lastGuess}.`;
        }
      } else {
        message += "You Lost the Match.\n";
        if (playerRole === "coin-player") {
          message += `Your last move: Selected ${lastCoinSelection} coins.\n`;
          message += `AI's last guess: ${lastGuess}.`;
        } else {
          message += `AI's last move: Selected ${lastCoinSelection} coins.\n`;
          message += `Your last guess: ${lastGuess}.`;
        }
      }

      // Display the message using toast
      toast(message);
    });

    /**
     * Handle gameCompleted event
     */
    socket.on("gameCompleted", (game) => {
      console.log("Received 'gameCompleted' event:", game);
      const myUserId = user._id;

      // Count matches won and lost by the user
      let matchesWon = 0;
      let matchesLost = 0;

      game.matchWinners.forEach((match) => {
        if (
          match.winner &&
          match.winner.toString() === myUserId.toString()
        ) {
          matchesWon++;
        } else {
          matchesLost++;
        }
      });

      // Display the result message
      toast.success(
        `Game Completed! You won ${matchesWon} ${
          matchesWon === 1 ? "match" : "matches"
        } and lost ${matchesLost} ${
          matchesLost === 1 ? "match" : "matches"
        }.`,
        {
          duration: 10000,
        }
      );

      // Navigate to the scoreboard or another page
      navigate("/scoreboard");
    });

    /**
     * Handle gameAborted event
     */
    socket.on("gameAborted", (game) => {
      console.log("Received 'gameAborted' event:", game);
      toast.error("Game Aborted");
      navigate("/waiting-room");
    });

    /**
     * Handle gameAbortedDueToTimeout event
     */
    socket.on("gameAbortedDueToTimeout", (data) => {
      console.log("Received 'gameAbortedDueToTimeout' event:", data);
      toast.error(data.message);
      navigate("/waiting-room");
    });

    /**
     * Handle gameCompletedDueToTimeout event
     */
    socket.on("gameCompletedDueToTimeout", ({ game, loserId }) => {
      console.log("Received 'gameCompletedDueToTimeout' event:", { game, loserId });
      const isUserLoser = loserId === user._id;
      toast.success(
        `Game Completed! You ${
          isUserLoser ? "lost" : "won"
        } on time.`,
        { duration: 10000 }
      );
      navigate("/scoreboard");
    });

    /**
     * Handle error events
     */
    socket.on("error", (error) => {
      console.error("Socket error:", error.message);
      toast.error(error.message);
    });

    return () => {
      socket.off("roundChanged");
      socket.off("roundSubmitted");
      socket.off("matchCompleted");
      socket.off("gameCompleted");
      socket.off("gameAborted");
      socket.off("gameAbortedDueToTimeout");
      socket.off("gameCompletedDueToTimeout");
      socket.off("error");
    };
  }, [socket, gameState, user._id, navigate]);

  /**
   * Handle user leaving the page
   */
  useEffect(() => {
    let userConfirmed = false;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };

    const handleUnload = () => {
      if (userConfirmed) {
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
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [socket, user, gameId]);

  /**
   * Render game controls based on the player's role
   */
  const renderGameControls = () => {
    const guessedPlayerKey =
      gameState?.player1._id === user?._id ? "player1Role" : "player2Role";

    if (gameState?.[guessedPlayerKey] === "coin-player") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Coin Player</h3>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Select coins:</h3>
            <div className="flex space-x-2">
              {validChoices?.map((coins) => (
                <Button
                  key={coins}
                  onClick={() => handleCoinSelection(coins)}
                  variant={selectedCoins === coins ? "default" : "outline"}
                  className="text-xl px-4 py-2"
                >
                  {coins}
                </Button>
              ))}
            </div>
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
          <h3 className="text-lg font-semibold">Estimator</h3>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Make your guess:</h3>
            <div className="flex space-x-2">
              {validChoices.map((coins) => (
                <Button
                  key={coins}
                  onClick={() => handleGuess(coins)}
                  variant={guess === coins ? "default" : "outline"}
                  className="text-xl px-4 py-2"
                >
                  {coins}
                </Button>
              ))}
            </div>
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

  /**
   * Extract previous round data
   */
  const previousRound = gameState ? gameState.currentRound - 1 : null;

  const previousCoinSelection =
    previousRound > 0
      ? gameState.coinSelections.find(
          (cs) =>
            cs.round === previousRound && cs.match === gameState.currentMatch
        )
      : null;

  const previousGuess =
    previousRound > 0
      ? gameState.guesses.find(
          (g) =>
            g.round === previousRound && g.match === gameState.currentMatch
        )
      : null;

  return (
    <Card>
      <CardHeader>
        {/* Display Game: Player vs AI (Score) */}
        <CardTitle>
          Game: {user?.username} vs AI ({player1Score} - {player2Score})
        </CardTitle>
      </CardHeader>
      {gameState && (
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            {/* Display role instead of Active Player */}
            <span>
              {gameState?.player1._id === user._id
                ? gameState.player1Role === "coin-player"
                  ? "Coin Player"
                  : "Estimator"
                : gameState.player2Role === "coin-player"
                ? "Coin Player"
                : "Estimator"}
            </span>
            <span>
              Round: {gameState?.currentRound}/{gameState.rounds}
            </span>
            <span>
              Match: {gameState?.currentMatch}/{gameState.matches}
            </span>
          </div>
          {/* Display previous round choices */}
          {previousRound > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Last Picks</h3>
              <p>
                Coin Player selected: {previousCoinSelection?.coins ?? "N/A"}
              </p>
              <p>Estimator guessed: {previousGuess?.guess ?? "N/A"}</p>
            </div>
          )}
          <Progress value={(gameState?.timer / 30) * 100} />
          <div>Time Remaining: {gameState?.timer} seconds</div>

          {renderGameControls()}
        </CardContent>
      )}
    </Card>
  );
}
