import { api, unwrap } from "../../lib/api";

/**
 * GET /game-engine/voting — whose turn it is and who they may accuse.
 *
 * Unlike role-reveal this is a genuine read: it does not advance anything,
 * so it is safe to call again on mount, on retry, or after a reload. The
 * cursor only moves when a vote is actually cast.
 *
 * Returns { currentPlayerName, displayText, displayTextHeader, isLast,
 * votingList: [{ playerId, playerName }] }. The list excludes the current
 * voter and anyone already eliminated.
 */
export async function fetchVotingScreen() {
  const response = await api.get("/game-engine/voting");
  return unwrap(response);
}

/**
 * POST /game-engine/vote?player_id=N — records the current voter's accusation
 * and moves to the next voter.
 *
 * `player_id` is the player *number* within the group (1-based), which is
 * what `votingList[].playerId` carries — not a database id.
 *
 * Valid at both VOTING and REVOTE.
 */
export async function castVote(playerId) {
  await api.post("/game-engine/vote", null, { params: { player_id: playerId } });
}
