// aiUtils.js
const fs = require("fs");
const path = require("path");

let gameTree = null;

/**
 * Load the game tree from the JSON file.
 * This function reads and parses the game_tree.json file.
 */
const loadGameTree = () => {
  const filePath = path.join(__dirname, "../data/game_tree.json");
  console.log('Loading game tree from:', filePath);
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    gameTree = JSON.parse(data);
    console.log('Game tree loaded successfully.');
  } catch (err) {
    console.error('Error loading game tree:', err);
    throw err;
  }
};

/**
 * Get the loaded game tree.
 * If the game tree isn't loaded yet, load it first.
 */
const getGameTree = () => {
  if (!gameTree) loadGameTree();
  return gameTree;
};

/**
 * Helper function to check if two arrays are equal.
 * @param {Array} arr1 - First array.
 * @param {Array} arr2 - Second array.
 * @returns {Boolean} - True if arrays are equal, false otherwise.
 */
const arrayEquals = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, index) => val === arr2[index]);
};

/**
 * Function to get AI's selection based on the current game state and role.
 * This function treats all matches as match 1 internally to align with the game_tree.json.
 * @param {Object} game - The game object containing the current game state.
 * @param {String} role - The role of the AI in the game ("coin-player" or "estimator").
 * @returns {Number} - The selected move by the AI.
 */
const getAISelection = async (game, role) => {
  const gameTree = getGameTree();

  // **Create a Virtual Game State Treating Current Match as Match 1**
  const virtualGame = {
    ...game,
    currentMatch: 1, // Treat any current match as match 1 for AI's search
    // **Use virtualGame.currentMatch for filtering**
    coinSelections: game.coinSelections.filter(cs => cs.match === 1),
    guesses: game.guesses.filter(g => g.match === 1),
  };

  // **Build the Current State Signature**
  const coinSelectionsCurrentMatch = virtualGame.coinSelections
    .sort((a, b) => a.round - b.round)
    .map(cs => cs.coins);

  const estimator_guesses = virtualGame.guesses
    .sort((a, b) => a.round - b.round)
    .map(g => g.guess);

  // **Ensure Both Arrays Have the Same Length**
  const roundsPlayed = Math.max(coinSelectionsCurrentMatch.length, estimator_guesses.length);

  const alignedCoinChoices = [];
  const alignedGuesses = [];

  for (let i = 0; i < roundsPlayed; i++) {
    // Use 'null' if data for a round is missing to maintain alignment
    alignedCoinChoices.push(coinSelectionsCurrentMatch[i] ?? null);
    alignedGuesses.push(estimator_guesses[i] ?? null);
  }

  // **Remove Any Trailing 'null' Values**
  while (
    alignedCoinChoices.length > 0 &&
    alignedCoinChoices[alignedCoinChoices.length - 1] === null
  ) {
    alignedCoinChoices.pop();
    alignedGuesses.pop();
  }

  const currentRound = game.currentRound;

  // Determine the player number based on the role
  // 0 for "coin-player", 1 for "estimator"
  const aiPlayerNumber = role === "coin-player" ? 0 : 1;

  // **Find the Matching State in the Game Tree**
  let currentState = null;
  let stateIndex = -1;

  for (let i = 0; i < gameTree.length; i++) {
    const state = gameTree[i];
    if (
      state.player === aiPlayerNumber &&
      state.round === currentRound &&
      arrayEquals(state.coin_player_choices, alignedCoinChoices) &&
      arrayEquals(state.estimator_guesses, alignedGuesses)
    ) {
      currentState = state;
      stateIndex = i;
      break;
    }
  }

  if (currentState) {
    console.log(`Found matching state at index ${stateIndex} in game_tree.json:`);
    console.log(JSON.stringify(currentState, null, 2));

    const possibleActions = currentState.actions;

    // Calculate total probability to normalize selection
    const totalProbability = Object.values(possibleActions).reduce(
      (a, b) => a + b,
      0
    );
    const random = Math.random() * totalProbability;
    let cumulativeProbability = 0;

    for (const [action, probability] of Object.entries(possibleActions)) {
      cumulativeProbability += probability;
      if (random <= cumulativeProbability) {
        // Extract the number from action string, e.g., "Player 0 chose: 3"
        const selectedNumber = parseInt(action.split(": ")[1], 10);
        console.log(`AI (role: ${role}) selected action: "${action}", which translates to number: ${selectedNumber}`);
        return selectedNumber;
      }
    }

    // Fallback if no action was selected (shouldn't happen if probabilities are correct)
    console.log(`AI (role: ${role}) failed to select a valid action from probabilities. Defaulting to 0.`);
    return 0;
  } else {
    // If no matching state is found, select a random valid choice based on game rules
    const validChoices = getValidChoices(game, role);
    const randomIndex = Math.floor(Math.random() * validChoices.length);
    const selectedChoice = validChoices[randomIndex];
    console.log(`No matching state found in game_tree.json for the current game state.`);
    console.log(`AI (role: ${role}) selecting a random valid choice: ${selectedChoice}`);
    return selectedChoice;
  }
};

/**
 * Function to get valid choices for the AI based on the game rules.
 * Ensures the AI selects only valid moves according to the current round and previous moves.
 * @param {Object} game - The game object containing the current game state.
 * @param {String} role - The role of the AI in the game ("coin-player" or "estimator").
 * @returns {Array} - An array of valid choices.
 */
const getValidChoices = (game, role) => {
  const currentRound = game.currentRound;
  const currentMatch = game.currentMatch;

  // Check if 0 has already been played in the current match
  const zeroPlayed = game.coinSelections.some(
    (cs) => cs.coins === 0 && cs.match === currentMatch
  );

  if (role === "coin-player") {
    if (currentRound === 1) {
      // First round: any number from 0 to 5
      return [0, 1, 2, 3, 4, 5];
    } else if (currentRound === 2) {
      // Second round
      const selectionRound1 = game.coinSelections.find(
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

      return Array.from(new Set(validChoices));
    } else if (currentRound === 3) {
      // Third round
      const selectionRound1 = game.coinSelections.find(
        (cs) => cs.round === 1 && cs.match === currentMatch
      )?.coins;
      const selectionRound2 = game.coinSelections.find(
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

        return Array.from(new Set(validChoices));
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

        return Array.from(new Set(validChoices));
      }
    }
  } else if (role === "estimator") {
    // Estimator can guess any number from 0 to 5
    return [0, 1, 2, 3, 4, 5];
  }

  // Default fallback
  return [0, 1, 2, 3, 4, 5];
};

module.exports = {
  getAISelection,
};
