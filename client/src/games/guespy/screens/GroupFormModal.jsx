import { useEffect, useMemo, useState } from "react";
import { Button, IconButton, Modal, TextInput, useToast } from "../../../ui";
import { createGroup, updateGroup } from "../groupService";
import styles from "./GroupFormModal.module.css";

let rowId = 0;
const makeRow = (name = "") => ({ key: `row-${(rowId += 1)}`, name });

/**
 * Create or edit a group of players.
 *
 * One form for both: an update is a full replace of the name and the whole
 * line-up, which is exactly what creating collects, so a second component
 * would be the same fields with a different verb — and two copies to keep in
 * step as the validation rules change.
 *
 * Player bounds come from server config rather than being hard-coded, because
 * the server rejects an out-of-range group and the two must agree.
 *
 * @param group  the group being edited, or null to create a new one
 */
export function GroupFormModal({
  open,
  onClose,
  onSaved,
  group = null,
  minPlayers,
  maxPlayers,
  existingNames,
}) {
  const toast = useToast();
  const isEdit = Boolean(group);

  const [groupName, setGroupName] = useState("");
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /*
   * Load the form each time it opens: the group under edit, or an empty one
   * pre-seeded with the minimum number of rows so the required shape is
   * obvious rather than something to discover by pressing Save.
   */
  useEffect(() => {
    if (!open) return;

    const existingPlayers = group?.players?.playerNames ?? [];
    setGroupName(group?.groupName ?? "");
    setRows(
      existingPlayers.length > 0
        ? existingPlayers.map((name) => makeRow(name))
        : Array.from({ length: minPlayers }, () => makeRow()),
    );
    setErrors({});
    setFormError(null);
  }, [open, group, minPlayers]);

  const filled = useMemo(() => rows.map((r) => r.name.trim()).filter(Boolean), [rows]);

  const setRowName = (key, name) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, name } : row)));
    setErrors((current) => ({ ...current, players: undefined }));
    setFormError(null);
  };

  const addRow = () => setRows((current) => [...current, makeRow()]);

  const removeRow = (key) => setRows((current) => current.filter((row) => row.key !== key));

  const validate = () => {
    const found = {};
    const name = groupName.trim();

    // A group keeping its own name is not a clash with itself, so the one
    // being edited is excluded from the comparison.
    const clashes = existingNames.filter(
      (existing) => !isEdit || existing.toLowerCase() !== group.groupName?.toLowerCase(),
    );

    if (!name) {
      found.groupName = "Give the group a name.";
    } else if (clashes.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
      // The server compares names case-insensitively and 409s; catching it
      // here saves a round trip and keeps the message specific.
      found.groupName = "You already have a group with this name.";
    }

    if (filled.length < minPlayers) {
      found.players = `Add at least ${minPlayers} players.`;
    } else if (filled.length > maxPlayers) {
      found.players = `That's more than the ${maxPlayers} players allowed.`;
    } else {
      const seen = new Set();
      const duplicate = filled.find((player) => {
        const key = player.toLowerCase();
        if (seen.has(key)) return true;
        seen.add(key);
        return false;
      });
      // Players are told apart by name all game — two Sams makes the voting
      // screen unusable.
      if (duplicate) found.players = `Two players are both called "${duplicate}".`;
    }

    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = { groupName: groupName.trim(), players: filled };

      if (isEdit) {
        await updateGroup(group.id, payload);
        toast.success("Group updated.");
      } else {
        await createGroup(payload);
        toast.success("Group created.");
      }

      await onSaved();
      onClose();
    } catch (error) {
      if (error?.status === 409) {
        setErrors((current) => ({
          ...current,
          groupName: "You already have a group with this name.",
        }));
      } else if (error?.status === 404) {
        // Only reachable if the group was removed elsewhere between opening
        // the form and saving it.
        setFormError("That group no longer exists.");
      } else if (error?.status === 403) {
        setFormError("That group belongs to someone else.");
      } else if (error?.status === 400) {
        setFormError(error.message || "Check the group name and player names.");
      } else {
        setFormError(`Couldn't ${isEdit ? "update" : "create"} the group. Try again.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit group" : "New group"}
      description={
        isEdit
          ? "Change the name or the line-up. Saving replaces both."
          : "Save the people you play with so you don't retype them every round."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting}>
            {isEdit ? "Save changes" : "Create group"}
          </Button>
        </>
      }
    >
      <form className={styles.form} onSubmit={submit} noValidate>
        <TextInput
          label="Group name"
          placeholder="Friday night crew"
          value={groupName}
          onChange={(event) => {
            setGroupName(event.target.value);
            setErrors((current) => ({ ...current, groupName: undefined }));
          }}
          error={errors.groupName}
          maxLength={40}
          autoFocus
        />

        <div>
          <div className={styles.playersHead}>
            <span className={styles.playersTitle}>Players</span>
            <span className={styles.playersHint}>
              {filled.length}/{maxPlayers} · at least {minPlayers}
            </span>
          </div>

          <div className={styles.playerRows}>
            {rows.map((row, index) => (
              <div key={row.key} className={styles.playerRow}>
                <span className={styles.playerIndex} aria-hidden="true">
                  {index + 1}
                </span>

                <TextInput
                  className={styles.playerField}
                  size="sm"
                  placeholder={`Player ${index + 1}`}
                  value={row.name}
                  onChange={(event) => setRowName(row.key, event.target.value)}
                  aria-label={`Player ${index + 1} name`}
                />

                <IconButton
                  label={`Remove player ${index + 1}`}
                  size="sm"
                  variant="danger"
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length <= minPlayers}
                >
                  ✕
                </IconButton>
              </div>
            ))}
          </div>

          {errors.players ? (
            <p className={styles.formError} role="alert" style={{ marginTop: "var(--sp-3)" }}>
              {errors.players}
            </p>
          ) : null}

          <Button
            variant="ghost"
            size="sm"
            onClick={addRow}
            disabled={rows.length >= maxPlayers}
            style={{ marginTop: "var(--sp-3)" }}
          >
            + Add another player
          </Button>
        </div>

        {formError ? (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

export default GroupFormModal;
