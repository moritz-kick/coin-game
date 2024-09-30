import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
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

export default function GameVsAI() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAppContext();

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const difficulty = queryParams.get("difficulty") || "Easy";
  const totalMatches = parseInt(queryParams.get("matches")) || 1;

  const [currentMatch, setCurrentMatch] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = 3;

  const [playerRole, setPlayerRole] = useState("coin-player"); // or 'estimator'
  const [selectedCoins, setSelectedCoins] = useState(null);
  const [guess, setGuess] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const [validChoices, setValidChoices] = useState([0, 1, 2, 3, 4, 5]);

  const [previousCoinSelection, setPreviousCoinSelection] = useState(null);
  const [previousGuess, setPreviousGuess] = useState(null);

  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAIScore] = useState(0);

  const [timer, setTimer] = useState(30);

  const [gameHistory, setGameHistory] = useState([]);


  useEffect(() => {
    if (timer > 0 && !submitted) {
      const timerId = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (!submitted) {
      // Time's up, handle accordingly
      handleSubmit();
    }
  }, [timer, submitted]);

  useEffect(() => {
    // Reset timer when round or match changes
    setTimer(30);
  }, [currentRound, currentMatch]);

  useEffect(() => {
    if (currentRound > totalRounds) {
      // End of match
      determineMatchWinner();
      if (currentMatch >= totalMatches) {
        // End of game
        determineGameWinner();
      } else {
        // Start new match
        setCurrentMatch(currentMatch + 1);
        setCurrentRound(1);
        // Swap roles
        setPlayerRole(
          playerRole === "coin-player" ? "estimator" : "coin-player"
        );
      }
    }
  }, [currentRound]);

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
    if (submitted) return;

    let aiSelection = null;

    if (playerRole === "coin-player") {
      // AI is estimator
      aiSelection = difficulty === "Easy" ? aiEasy() : aiHard();
      setPreviousGuess(aiSelection);
      // Compare selectedCoins and aiSelection to determine outcome
      // For simplicity, proceed to next round
    } else {
      // AI is coin-player
      aiSelection = difficulty === "Easy" ? aiEasy() : aiHard();
      setPreviousCoinSelection(aiSelection);
      // Compare guess and aiSelection to determine outcome
    }

    // Update game history
    setGameHistory([
      ...gameHistory,
      {
        match: currentMatch,
        round: currentRound,
        playerRole,
        selectedCoins:
          playerRole === "coin-player" ? selectedCoins : aiSelection,
        guess: playerRole === "estimator" ? guess : aiSelection,
      },
    ]);

    // Update valid choices for next round
    updateValidChoices();

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSelectedCoins(null);
      setGuess(null);
      setCurrentRound(currentRound + 1);
    }, 1000);
  };

  const updateValidChoices = () => {
    if (currentRound >= totalRounds) {
      setValidChoices([0, 1, 2, 3, 4, 5]);
    } else {
      const lastSelection =
        playerRole === "coin-player" ? selectedCoins : previousCoinSelection;

      const nextStrategies = strategies.filter((s) => s[0] === lastSelection);
      const nextValidChoices = [...new Set(nextStrategies.map((s) => s[1]))];
      setValidChoices(nextValidChoices);
    }
  };

  const determineMatchWinner = () => {
    // Placeholder logic to determine match winner
    // For now, randomly assign winner
    const winner = Math.random() > 0.5 ? "player" : "ai";
    if (winner === "player") {
      setPlayerScore(playerScore + 1);
      toast("You Won the Match!");
    } else {
      setAIScore(aiScore + 1);
      toast("You Lost the Match!");
    }
  };

  const determineGameWinner = () => {
    // Determine overall game winner
    if (playerScore > aiScore) {
      toast("You Won the Game!");
    } else if (playerScore < aiScore) {
      toast("You Lost the Game!");
    } else {
      toast("The Game is a Draw!");
    }
    // Redirect to scoreboard or home
    navigate("/scoreboard");
  };

  const renderGameControls = () => {
    if (playerRole === "coin-player") {
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

  return (
    <Card>
      <CardHeader>
        {/* Display Game: Player vs AI (Score) */}
        <CardTitle>
          Game: {user?.username} vs AI ({playerScore} - {aiScore})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span>{playerRole === "coin-player" ? "Coin Player" : "Estimator"}</span>
          <span>
            Round: {currentRound}/{totalRounds}
          </span>
          <span>
            Match: {currentMatch}/{totalMatches}
          </span>
        </div>
        {/* Display previous round choices */}
        {currentRound > 1 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Last Picks</h3>
            <p>
              Coin Player selected: {previousCoinSelection ?? "N/A"}
            </p>
            <p>Estimator guessed: {previousGuess ?? "N/A"}</p>
          </div>
        )}
        <Progress value={(timer / 10) * 100} />
        <div>Time Remaining: {timer} seconds</div>

        {renderGameControls()}
      </CardContent>
    </Card>
  );
}
