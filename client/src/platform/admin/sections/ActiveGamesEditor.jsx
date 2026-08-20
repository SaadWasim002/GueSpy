import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Modal, Switch, TextInput, useToast } from "../../../ui";
import { cn } from "../../../lib/cn";
import { getGameModule, listGameModules } from "../../../games/registry";
import styles from "./ActiveGamesEditor.module.css";

/**
 * The games the hub offers — `active_games`.
 *
 * This is the most dangerous value on the server. It is the entire contents
 * of the home screen: an empty list, a wrong `gameType`, or one stray comma
 * and every player signs in to "No games available". So it is deliberately
 * *not* edited as JSON.
 *
 * Three things follow from that, and each is a guard rather than a nicety:
 *
 *   1. **The value is rebuilt from structured state on every save**, so a
 *      malformed `active_games` cannot be written from this screen at all —
 *      there is no text box to mistype.
 *   2. **A game can only be added from the module registry.** A `gameType`
 *      with no module in this build renders as "coming soon" rather than a
 *      working card, so hand-typing one is a way to publish something
 *      nobody can play. The picker only offers what this build can render.
 *   3. **Removing asks first**, and if the change would leave the hub with
 *      nothing enabled it asks harder — that is the one edit here that takes
 *      the whole platform down rather than one game.
 *
 * @param value     the parsed `active_games` array from config
 * @param onSave    persist a new array; resolves once written and re-read
 */
export function ActiveGamesEditor({ value, onSave }) {
  const toast = useToast();

  const server = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const [games, setGames] = useState(server);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    setGames(server);
  }, [server]);

  const dirty = JSON.stringify(games) !== JSON.stringify(server);
  const enabledCount = games.filter((game) => game?.enabled).length;

  /** Games this build can render that are not on the list yet. */
  const addable = listGameModules().filter(
    (module) => !games.some((game) => game.gameType === module.id),
  );

  const patch = (gameType, changes) =>
    setGames((current) =>
      current.map((game) => (game.gameType === gameType ? { ...game, ...changes } : game)),
    );

  const add = (module) => {
    setGames((current) => [
      ...current,
      {
        gameType: module.id,
        name: module.meta?.name ?? module.id,
        description: module.meta?.tagline ?? "",
        // Off to begin with. Adding a game and publishing it to every player
        // are two decisions, and only one of them was just made.
        enabled: false,
      },
    ]);
    setAdding(false);
  };

  const removeArmed =
    // Removing the last enabled game empties the hub for everyone, so that
    // one is gated on typing the name. Any other removal is a dialog.
    !pendingRemove?.wouldEmptyHub ||
    confirmText.trim().toLowerCase() === pendingRemove?.game?.name?.toLowerCase();

  const confirmRemove = () => {
    setGames((current) => current.filter((game) => game.gameType !== pendingRemove.game.gameType));
    setPendingRemove(null);
  };

  const requestRemove = (game) => {
    const remaining = games.filter((other) => other.gameType !== game.gameType);
    setConfirmText("");
    setPendingRemove({
      game,
      wouldEmptyHub: game.enabled && remaining.every((other) => !other.enabled),
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(games);
    } catch {
      toast.error("Couldn't save the games list. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.block}>
      <header className={styles.head}>
        <div>
          <h3 className={styles.title}>Games</h3>
          <p className={styles.subtitle}>
            What the hub offers. Every player sees this list the moment it is saved.
          </p>
        </div>
        {enabledCount === 0 ? (
          <Badge tone="danger">Hub is empty</Badge>
        ) : (
          <Badge tone="neutral">
            {enabledCount} live
          </Badge>
        )}
      </header>

      <div className={styles.games}>
        {games.length === 0 ? (
          <p className={styles.none}>No games listed. The hub will be empty.</p>
        ) : (
          games.map((game) => {
            // A listed game with no module in this build cannot actually be
            // played — the hub shows it as coming soon. Worth saying out
            // loud, since the row otherwise looks perfectly healthy.
            const playable = Boolean(getGameModule(game.gameType));

            return (
              <div
                key={game.gameType}
                className={cn(styles.game, !game.enabled && styles.gameOff)}
              >
                <div className={styles.gameHead}>
                  <span className={styles.gameName}>{game.name || game.gameType}</span>
                  <code className={styles.gameType}>{game.gameType}</code>
                  {!playable ? <Badge tone="warning">No client module</Badge> : null}
                </div>

                <TextInput
                  size="sm"
                  label="Description"
                  value={game.description ?? ""}
                  onChange={(event) => patch(game.gameType, { description: event.target.value })}
                  maxLength={140}
                />

                <div className={styles.gameFoot}>
                  <Switch
                    label="Offered in the hub"
                    checked={Boolean(game.enabled)}
                    onChange={(next) => patch(game.gameType, { enabled: next })}
                  />
                  <Button
                    variant="dangerGhost"
                    size="sm"
                    onClick={() => requestRemove(game)}
                    disabled={saving}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/*
        Only registered modules. Typing a gameType by hand is how you publish
        a card that cannot be clicked, so the option is not offered.
      */}
      {addable.length > 0 ? (
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)} disabled={saving}>
          + Add a game
        </Button>
      ) : (
        <p className={styles.allAdded}>
          Every game this build can render is already listed. A new one needs a game module
          shipped in the client before it can be offered.
        </p>
      )}

      {dirty ? (
        <div className={styles.saveBar}>
          <span className={styles.saveHint}>
            {enabledCount === 0
              ? "Saving this leaves every player with an empty hub."
              : "Unsaved changes to the games list."}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setGames(server)} disabled={saving}>
            Discard
          </Button>
          <Button size="sm" onClick={save} loading={saving}>
            Save games
          </Button>
        </div>
      ) : null}

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        size="sm"
        title="Add a game"
        description="Only games this build ships a module for — anything else would appear in the hub but not open."
      >
        <div className={styles.picker}>
          {addable.map((module) => (
            <button
              key={module.id}
              type="button"
              className={styles.pick}
              onClick={() => add(module)}
            >
              <span className={styles.pickEmblem} aria-hidden="true">
                {module.meta?.emblem}
              </span>
              <span className={styles.pickText}>
                <span className={styles.pickName}>{module.meta?.name ?? module.id}</span>
                <span className={styles.pickTagline}>{module.meta?.tagline}</span>
              </span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        size="sm"
        title={`Remove "${pendingRemove?.game?.name ?? ""}"?`}
        description={
          pendingRemove?.wouldEmptyHub
            ? "This is the only game currently offered. Removing it leaves every player with an empty hub."
            : "It disappears from the hub once you save. Nothing is deleted — you can add it back."
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingRemove(null)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={confirmRemove} disabled={!removeArmed}>
              Remove
            </Button>
          </>
        }
      >
        {pendingRemove?.wouldEmptyHub ? (
          <TextInput
            label={`Type "${pendingRemove?.game?.name ?? ""}" to confirm`}
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            autoComplete="off"
          />
        ) : null}
      </Modal>
    </section>
  );
}

export default ActiveGamesEditor;
