import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, EmptyState, Skeleton, TextInput, useToast } from "../../../ui";
import { cn } from "../../../lib/cn";
import { useAppConfig } from "../../config/configContext";
import { findConfigSchema } from "../../config/configKeys";
import { fetchConfigs } from "../../config/configService";
import { refreshConfigCache, updateConfig } from "../configAdminService";
import { ActiveGamesEditor } from "./ActiveGamesEditor";
import styles from "./SettingsSection.module.css";

/** Edited by `ActiveGamesEditor`, not as a raw value. See that file for why. */
const ACTIVE_GAMES_KEY = "active_games";

/**
 * Check a value against what this frontend knows the key is meant to hold.
 *
 * Returns an error string, or null if it is fine — including for keys the
 * schema does not know, which are the server's business and are passed
 * through untouched.
 */
function validate(key, raw) {
  const schema = findConfigSchema(key);
  if (!schema) return null;
  if (!raw.trim()) return "Can't be empty.";

  if (schema.kind === "number" && schema.parse(raw) === undefined) {
    return "Must be a number.";
  }

  if (schema.kind === "json" && schema.parse(raw) === undefined) {
    return "Not valid JSON.";
  }

  return null;
}

/**
 * The server's configuration.
 *
 * Every value is checked against `CONFIG_SCHEMA` before it is sent. That
 * table already existed for *reading* config; using the same parsers to
 * guard writing is what stops a typo in `scoring_config` from being saved
 * and then discovered by every player at once. Keys the schema does not know
 * are still listed and editable — the server may hold settings this
 * frontend has no business validating — they just are not second-guessed.
 *
 * `active_games` is pulled out into its own editor rather than left as a
 * JSON box; it is the contents of the home screen and deserves more than
 * valid-JSON as a standard.
 */
