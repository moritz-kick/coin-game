// aiUtils.js
const fs = require("fs");
const path = require("path");

let gameTree = null;

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

const getGameTree = () => {
  if (!gameTree) loadGameTree();
  return gameTree;
};

/**
 * Function to get AI's selection based on the current game state and role.
 * @param {Object} game - The game object containing the current game state.
 * @param {String} role - The role of the AI in the game ("coin-player" or "estimator").
 * @returns {Number} - The selected move by the AI.
 */
const getAISelection = async (game, role) => {
  const gameTree = getGameTree();

  // Build the current state signature
  const coin_player_choices = game.coinSelections
    .filter((cs) => cs.match === game.currentMatch)
    .sort((a, b) => a.round - b.round)
    .map((cs) => cs.coins);

  const estimator_guesses = game.guesses
    .filter((g) => g.match === game.currentMatch)
    .sort((a, b) => a.round - b.round)
    .map((g) => g.guess);

  const currentRound = game.currentRound;

  // Determine the player number based on the role
  const aiPlayerNumber = role === "coin-player" ? 0 : 1;

  // Find the matching state in the game tree
  const currentState = gameTree.find((state) => {
    return (
      state.player === aiPlayerNumber &&
      state.round === currentRound &&
      arrayEquals(state.coin_player_choices, coin_player_choices) &&
      arrayEquals(state.estimator_guesses, estimator_guesses)
    );
  });

  if (!currentState) {
    // If no matching state is found, return a random valid choice
    const validChoices = getValidChoices(game, role);
    const randomIndex = Math.floor(Math.random() * validChoices.length);
    return validChoices[randomIndex];
  }

  const possibleActions = currentState.actions;

  // Randomly select action based on probabilities
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
      const selectedNumber = parseInt(action.split(": ")[1]);
      return selectedNumber;
    }
  }
  // Fallback
  return 0;
};

/**
 * Helper function to check if two arrays are equal.
 * @param {Array} arr1
 * @param {Array} arr2
 * @returns {Boolean}
 */
const arrayEquals = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, index) => val === arr2[index]);
};

/**
 * Function to get valid choices for the AI based on the game rules.
 * @param {Object} game - The game object containing the current game state.
 * @param {String} role - The role of the AI in the game ("coin-player" or "estimator").
 * @returns {Array} - An array of valid choices.
 */
const getValidChoices = (game, role) => {
  const currentRound = game.currentRound;
  const currentMatch = game.currentMatch;

  // Check if 0 has already been played
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
