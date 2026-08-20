import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  IconButton,
  Modal,
  Skeleton,
  Switch,
  TextInput,
  useToast,
} from "../../../ui";
import { cn } from "../../../lib/cn";
import { addWords, deleteWord, fetchWords, updateWord } from "./adminService";
import styles from "./WordPanel.module.css";

/** Above this many words the list gets a filter box. */
const FILTER_THRESHOLD = 12;

/**
 * Split a pasted block into words.
 *
 * Newlines *and* commas, because both are how a list arrives — one per line
 * from a document, comma-separated from a spreadsheet cell or a message. The
 * server ignores blanks anyway; trimming here is so the count shown before
 * submitting matches what actually gets added.
 */
function parseWords(raw) {
  return raw
    .split(/[\n,]/)
    .map((word) => word.trim())
    .filter(Boolean);
}

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M13.5 3.5a1.9 1.9 0 0 1 2.7 2.7L7.6 14.8l-3.5.8.8-3.5z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M4 6h12M8 6V4.5h4V6M6 6l.7 9.2h6.6L14 6M8.5 8.8v4M11.5 8.8v4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * One word in the grid.
 *
 * Reads as a word until you choose to edit it, then becomes a field in
 * place. Editing spans the full row — an input, a Save and a Cancel do not
 * fit in a track sized for the word "Dune".
 */
function WordCell({ word, onRenamed, onDeleteRequested, busy }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(word.wordName);
  const [saving, setSaving] = useState(false);

  const start = () => {
    setDraft(word.wordName);
    setEditing(true);
  };

  const save = async () => {
    const next = draft.trim();
    if (!next || next === word.wordName) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await updateWord(word.id, next);
      setEditing(false);
      await onRenamed();
    } catch (error) {
      toast.error(
        error?.status === 409
          ? `"${next}" is already in this category.`
          : error?.status === 404
            ? "That word is already gone."
            : "Couldn't rename that word. Try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <li className={cn(styles.word, styles.wordEditing)}>
        <TextInput
          className={styles.wordField}
          size="sm"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              save();
            }
            if (event.key === "Escape") setEditing(false);
          }}
          aria-label={`Rename ${word.wordName}`}
          autoFocus
        />
        <Button size="sm" onClick={save} loading={saving}>
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
          Cancel
        </Button>
      </li>
    );
  }

  return (
    <li className={styles.word}>
      {/* title, because a long word ellipsises inside its track. */}
      <span className={styles.wordName} title={word.wordName}>
        {word.wordName}
      </span>

      <div className={styles.wordTools}>
        <IconButton label={`Rename ${word.wordName}`} size="sm" onClick={start} disabled={busy}>
          <EditIcon />
        </IconButton>
        <IconButton
          label={`Delete ${word.wordName}`}
          size="sm"
          onClick={() => onDeleteRequested(word)}
          disabled={busy}
        >
          <TrashIcon />
        </IconButton>
      </div>
    </li>
  );
}

/**
 * The selected category — everything about it in one place.
 *
 * Its name, its two flags, its words, and the button that deletes it. The
 * list on the left is navigation and nothing else: a row that both selects
 * and carries its own edit and delete controls makes every click a small
 * decision about which of three things you meant.
 *
 * @param category        the selected category row
 * @param existingNames   every category name, for the rename clash check
 * @param onSaveCategory  persist changed name/flags; resolves once re-read
 * @param onWordsChanged  re-read the category list after words change
 * @param onDeleteRequested  ask the section to open its delete confirmation
 */
