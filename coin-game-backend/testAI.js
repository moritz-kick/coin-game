// testAI.js
const { getAISelection } = require("./utils/aiUtils");

/**
 * Utility function to run a single test case.
 * @param {String} testName - The name of the test case.
 * @param {Object} gameState - The game state object.
 * @param {String} role - The role of the AI ("coin-player" or "estimator").
 */
const runTest = async (testName, gameState, role) => {
  console.log(`\n=== Running Test: ${testName} ===`);
  try {
    const aiSelection = await getAISelection(gameState, role);
    console.log(`AI Selection (${role}):`, aiSelection);
  } catch (error) {
    console.error(`Error in Test "${testName}":`, error.message);
  }
};

/**
 * Main function to execute all test cases.
 */
const runAllTests = async () => {
  // Define total rounds per match
  const totalRoundsPerMatch = 3;

  // Test Case 1: Round 1, Match 1, Role: Coin Player
  const test1 = {
    currentRound: 1,
    currentMatch: 1,
    player1Role: "estimator",
    player2Role: "coin-player",
    coinSelections: [],
    guesses: [],
    isAIGame: true,
    rounds: totalRoundsPerMatch,
    matches: 1,
  };

  // Test Case 2: Round 1, Match 1, Role: Estimator
  const test2 = {
    currentRound: 1,
    currentMatch: 1,
    player1Role: "estimator",
    player2Role: "coin-player",
    coinSelections: [],
    guesses: [],
    isAIGame: true,
    rounds: totalRoundsPerMatch,
    matches: 1,
  };

  // Test Case 3: Round 2, Match 1, Role: Coin Player
  const test3 = {
    currentRound: 2,
    currentMatch: 1,
    player1Role: "estimator",
    player2Role: "coin-player",
    coinSelections: [{ round: 1, coins: 3, match: 1 }],
    guesses: [{ round: 1, guess: 2, match: 1 }],
    isAIGame: true,
    rounds: totalRoundsPerMatch,
    matches: 1,
  };

  // Test Case 4: Round 2, Match 1, Role: Estimator
  const test4 = {
    currentRound: 2,
    currentMatch: 1,
    player1Role: "estimator",
    player2Role: "coin-player",
    coinSelections: [{ round: 1, coins: 3, match: 1 }],
    guesses: [{ round: 1, guess: 2, match: 1 }],
    isAIGame: true,
    rounds: totalRoundsPerMatch,
    matches: 1,
  };

  // Test Case 5: Round 3, Match 1, Role: Estimator (Your Specific Example)
  const test5 = {
    currentRound: 3,
    currentMatch: 1,
    player1Role: "estimator",
    player2Role: "coin-player",
    coinSelections: [
      { round: 1, coins: 0, match: 1 },
      { round: 3, coins: 4, match: 1 },
    ],
    guesses: [
      { round: 1, guess: 1, match: 1 },
      { round: 2, guess: 1, match: 1 },
    ],
    isAIGame: true,
    rounds: totalRoundsPerMatch,
    matches: 1,
  };

  // Define the test cases
  const testCases = [
    { name: "Round 1 - Coin Player", state: test1, role: "coin-player" },
    { name: "Round 1 - Estimator", state: test2, role: "estimator" },
    { name: "Round 2 - Coin Player", state: test3, role: "coin-player" },
    { name: "Round 2 - Estimator", state: test4, role: "estimator" },
    { name: "Round 3 - Estimator (Specific Example)", state: test5, role: "estimator" },
  ];

  // Run all test cases sequentially
  for (const testCase of testCases) {
    await runTest(testCase.name, testCase.state, testCase.role);
  }
};

// Execute the tests
runAllTests();