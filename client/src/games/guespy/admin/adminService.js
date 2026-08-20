import { api, unwrap } from "../../../lib/api";
import { isStatus } from "../../../lib/apiError";

/**
 * Admin operations on GueSpy's word bank.
 *
 * Separate from `categoryService.js`, which is the *player's* view: read the
 * catalogue and pick one. These are the writes, and every one of them is
 * behind `@PreAuthorize("hasRole('ADMIN')")` on the server, so a 403 here
 * means the caller is not an admin — not that something went wrong.
 */

/**
 * GET /api/v1/categories → every category this admin can see.
 *
 * Same endpoint the game uses; the server decides what comes back from the
 * caller's role, so an admin gets the admin-only ones too. An empty
 * catalogue arrives as a 404 rather than an empty list, which is a normal
 * state for a fresh install and is translated here.
 *
 * ⚠️ Disabled categories do not come back — `findAllActiveCategoryForUser`
 * filters `isEnabled = true` for admins as well. Until that query is
 * widened, disabling a category from here hides it from this list too, and
 * it cannot be re-enabled through the UI. See "Known backend gaps".
 */
export async function fetchAllCategories() {
  try {
    const response = await api.get("/api/v1/categories");
    return unwrap(response)?.categories ?? [];
  } catch (error) {
    if (isStatus(error, 404)) return [];
    throw error;
  }
}

/** POST /api/v1/categories — 409 if the name is taken (compared case-insensitively). */
export async function createCategory({ name, adminOnly = false }) {
  await api.post("/api/v1/categories", { category_name: name, admin_only: adminOnly });
}

/**
 * PUT /api/v1/categories/{id}
 *
 * Every field is optional and applied only when present, so a toggle can be
 * sent on its own without restating the name. Undefined keys are dropped
 * rather than sent as null, which the server would read as "no change"
 * anyway but which would misrepresent the intent on the wire.
 */
export async function updateCategory(categoryId, { name, adminOnly, isEnabled } = {}) {
  const body = {};
  if (name !== undefined) body.updated_name = name;
  if (adminOnly !== undefined) body.admin_only = adminOnly;
  if (isEnabled !== undefined) body.is_enabled = isEnabled;

  await api.put(`/api/v1/categories/${categoryId}`, body);
}

/**
 * DELETE /api/v1/categories/{id}
 *
 * Cascades: `deleteCategory` removes every word in the category too. There
 * is no undo, which is why the UI asks for the name to be typed.
 */
export async function deleteCategory(categoryId) {
  await api.delete(`/api/v1/categories/${categoryId}`);
}

/**
 * GET /api/v1/categories/{id}/words → `{ words, totalWords, categoryName }`.
 *
 * A category with no words answers 404 NO_WORD_FOUND, same convention as the
 * empty catalogue above.
 *
 * `totalWords` is a counter stored on the category, incremented on add and
 * decremented on delete rather than computed — so it can drift from the list
 * it claims to count. Callers that have the list should trust `words.length`.
 */
export async function fetchWords(categoryId) {
  try {
    const response = await api.get(`/api/v1/categories/${categoryId}/words`);
    return unwrap(response)?.words ?? [];
  } catch (error) {
    if (isStatus(error, 404)) return [];
    throw error;
  }
}

/**
 * POST /api/v1/words — add one or many in a single call.
 *
 * Partial success is the normal outcome, not an error: blank entries are
 * ignored and anything already in the category is skipped, so the response
 * reports `{ added, skipped }` and a batch with duplicates in it still
 * lands. Pasting a list twice is a no-op rather than a failure.
 */
export async function addWords(categoryId, words) {
  const response = await api.post("/api/v1/words", { category_id: categoryId, words });
  return unwrap(response) ?? { added: [], skipped: [] };
}

/**
 * PUT /api/v1/words/{id} — rename. 409 if that word is already in the
 * category (its own name excluded).
 */
export async function updateWord(wordId, wordName) {
  await api.put(`/api/v1/words/${wordId}`, { word_name: wordName });
}

/** DELETE /api/v1/words/{id} */
export async function deleteWord(wordId) {
  await api.delete(`/api/v1/words/${wordId}`);
}
