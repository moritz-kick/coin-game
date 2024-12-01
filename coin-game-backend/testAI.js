// testAIEstimator.js
const { getAISelection } = require("./utils/aiUtils");

const testGameState = {
  currentRound: 3,
  currentMatch: 1,
  player1Role: "estimator",
  player2Role: "coin-player",
  coinSelections: [
    { round: 1, coins: 0, match: 1 },
    { round: 3, coins: 4, match: 1 }
  ],
  guesses: [
    { round: 1, guess: 1, match: 1 },
    { round: 2, guess: 1, match: 1 }
  ],
  isAIGame: true,
};

const testAIEstimator = async () => {
  const aiSelection = await getAISelection(testGameState, "estimator");
  console.log("AI Selection (Estimator):", aiSelection);
};

testAIEstimator();