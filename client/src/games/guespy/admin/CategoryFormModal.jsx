import { useEffect, useState } from "react";
import { Button, Modal, Switch, TextInput, useToast } from "../../../ui";
import { createCategory, updateCategory } from "./adminService";
import styles from "./CategoryFormModal.module.css";

/**
 * Create or rename a category.
 *
 * One form for both, the same way `GroupFormModal` serves creating and
 * editing a group: the fields are identical and only the verb changes, so a
 * second component would be two copies of the validation to keep in step.
 *
 * `is_enabled` is deliberately not here — it is a state you flip on a
 * category you are looking at, not a decision you make while naming one. It
 * lives on the row instead.
 *
 * @param category  the category being edited, or null to create
 */
export function CategoryFormModal({ open, onClose, onSaved, category = null, existingNames = [] }) {
  const toast = useToast();
  const isEdit = Boolean(category);

  const [name, setName] = useState("");
  const [adminOnly, setAdminOnly] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Reload each time it opens, so a cancelled edit leaves nothing behind.
  useEffect(() => {
    if (!open) return;
    setName(category?.categoryName ?? "");
    setAdminOnly(Boolean(category?.adminOnly));
    setError(null);
  }, [open, category]);

  const validate = () => {
    const trimmed = name.trim();
    if (!trimmed) return "Give the category a name.";

    // A category keeping its own name is not a clash with itself. The server
    // compares case-insensitively and 409s; catching it here saves the round
    // trip and keeps the message specific.
    const clash = existingNames.some(
      (existing) =>
        existing.toLowerCase() === trimmed.toLowerCase() &&
        existing.toLowerCase() !== category?.categoryName?.toLowerCase(),
    );

    return clash ? "There's already a category with this name." : null;
  };

  const submit = async (event) => {
    event?.preventDefault();

    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isEdit) {
        await updateCategory(category.id, { name: name.trim(), adminOnly });
        toast.success("Category updated.");
      } else {
        await createCategory({ name: name.trim(), adminOnly });
        toast.success("Category created.");
      }

      await onSaved();
      onClose();
    } catch (caught) {
      if (caught?.status === 409) {
        setError("There's already a category with this name.");
      } else if (caught?.status === 404) {
        setError("That category no longer exists.");
      } else if (caught?.status === 403) {
        setError("You don't have permission to change categories.");
      } else {
        setError(`Couldn't ${isEdit ? "update" : "create"} the category. Try again.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={isEdit ? "Edit category" : "New category"}
      description={
        isEdit
          ? "Rename it, or change who can play it."
          : "Words are added once the category exists."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting}>
            {isEdit ? "Save changes" : "Create category"}
          </Button>
        </>
      }
    >
      <form className={styles.form} onSubmit={submit} noValidate>
        <TextInput
          label="Category name"
          placeholder="Movies"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          maxLength={60}
          autoFocus
        />

        <Switch
          label="Admin only"
          description="Hidden from everyone but admins. Useful for a category you're still filling in."
          checked={adminOnly}
          onChange={setAdminOnly}
        />

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

export default CategoryFormModal;
