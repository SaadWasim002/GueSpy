import { api, unwrap } from "../../lib/api";
import { isStatus } from "../../lib/apiError";

/**
 * GET /group/get → this user's saved player groups.
 *
 * Shape, verified against a running backend:
 *   { groups: [{ id, userId, groupName, players: { playerNames: [...] } }] }
 *
 * As with categories, "none yet" comes back as a 404 and is translated to an
 * empty list — a brand new account having no groups is the expected first
 * experience, not an error.
 */
export async function fetchGroups() {
  try {
    const response = await api.get("/group/get");
    return unwrap(response)?.groups ?? [];
  } catch (error) {
    if (isStatus(error, 404)) return [];
    throw error;
  }
}

/**
 * POST /group/create
 *
 * Note the snake_case key: the backend binds `group_name`, not `groupName`.
 */
export async function createGroup({ groupName, players }) {
  await api.post("/group/create", { group_name: groupName, players });
}

/** POST /group/select — advances the game to GAME_OPTION_SELECTION. */
export async function selectGroup(groupId) {
  await api.post("/group/select", { id: groupId });
}

/*
 * Editing and deleting a group are not implemented server-side. The PRD asks
 * for `PUT /group/get?groupId={id}` and lists it as pending; GroupController
 * exposes only create, get and select. The UI deliberately does not offer
 * those actions rather than shipping buttons that would always fail — see
 * GroupScreen.
 */
