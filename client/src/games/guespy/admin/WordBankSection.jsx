import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  Skeleton,
  TextInput,
  useToast,
} from "../../../ui";
import { deleteCategory, fetchAllCategories, updateCategory } from "./adminService";
import { NewCategoryModal } from "./NewCategoryModal";
import { WordPanel } from "./WordPanel";
import styles from "./WordBankSection.module.css";

/**
 * GueSpy's word bank: the categories, and the words drawn from them.
 *
 * One section rather than two tabs, because a word list means nothing
 * without a category — the backend says the same thing, since the only way
 * to read words is `/api/v1/categories/{id}/words`. Categories on the left,
 * everything about the selected one on the right.
 *
 * The list is *only* navigation. Editing a category, flipping its flags and
 * deleting it all live in the panel, so a row means one thing when you click
 * it. Deletion is confirmed here rather than there because it is this
 * component that owns the list and the selection it invalidates.
 *
 * Contributed to the platform's admin area through the game module's `admin`
 * field, so nothing in `platform/` knows this screen exists.
 */
export function WordBankSection() {
  const toast = useToast();

  const [categories, setCategories] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const [creating, setCreating] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setCategories(await fetchAllCategories());
    } catch (error) {
      setLoadError(error);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = categories?.find((category) => category.id === selectedId) ?? null;

  /**
   * Save the panel's draft — any of name, `is_enabled`, `admin_only`.
   *
   * Re-read rather than patched in place: a rename can collide, and the
   * server is the only thing that knows what the row looks like afterwards.
   * A disabled category stays in this list (see `fetchAllCategories`), so
   * the selection survives being switched off and can be switched back.
   */
  const saveCategory = async (changes) => {
    if (!selected) return;

    try {
      await updateCategory(selected.id, changes);
      setCategories(await fetchAllCategories());
      toast.success("Category saved.");
    } catch (error) {
      toast.error(
        error?.status === 409
          ? "There's already a category with this name."
          : error?.status === 404
            ? "That category no longer exists."
            : error?.status === 403
              ? "You don't have permission to change categories."
              : "Couldn't save that change. Try again.",
      );
      load();
    }
  };

  const confirmDelete = async () => {
    if (!selected) return;
    setDeleting(true);

    try {
      await deleteCategory(selected.id);
      toast.success(`"${selected.categoryName}" deleted.`);
      setSelectedId(null);
    } catch (error) {
      toast.error(
        error?.status === 404
          ? "That category is already gone."
          : error?.status === 403
            ? "You don't have permission to delete categories."
            : "Couldn't delete the category. Try again.",
      );
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
      await load();
    }
  };

  // Typing the name is the gate. Deliberately case-insensitive and trimmed:
  // the point is to make the action deliberate, not to test typing accuracy.
  const deleteArmed =
    deleteConfirmText.trim().toLowerCase() === selected?.categoryName?.toLowerCase();

  return (
    <div className={styles.layout}>
      <div className={styles.list}>
        <div className={styles.listHead}>
          <span className={styles.count}>
            {categories === null ? "Loading…" : `${categories.length} categories`}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
            + New
          </Button>
        </div>

        {categories === null && !loadError ? (
          <div className={styles.rows}>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} shape="card" height="4.5rem" />
            ))}
          </div>
        ) : loadError ? (
          <EmptyState
            tone="error"
            icon="⚠"
            title="Couldn't load categories"
            description="The list didn't come back. Check the connection and try again."
            actions={<Button onClick={load}>Try again</Button>}
          />
        ) : categories.length === 0 ? (
          <EmptyState
            icon="📂"
            title="No categories yet"
            description="Create one, then fill it with words."
            actions={<Button onClick={() => setCreating(true)}>New category</Button>}
          />
        ) : (
          <div className={styles.rows}>
            {categories.map((category) => (
              <Card
                key={category.id}
                interactive
                selected={selectedId === category.id}
                onClick={() => setSelectedId(category.id)}
                className={styles.category}
              >
                <span className={styles.categoryName}>{category.categoryName}</span>

                <div className={styles.meta}>
                  <span className={styles.wordCount}>{category.totalWords ?? 0} words</span>
                  {category.adminOnly ? <Badge tone="accent">Admin only</Badge> : null}
                  {category.isEnabled === false ? <Badge tone="warning">Disabled</Badge> : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <WordPanel
        category={selected}
        existingNames={(categories ?? []).map((category) => category.categoryName)}
        onSaveCategory={saveCategory}
        onWordsChanged={load}
        onDeleteRequested={() => {
          setDeleteConfirmText("");
          setConfirmingDelete(true);
        }}
      />

      <NewCategoryModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={load}
        existingNames={(categories ?? []).map((category) => category.categoryName)}
      />

      <Modal
        open={confirmingDelete}
        onClose={deleting ? undefined : () => setConfirmingDelete(false)}
        dismissible={!deleting}
        size="sm"
        title={`Delete "${selected?.categoryName ?? ""}"?`}
        description="Every word in it is deleted too. This can't be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
              Keep it
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              loading={deleting}
              disabled={!deleteArmed}
            >
              Delete category
            </Button>
          </>
        }
      >
        {/*
          Typing the name, rather than the two-button confirm used everywhere
          else. Undoing a pick is cheap and a dialog is enough; this erases a
          category and every word in it with no way back.
        */}
        <div className={styles.confirm}>
          <p className={styles.confirmCount}>
            {selected?.totalWords
              ? `${selected.totalWords} words go with it.`
              : "This category has no words saved."}
          </p>
          <TextInput
            label={`Type "${selected?.categoryName ?? ""}" to confirm`}
            value={deleteConfirmText}
            onChange={(event) => setDeleteConfirmText(event.target.value)}
            disabled={deleting}
            autoComplete="off"
          />
        </div>
      </Modal>
    </div>
  );
}

export default WordBankSection;