export function SettingsSection() {
  const toast = useToast();
  const { reload } = useAppConfig();

  const [rows, setRows] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const next = await fetchConfigs();
      setRows(next);
      setDrafts(Object.fromEntries(next.map((row) => [row.key, row.value ?? ""])));
    } catch (error) {
      setLoadError(error);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byKey = useMemo(
    () => new Map((rows ?? []).map((row) => [row.key, row])),
    [rows],
  );

  const activeGamesRow = byKey.get(ACTIVE_GAMES_KEY);
  const activeGames = useMemo(() => {
    if (!activeGamesRow?.value) return [];
    try {
      const parsed = JSON.parse(activeGamesRow.value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // A value already broken on the server. The editor starts from empty
      // rather than refusing to render, and saving replaces the bad value.
      return [];
    }
  }, [activeGamesRow?.value]);

  const editable = (rows ?? []).filter((row) => row.key !== ACTIVE_GAMES_KEY);

  const changed = editable.filter((row) => (drafts[row.key] ?? "") !== (row.value ?? ""));
  const errors = changed
    .map((row) => [row.key, validate(row.key, drafts[row.key] ?? "")])
    .filter(([, error]) => error);

  const save = async () => {
    setSaving(true);

    // One PUT per changed key — the endpoint takes a single key/value pair.
    // Sequential rather than parallel: each write refreshes the server's
    // cache, and a burst of concurrent refreshes is worth avoiding for a
    // handful of rows.
    const failed = [];
    for (const row of changed) {
      try {
        await updateConfig(row.key, drafts[row.key]);
      } catch {
        failed.push(row.key);
      }
    }

    await load();
    // The running app reads these too — player limits, spy bounds — so pick
    // the change up without making anyone reload the page.
    await reload();
    setSaving(false);

    if (failed.length === 0) {
      toast.success(changed.length === 1 ? "Setting saved." : `${changed.length} settings saved.`);
    } else {
      toast.error(`Couldn't save: ${failed.join(", ")}.`);
    }
  };

  const saveActiveGames = async (games) => {
    await updateConfig(ACTIVE_GAMES_KEY, JSON.stringify(games));
    await load();
    await reload();
    toast.success("Games list saved.");
  };

  const refreshCache = async () => {
    setRefreshing(true);
    try {
      await refreshConfigCache();
      await load();
      await reload();
      toast.success("Config cache reloaded from the database.");
    } catch {
      toast.error("Couldn't refresh the cache. Try again.");
    } finally {
      setRefreshing(false);
    }
  };

  if (rows === null && !loadError) {
    return (
      <div className={styles.rows}>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} height="4rem" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <EmptyState
        tone="error"
        icon="⚠"
        title="Couldn't load settings"
        description="The config list didn't come back. Check the connection and try again."
        actions={<Button onClick={load}>Try again</Button>}
      />
    );
  }

  return (
    <div className={styles.section}>
      <ActiveGamesEditor value={activeGames} onSave={saveActiveGames} />

      <section className={styles.block}>
        <header className={styles.head}>
          <div>
            <h3 className={styles.title}>Settings</h3>
            <p className={styles.subtitle}>
              Applied by the engine as soon as they're saved — no cache refresh needed.
            </p>
          </div>
        </header>

        <div className={styles.rows}>
          {editable.map((row) => {
            const schema = findConfigSchema(row.key);
            const draft = drafts[row.key] ?? "";
            const isDirty = draft !== (row.value ?? "");
            const error = isDirty ? validate(row.key, draft) : null;
            const multiline = schema?.kind === "json";

            return (
              <div key={row.key} className={cn(styles.row, isDirty && styles.rowDirty)}>
                <div className={styles.rowHead}>
                  <code className={styles.key}>{row.key}</code>
                  {/* Inactive rows are served by /configs but not by the
                      engine's cache, so they read as live here and are not. */}
                  {row.active === false ? <Badge tone="warning">Inactive</Badge> : null}
                  {!schema ? <Badge tone="neutral">Not read by this app</Badge> : null}
                </div>

                {multiline ? (
                  <textarea
                    className={cn(styles.textarea, error && styles.invalid)}
                    rows={4}
                    value={draft}
                    disabled={saving}
                    aria-label={row.key}
                    onChange={(event) =>
                      setDrafts((current) => ({ ...current, [row.key]: event.target.value }))
                    }
                  />
                ) : (
                  <TextInput
                    size="sm"
                    value={draft}
                    disabled={saving}
                    aria-label={row.key}
                    error={error}
                    onChange={(event) =>
                      setDrafts((current) => ({ ...current, [row.key]: event.target.value }))
                    }
                  />
                )}

                {multiline && error ? (
                  <p className={styles.rowError} role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {changed.length > 0 ? (
          <div className={styles.saveBar}>
            <span className={styles.saveHint}>
              {errors.length > 0
                ? `${errors.length} of ${changed.length} changed ${changed.length === 1 ? "setting is" : "settings are"} invalid.`
                : `${changed.length} changed ${changed.length === 1 ? "setting" : "settings"}.`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={() =>
                setDrafts(Object.fromEntries(rows.map((row) => [row.key, row.value ?? ""])))
              }
            >
              Discard
            </Button>
            <Button size="sm" onClick={save} loading={saving} disabled={errors.length > 0}>
              Save
            </Button>
          </div>
        ) : null}
      </section>

      {/*
        A repair tool, not a step in saving. Writes through this screen
        refresh the engine's cache themselves; this exists for the case where
        a row was changed straight in the database, which leaves /configs
        reporting the new value while the engine serves the old one forever.
      */}
      <section className={styles.block}>
        <header className={styles.head}>
          <div>
            <h3 className={styles.title}>Config cache</h3>
            <p className={styles.subtitle}>
              The engine keeps its own copy of these values. Reload it if a row was changed
              directly in the database — otherwise the engine keeps using the old value.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={refreshCache} loading={refreshing}>
            Reload cache
          </Button>
        </header>
      </section>
    </div>
  );
}

export default SettingsSection;
