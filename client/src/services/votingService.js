import api from './api';

/**
 * Fetches the current voting screen data for the active player.
 * @returns {Promise<Object>} A promise that resolves to the voting screen data.
 */
export const getVotingScreen = () => {
    return api.get('/game-engine/voting');
};

/**
 * Submits a vote for a specific player.
 * @param {number} playerId The ID of the player being voted for.
 * @returns {Promise<Object>} A promise that resolves on successful vote submission.
 */
export const castVote = (playerId) => {
    return api.post(`/game-engine/vote?player_id=${playerId}`);
};