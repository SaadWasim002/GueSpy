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

/**
 * PUT /group/update?groupId={id}
 *
 * A **full replace** — the name and the whole player list are both required,
 * so the caller must send the complete line-up, not a delta.
 *
 * Owner-scoped rather than admin-gated: 403 means the group belongs to
 * somebody else, which for this UI should be unreachable, since the list only
 * ever contains the caller's own groups.
 */
export async function updateGroup(groupId, { groupName, players }) {
  await api.put("/group/update", { group_name: groupName, players }, { params: { groupId } });
}

/**
 * DELETE /group/delete?groupId={id}
 *
 * Owner-scoped, no body. Irreversible, so the UI confirms first.
 */
export async function deleteGroup(groupId) {
  await api.delete("/group/delete", { params: { groupId } });
}
