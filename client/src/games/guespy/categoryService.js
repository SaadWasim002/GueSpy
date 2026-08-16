import { api, unwrap } from "../../lib/api";
import { isStatus } from "../../lib/apiError";

/**
 * GET /api/v1/categories → the categories a game can be drawn from.
 *
 * An empty catalogue is reported as 404, not as an empty list, so that is
 * translated here into `[]`. "There are no categories" is a normal state for
 * a screen to render, not a failure it should throw over.
 *
 * Role-based filtering is handled server-side: regular users receive only
 * non-admin-only categories; admins receive everything.
 */
export async function fetchCategories() {
  try {
    const response = await api.get("/api/v1/categories");
    return unwrap(response)?.categories ?? [];
  } catch (error) {
    if (isStatus(error, 404)) return [];
    throw error;
  }
}

/** POST /api/v1/categories/{id}/select — advances the game to GROUP_SELECTION. */
export async function selectCategory(categoryId) {
  await api.post(`/api/v1/categories/${categoryId}/select`);
}