export function WordPanel({
  category,
  existingNames = [],
  onSaveCategory,
  onWordsChanged,
  onDeleteRequested,
}) {
  const toast = useToast();

  const [words, setWords] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /*
   * Name and flags are edited locally and saved on demand.
   *
   * Saving on each flip would fire a request per toggle — two requests to
   * change both flags, no way to change your mind, and one of them
   * (disabling) currently makes the category vanish from the list. Held as a
   * draft, everything about the category goes up together and only when
   * asked for.
   *
   * Re-synced whenever the server's values change, which covers both picking
   * a different category and the re-read after a save.
   */
  const server = useMemo(
    () => ({
      name: category?.categoryName ?? "",
      isEnabled: category?.isEnabled !== false,
      adminOnly: Boolean(category?.adminOnly),
    }),
    [category?.categoryName, category?.isEnabled, category?.adminOnly],
  );

  const [form, setForm] = useState(server);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(server);
  }, [server, category?.id]);

  const trimmedName = form.name.trim();
  const dirty =
    trimmedName !== server.name ||
    form.isEnabled !== server.isEnabled ||
    form.adminOnly !== server.adminOnly;

  // A category keeping its own name is not a clash with itself.
  const nameError = !trimmedName
    ? "Give the category a name."
    : existingNames.some(
          (existing) =>
            existing.toLowerCase() === trimmedName.toLowerCase() &&
            existing.toLowerCase() !== server.name.toLowerCase(),
        )
      ? "There's already a category with this name."
      : null;

  const categoryId = category?.id;
  // Guards against a slow response for a category the admin has already
  // clicked away from overwriting the one now on screen.
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (categoryId == null) return;
    const id = (requestId.current += 1);

    setLoadError(null);
    try {
      const next = await fetchWords(categoryId);
      if (id === requestId.current) setWords(next);
    } catch (error) {
      if (id === requestId.current) setLoadError(error);
    }
  }, [categoryId]);

  useEffect(() => {
    // Clear first: without this the previous category's words stay on screen
    // while the new ones load, which reads as though they belong to it.
    setWords(null);
    setDraft("");
    setFilter("");
    load();
  }, [load]);

  const parsed = parseWords(draft);

  const needle = filter.trim().toLowerCase();
  const visible = needle
    ? (words ?? []).filter((word) => word.wordName.toLowerCase().includes(needle))
    : (words ?? []);

  const save = async () => {
    if (nameError) return;
    setSaving(true);

    // Send only what actually changed, so an untouched field is never
    // restated — the server applies each one only when present.
    const changes = {};
    if (trimmedName !== server.name) changes.name = trimmedName;
    if (form.isEnabled !== server.isEnabled) changes.isEnabled = form.isEnabled;
    if (form.adminOnly !== server.adminOnly) changes.adminOnly = form.adminOnly;

    try {
      await onSaveCategory(changes);
    } finally {
      setSaving(false);
    }
  };

  const submitWords = async (event) => {
    event?.preventDefault();
    if (parsed.length === 0) return;

    setAdding(true);
    try {
      const { added = [], skipped = [] } = await addWords(categoryId, parsed);

      // Partial success is the normal outcome here, so both halves are
      // reported rather than treating skipped duplicates as a failure.
      if (added.length === 0) {
        toast.info(
          skipped.length === 1
            ? `"${skipped[0]}" is already in this category.`
            : `All ${skipped.length} were already in this category.`,
        );
      } else if (skipped.length > 0) {
        toast.success(`Added ${added.length}. Skipped ${skipped.length} already in this category.`);
      } else {
        toast.success(added.length === 1 ? `Added "${added[0]}".` : `Added ${added.length} words.`);
      }

      setDraft("");
      await load();
      await onWordsChanged();
    } catch (error) {
      toast.error(
        error?.status === 404
          ? "That category no longer exists."
          : "Couldn't add those words. Try again.",
      );
    } finally {
      setAdding(false);
    }
  };

  const confirmDeleteWord = async () => {
    if (!pendingDelete) return;
    setDeleting(true);

    try {
      await deleteWord(pendingDelete.id);
      toast.success(`"${pendingDelete.wordName}" deleted.`);
    } catch (error) {
      toast.error(
        error?.status === 404
          ? "That word is already gone."
          : "Couldn't delete that word. Try again.",
      );
    } finally {
      setDeleting(false);
      setPendingDelete(null);
      // Either way the list is no longer trustworthy — re-read it.
      await load();
      await onWordsChanged();
    }
  };

  if (!category) {
    return (
      <div className={styles.panel}>
        <EmptyState
          icon="📚"
          title="Pick a category"
          description="Choose one on the left to edit it and the words in it."
        />
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.eyebrowRow}>
        <span className={styles.eyebrow}>Category</span>
        {/*
          words.length, not category.totalWords: the server's counter is
          incremented on add and decremented on delete rather than counted,
          so it can drift from the list right next to it. The list is the one
          that cannot be wrong.
        */}
        {words ? (
          <Badge tone="neutral">
            {words.length} {words.length === 1 ? "word" : "words"}
          </Badge>
        ) : null}
      </div>

      {/* Name and flags share one draft and one Save — they are all facts
          about the same row, and the server takes them in one call. */}
      <section className={styles.settings}>
        <TextInput
          label="Name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          error={dirty ? nameError : null}
          maxLength={60}
        />

        <Switch
          label="Enabled"
          description="Off takes it out of play without deleting it."
          checked={form.isEnabled}
          disabled={saving}
          onChange={(next) => setForm((current) => ({ ...current, isEnabled: next }))}
        />

        <Switch
          label="Admin only"
          description="Only admins see this category."
          checked={form.adminOnly}
          disabled={saving}
          onChange={(next) => setForm((current) => ({ ...current, adminOnly: next }))}
        />

        {/*
          Only once something has changed. A Save button that is always there
          and usually does nothing trains people to ignore it; one that
          appears is itself the notice that there is something unsaved.
        */}
        {dirty ? (
          <div className={styles.saveBar}>
            <span className={styles.saveHint}>Unsaved changes.</span>
            <Button variant="ghost" size="sm" onClick={() => setForm(server)} disabled={saving}>
              Discard
            </Button>
            <Button size="sm" onClick={save} loading={saving} disabled={Boolean(nameError)}>
              Save
            </Button>
          </div>
        ) : null}
      </section>

      <form className={styles.add} onSubmit={submitWords}>
        <label className={styles.addLabel} htmlFor="bulk-words">
          Add words
        </label>
        <textarea
          id="bulk-words"
          className={styles.textarea}
          rows={3}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={"Inception\nInterstellar\nDune"}
          disabled={adding}
        />
        <div className={styles.addFoot}>
          <span className={styles.addHint}>
            {parsed.length > 0
              ? `${parsed.length} ${parsed.length === 1 ? "word" : "words"} ready`
              : "One per line, or separated by commas."}
          </span>
          <Button size="sm" onClick={submitWords} loading={adding} disabled={parsed.length === 0}>
            Add {parsed.length > 0 ? parsed.length : ""}
          </Button>
        </div>
      </form>

      {/* A category can hold fifty-odd words; finding one of them is the
          common task, so it gets a box rather than the browser's find. */}
      {words && words.length > FILTER_THRESHOLD ? (
        <TextInput
          size="sm"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder={`Filter ${words.length} words`}
          aria-label="Filter words"
        />
      ) : null}

      {words === null && !loadError ? (
        <ul className={styles.words}>
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i}>
              <Skeleton height="2.25rem" />
            </li>
          ))}
        </ul>
      ) : loadError ? (
        <EmptyState
          tone="error"
          icon="⚠"
          title="Couldn't load the words"
          description="The list didn't come back. Check the connection and try again."
          actions={<Button onClick={load}>Try again</Button>}
        />
      ) : words.length === 0 ? (
        <EmptyState
          icon="✏"
          title="No words yet"
          description="A category with no words can't be played — add some above."
        />
      ) : visible.length === 0 ? (
        <p className={styles.noMatch}>
          Nothing matches “{filter.trim()}”.{" "}
          <button type="button" className={styles.clearFilter} onClick={() => setFilter("")}>
            Clear the filter
          </button>
        </p>
      ) : (
        <ul className={styles.words}>
          {visible.map((word) => (
            <WordCell
              key={word.id}
              word={word}
              busy={adding}
              onRenamed={load}
              onDeleteRequested={setPendingDelete}
            />
          ))}
        </ul>
      )}

      {/* Last, and quiet. It is the one action here that cannot be undone,
          so it does not belong anywhere a click might land by accident. */}
      <footer className={styles.danger}>
        <Button variant="dangerGhost" size="sm" onClick={onDeleteRequested}>
          Delete this category
        </Button>
        <span className={styles.dangerHint}>Deletes every word in it too.</span>
      </footer>

      <Modal
        open={pendingDelete !== null}
        onClose={deleting ? undefined : () => setPendingDelete(null)}
        dismissible={!deleting}
        size="sm"
        title={`Delete "${pendingDelete?.wordName ?? ""}"?`}
        description="It's removed from this category. You can add it again later."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Keep it
            </Button>
            <Button variant="danger" onClick={confirmDeleteWord} loading={deleting}>
              Delete word
            </Button>
          </>
        }
      />
    </div>
  );
}

export default WordPanel;
