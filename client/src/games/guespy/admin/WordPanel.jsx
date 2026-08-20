import { useCallback, useEffect, useRef, useState } from "react";
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
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M13.5 3.5a1.9 1.9 0 0 1 2.7 2.7L7.6 14.8l-3.5.8.8-3.5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M4 6h12M8 6V4.5h4V6M6 6l.7 9.2h6.6L14 6M8.5 8.8v4M11.5 8.8v4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * One word. Reads as text until you choose to edit it, then becomes a field
 * in place — the same shape as a player row in `GroupFormModal`, rather than
 * a dialog for a single string.
 */
function WordRow({ word, onRenamed, onDeleteRequested, busy }) {
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
      <span className={styles.wordName}>{word.wordName}</span>

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
 * The selected category: what it is, and every word in it.
 *
 * @param category           the selected category row
 * @param onCategoryChanged  re-read the category list after a flag changes
 */
export function WordPanel({ category, onCategoryChanged, onToggleFlag }) {
  const toast = useToast();

  const [words, setWords] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    load();
  }, [load]);

  const parsed = parseWords(draft);

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
        toast.success(
          `Added ${added.length}. Skipped ${skipped.length} already in this category.`,
        );
      } else {
        toast.success(added.length === 1 ? `Added "${added[0]}".` : `Added ${added.length} words.`);
      }

      setDraft("");
      await load();
      await onCategoryChanged();
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
      await onCategoryChanged();
    }
  };

  if (!category) {
    return (
      <div className={styles.panel}>
        <EmptyState
          icon="📚"
          title="Pick a category"
          description="Choose one on the left to see and edit the words in it."
        />
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <header className={styles.head}>
        <div className={styles.title}>
          <h3 className={styles.name}>{category.categoryName}</h3>
          {/*
            words.length, not category.totalWords: the server's counter is
            incremented on add and decremented on delete rather than counted,
            so it can drift from the list right next to it. The list is the
            one that cannot be wrong.
          */}
          {words ? (
            <Badge tone="neutral">
              {words.length} {words.length === 1 ? "word" : "words"}
            </Badge>
          ) : null}
        </div>

        <div className={styles.flags}>
          <Switch
            label="Enabled"
            description="Off takes it out of play without deleting it."
            checked={category.isEnabled !== false}
            onChange={(next) => onToggleFlag({ isEnabled: next })}
          />
          <Switch
            label="Admin only"
            description="Only admins see this category."
            checked={Boolean(category.adminOnly)}
            onChange={(next) => onToggleFlag({ adminOnly: next })}
          />
        </div>
      </header>

      <form className={styles.add} onSubmit={submitWords}>
        <label className={styles.addLabel} htmlFor="bulk-words">
          Add words
        </label>
        <textarea
          id="bulk-words"
          className={styles.textarea}
          rows={4}
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

      {words === null && !loadError ? (
        <div className={styles.words}>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} height="2.5rem" />
          ))}
        </div>
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
      ) : (
        <ul className={styles.words}>
          {words.map((word) => (
            <WordRow
              key={word.id}
              word={word}
              busy={adding}
              onRenamed={load}
              onDeleteRequested={setPendingDelete}
            />
          ))}
        </ul>
      )}

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
