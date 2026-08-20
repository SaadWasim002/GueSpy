import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Modal,
  Skeleton,
  TextInput,
  useToast,
} from "../../../ui";
import { deleteCategory, fetchAllCategories, updateCategory } from "./adminService";
import { CategoryFormModal } from "./CategoryFormModal";
import { WordPanel } from "./WordPanel";
import styles from "./WordBankSection.module.css";

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
 * GueSpy's word bank: the categories, and the words drawn from them.
 *
 * One section rather than two tabs, because a word list means nothing
 * without a category — the backend says the same thing, since the only way
 * to read words is `/api/v1/categories/{id}/words`. Categories on the left,
 * the selected one's words on the right.
 *
 * Contributed to the platform's admin area through the game module's `admin`
 * field, so nothing in `platform/` knows this screen exists.
 */
export function WordBankSection() {
  const toast = useToast();

  const [categories, setCategories] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // null = closed, { category: null } = create, { category } = edit.
  const [form, setForm] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
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
   * Flip `is_enabled` or `admin_only` on the selected category.
   *
   * The re-read afterwards is what makes the change visible, and it is also
   * where a backend gap shows up: `findAllActiveCategoryForUser` filters
   * `isEnabled = true` for admins too, so disabling a category currently
   * removes it from this very list. Rather than let it vanish silently, say
   * what happened. Once that query is widened the branch stops firing.
   */
  const toggleFlag = async (changes) => {
    if (!selected) return;
    const wasCalled = selected.categoryName;

    try {
      await updateCategory(selected.id, changes);
      const next = await fetchAllCategories();
      setCategories(next);

      if (!next.some((category) => category.id === selected.id)) {
        setSelectedId(null);
        toast.warning(
          `"${wasCalled}" is disabled and the server no longer lists it, so it can't be re-enabled from here yet.`,
          { dedupeKey: "disabled-category-vanished" },
        );
      }
    } catch (error) {
      toast.error(
        error?.status === 404
          ? "That category no longer exists."
          : error?.status === 403
            ? "You don't have permission to change categories."
            : "Couldn't save that change. Try again.",
      );
      load();
    }
  };

  const openDelete = (category) => {
    setPendingDelete(category);
    setDeleteConfirmText("");
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);

    try {
      await deleteCategory(pendingDelete.id);
      toast.success(`"${pendingDelete.categoryName}" deleted.`);
      if (selectedId === pendingDelete.id) setSelectedId(null);
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
      setPendingDelete(null);
      await load();
    }
  };

  // Typing the name is the gate. Deliberately case-insensitive and trimmed:
  // the point is to make the action deliberate, not to test typing accuracy.
  const deleteArmed =
    deleteConfirmText.trim().toLowerCase() === pendingDelete?.categoryName?.toLowerCase();

  return (
    <div className={styles.layout}>
      <div className={styles.list}>
        <div className={styles.listHead}>
          <span className={styles.count}>
            {categories === null ? "Loading…" : `${categories.length} categories`}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setForm({ category: null })}>
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
            actions={<Button onClick={() => setForm({ category: null })}>New category</Button>}
          />
        ) : (
          <div className={styles.rows}>
            {categories.map((category) => (
              /*
               * The card is the select button. Edit and delete sit outside
               * it as siblings — a button cannot contain other buttons, and
               * nesting them would select the category on the way through.
               * Same arrangement as the group cards.
               */
              <div key={category.id} className={styles.slot}>
                <Card
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

                <div className={styles.tools}>
                  <IconButton
                    label={`Edit ${category.categoryName}`}
                    size="sm"
                    variant="solid"
                    onClick={() => setForm({ category })}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    label={`Delete ${category.categoryName}`}
                    size="sm"
                    variant="solid"
                    onClick={() => openDelete(category)}
                  >
                    <TrashIcon />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <WordPanel category={selected} onCategoryChanged={load} onToggleFlag={toggleFlag} />

      <CategoryFormModal
        open={form !== null}
        category={form?.category ?? null}
        onClose={() => setForm(null)}
        onSaved={load}
        existingNames={(categories ?? []).map((category) => category.categoryName)}
      />

      <Modal
        open={pendingDelete !== null}
        onClose={deleting ? undefined : () => setPendingDelete(null)}
        dismissible={!deleting}
        size="sm"
        title={`Delete "${pendingDelete?.categoryName ?? ""}"?`}
        description="Every word in it is deleted too. This can't be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)} disabled={deleting}>
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
          category and every word in it with no way back, and the rows look
          alike enough to click the wrong one.
        */}
        <div className={styles.confirm}>
          <p className={styles.confirmCount}>
            {pendingDelete?.totalWords
              ? `${pendingDelete.totalWords} words go with it.`
              : "This category has no words saved."}
          </p>
          <TextInput
            label={`Type "${pendingDelete?.categoryName ?? ""}" to confirm`}
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
