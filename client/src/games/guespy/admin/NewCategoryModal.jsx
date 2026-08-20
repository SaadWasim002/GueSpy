import { useEffect, useState } from "react";
import { Button, Modal, Switch, TextInput, useToast } from "../../../ui";
import { createCategory } from "./adminService";
import styles from "./NewCategoryModal.module.css";

/**
 * Name a new category.
 *
 * Creating only — everything about an existing category is edited in the
 * panel beside the list, where you can see it. This exists because a
 * category has to be named before there is a panel to open.
 *
 * `admin_only` is offered here rather than left to the panel afterwards so a
 * category being filled in can start hidden. Between creating it and
 * flipping the switch it would otherwise be live and empty, and a category
 * with no words cannot be played.
 */
export function NewCategoryModal({ open, onClose, onCreated, existingNames = [] }) {
  const toast = useToast();

  const [name, setName] = useState("");
  const [adminOnly, setAdminOnly] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Reload each time it opens, so a cancelled attempt leaves nothing behind.
  useEffect(() => {
    if (!open) return;
    setName("");
    setAdminOnly(false);
    setError(null);
  }, [open]);

  const submit = async (event) => {
    event?.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the category a name.");
      return;
    }

    // The server compares names case-insensitively and 409s; catching it
    // here saves the round trip and keeps the message specific.
    if (existingNames.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) {
      setError("There's already a category with this name.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createCategory({ name: trimmed, adminOnly });
      toast.success(`"${trimmed}" created. Add some words to it.`);
      await onCreated();
      onClose();
    } catch (caught) {
      if (caught?.status === 409) {
        setError("There's already a category with this name.");
      } else if (caught?.status === 403) {
        setError("You don't have permission to create categories.");
      } else {
        setError("Couldn't create the category. Try again.");
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
      title="New category"
      description="Words are added once it exists."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting}>
            Create category
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
          description="Hidden from everyone but admins — useful while you're still filling it in."
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

export default NewCategoryModal;
