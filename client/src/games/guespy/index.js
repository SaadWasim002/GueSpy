import { lazy } from "react";
import { defineGameModule, PLAY_MODES } from "../types";
import { CategoryScreen } from "./screens/CategoryScreen";
import { DiscussionScreen } from "./screens/DiscussionScreen";
import { GameEntryScreen } from "./screens/GameEntryScreen";
import { GameOptionScreen } from "./screens/GameOptionScreen";
import { GroupScreen } from "./screens/GroupScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { RevealScreen } from "./screens/RevealScreen";
import { RoundEndScreen } from "./screens/RoundEndScreen";
import { SpyGuessScreen } from "./screens/SpyGuessScreen";
import { VotingScreen } from "./screens/VotingScreen";
import { isResumable } from "./statusLabels";
import { useGueSpySession } from "./useGueSpySession";
import "./theme.css";

/**
 * GueSpy — the word-based hidden-role game.
 *
 * Everything specific to this game lives under this folder: its endpoints,
 * its state adapter, its screens, its theme. The platform imports only this
 * module object, so a second game is added without touching platform code.
 *
 * `screens` is filled in as the flow branches land; the host renders a
 * clearly-labelled placeholder for any status not yet mapped, which keeps a
 * partially-built game runnable end to end.
 */
export const guespyModule = defineGameModule({
  id: "GUESPY",

  meta: {
    name: "GueSpy",
    tagline: "Everyone gets the word. Except one of you.",
    emblem: "🕵",
    players: "3-10 players",
    length: "5 min a round",
  },

  modes: [PLAY_MODES.PASS_AND_PLAY],

  theme: "guespy",

  useSession: useGueSpySession,

  /*
   * Offered before the game screens when there is something worth resuming.
   * Setup states are excluded — asking whether to continue an empty game is
   * a question with no meaning.
   */
  entry: {
    Screen: GameEntryScreen,
    shouldShow: (session) => isResumable(session.status),
  },

  /*
   * Contributed to the platform's admin area. The categories and the words
   * drawn from them are this game's content, so the screens for managing
   * them live here rather than in `platform/`, and the admin shell collects
   * them the same way the hub collects `meta`.
   */
  admin: {
    sections: [
      {
        id: "guespy-word-bank",
        label: "Word bank",
        /*
         * Lazy, so the word bank is not in the bundle every player
         * downloads. The module itself is imported by the registry — which
         * the hub needs — so a plain import here would pull the whole admin
         * screen along with it. Whether a section is split is the game's
         * business; the shell renders it inside a Suspense boundary either
         * way.
         */
        Component: lazy(() =>
          import("./admin/WordBankSection").then((module) => ({
            default: module.WordBankSection,
          })),
        ),
      },
    ],
  },

  screens: {
    // A reset leaves the game at NOT_STARTED rather than CATEGORY_SELECTION,
    // so both map to the same first screen.
    NOT_STARTED: CategoryScreen,
    CATEGORY_SELECTION: CategoryScreen,
    GROUP_SELECTION: GroupScreen,
    GAME_OPTION_SELECTION: GameOptionScreen,
    WORD_AND_SPY_REVEAL: RevealScreen,
    DISCUSSION_TIME: DiscussionScreen,

    // A tie re-runs the identical flow, so both states share one screen.
    VOTING: VotingScreen,
    REVOTE: VotingScreen,

    SPY_GUESS: SpyGuessScreen,
    ROUND_END: RoundEndScreen,
    SCORING: ResultScreen,
  },
});

export default guespyModule;
