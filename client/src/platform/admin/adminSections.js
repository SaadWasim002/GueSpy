import { listGameModules } from "../../games/registry";

/**
 * Every section the admin area can show, in tab order.
 *
 * Two sources, and the split is the point:
 *
 *   - **platform sections** belong to the install — configuration, and
 *     anything else that is true regardless of which games are registered;
 *   - **game sections** are contributed by game modules through the optional
 *     `admin` field on the module contract. Managing a game's content is the
 *     game's business, so those screens live in the game folder and the
 *     platform never imports them by name.
 *
 * Games come first because content is what an admin opens this page to
 * change; settings are the rarer, heavier visit.
 *
 * @param {import("./AdminScreen").AdminSection[]} platformSections
 */
export function collectAdminSections(platformSections = []) {
  const fromGames = listGameModules().flatMap((module) => {
    const sections = module.admin?.sections ?? [];
    // Carry the game's name so a second game's sections stay tellable apart
    // when the tab labels alone ("Word bank") would not be.
    return sections.map((section) => ({ ...section, gameName: module.meta?.name }));
  });

  return [...fromGames, ...platformSections];
}
