import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Badge, Button, EmptyState, LoadingBlock, Screen } from "../ui";
import { getGameModule } from "../games/registry";
import styles from "./GameHost.module.css";

/**
 * Runs whichever game the route names.
 *
 * The host is the platform's only contact with a game, and it knows nothing
 * about any of them: it looks the module up, applies its theme, drives its
 * session hook, and renders the screen that hook's status maps to. Adding a
 * game changes nothing in this file.
 *
 * Mounted with a key on the game id (see AppRoutes) so switching games
 * remounts rather than swapping one module's hooks for another's mid-render.
 */
function GameRuntime({ module }) {
  const session = module.useSession();

  /*
   * The resume prompt is a question about *arriving* at a game, so the answer
   * is latched from the first status this mount ever sees and never
   * reconsidered.
   *
   * Re-evaluating it per render is wrong in a way that only shows up once
   * real screens exist: advancing through setup passes through states that
   * count as resumable, so choosing a category would bounce the player
   * straight back to "you have a game in progress" — mid-flow, having just
   * pressed Continue.
   */
  const [entryPhase, setEntryPhase] = useState("undecided");

  useEffect(() => {
    if (entryPhase !== "undecided" || session.status === null) return;
    const wanted = module.entry?.shouldShow(session) ?? false;
    setEntryPhase(wanted ? "showing" : "done");
  }, [entryPhase, session, module.entry]);

  // Re-skin the whole app for as long as this game is open.
  useEffect(() => {
    document.documentElement.dataset.game = module.theme;
    return () => {
      delete document.documentElement.dataset.game;
    };
  }, [module.theme]);

  // First load: nothing to render until we know where the game is.
  if (session.isLoading && session.status === null) {
    return (
      <div className={styles.pending}>
        <LoadingBlock label="Picking up the game…" />
      </div>
    );
  }

  if (session.error && session.status === null) {
    return (
      <Screen center width="reading" title="Couldn't load the game">
        <EmptyState
          tone="error"
          icon="⚠"
          title="The game state didn't come back"
          description="The server may be unreachable. Try again, or head back to the games list."
          actions={
            <>
              <Button onClick={session.refresh}>Try again</Button>
              <Button variant="secondary" as={Link} to="/">
                All games
              </Button>
            </>
          }
        />
      </Screen>
    );
  }

  // Offer to resume before dropping the player into a game already underway.
  if (entryPhase === "showing" && module.entry) {
    const EntryScreen = module.entry.Screen;
    return (
      <EntryScreen
        session={session}
        onContinue={() => setEntryPhase("done")}
        onNewGame={async () => {
          await session.reset();
          setEntryPhase("done");
        }}
      />
    );
  }

  // Hold the first paint until the entry question has been answered, so a
  // resumable game never flashes its live screen before the prompt.
  if (entryPhase === "undecided") {
    return (
      <div className={styles.pending}>
        <LoadingBlock label="Picking up the game…" />
      </div>
    );
  }

  const ScreenForStatus = module.screens[session.status];
  if (ScreenForStatus) {
    return <ScreenForStatus session={session} />;
  }

  /*
   * A status with no screen yet. This is scaffolding while the flow branches
   * land — it names the state and shows the payload the real screen will be
   * built against, which is more useful than a blank page and impossible to
   * mistake for finished work.
   */
  return (
    <Screen
      center
      width="reading"
      eyebrow={module.meta.name}
      title="This screen isn't built yet"
      subtitle="The game reached a state whose screen is still on the way."
    >
      <div className={styles.statusList}>
        <Badge tone="accent" size="lg">
          {session.status ?? "unknown state"}
        </Badge>
      </div>

      {session.data && Object.keys(session.data).length > 0 ? (
        <pre className={styles.payload}>{JSON.stringify(session.data, null, 2)}</pre>
      ) : null}

      <div className={styles.statusList}>
        <Button variant="secondary" onClick={session.refresh} loading={session.isLoading}>
          Refresh state
        </Button>
        <Button variant="ghost" as={Link} to="/">
          All games
        </Button>
      </div>
    </Screen>
  );
}

export function GameHost() {
  const { gameId } = useParams();
  const module = getGameModule(gameId);

  // The server offered a game this build cannot render, or the URL was typed
  // by hand. Either way the games list is the honest destination.
  if (!module) return <Navigate to="/" replace />;

  return (
    <div className={styles.host}>
      <GameRuntime module={module} />
    </div>
  );
}

export default GameHost;
