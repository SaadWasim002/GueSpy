import { api, unwrap } from "../../lib/api";
import { isStatus } from "../../lib/apiError";

/**
 * GET /api/v1/categories → the categories a game can be drawn from.
 *
 * An empty catalogue is reported as 404, not as an empty list, so that is
 * translated here into `[]`. "There are no categories" is a normal state for
 * a screen to render, not a failure it should throw over.
 *
 * `admin_only` is enforced server-side: a regular player is never sent one.
 *
 * **Disabled categories are dropped here**, and that is deliberate. The
 * server sends them to admins so the admin page can find and re-enable
 * them — without that, disabling one would hide it from the only screen
 * that could bring it back. But being an admin is not permission to play a
 * category that has been taken out of play, so the filter belongs on this
 * side of the seam.
 *
 * It sits in the service rather than in `CategoryScreen` so it holds for
 * every play-area caller, present and future — a screen that forgot would
 * be offering a category the room is not supposed to get. `adminService.js`
 * is the deliberate other view, and does not filter.
 */
export async function fetchCategories() {
  try {
    const response = await api.get("/api/v1/categories");
    const categories = unwrap(response)?.categories ?? [];
    return categories.filter((category) => category.isEnabled !== false);
  } catch (error) {
    if (isStatus(error, 404)) return [];
    throw error;
  }
}

/** POST /api/v1/categories/{id}/select — advances the game to GROUP_SELECTION. */
export async function selectCategory(categoryId) {
  await api.post(`/api/v1/categories/${categoryId}/select`);
}
