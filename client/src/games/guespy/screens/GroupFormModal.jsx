import { useEffect, useMemo, useState } from "react";
import { Button, IconButton, Modal, TextInput, useToast } from "../../../ui";
import { createGroup } from "../groupService";
import styles from "./GroupFormModal.module.css";

const emptyRow = () => ({ key: Math.random().toString(36).slice(2), name: "" });

/**
 * Create a group of players.
 *
 * Player bounds come from server config rather than being hard-coded, because
 * the server rejects an out-of-range group and the two must agree.
 */
export function GroupFormModal({ open, onClose, onCreated, minPlayers, maxPlayers, existingNames }) {
  const toast = useToast();

  const [groupName, setGroupName] = useState("");
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Start with the minimum number of rows so the required shape is obvious
  // rather than something to discover by hitting Create.
  useEffect(() => {
    if (!open) return;
    setGroupName("");
    setRows(Array.from({ length: minPlayers }, emptyRow));
    setErrors({});
    setFormError(null);
  }, [open, minPlayers]);

  const filled = useMemo(() => rows.map((r) => r.name.trim()).filter(Boolean), [rows]);

  const setRowName = (key, name) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, name } : row)));
    setErrors((current) => ({ ...current, players: undefined }));
    setFormError(null);
  };

  const addRow = () => setRows((current) => [...current, emptyRow()]);

  const removeRow = (key) => setRows((current) => current.filter((row) => row.key !== key));

  const validate = () => {
    const found = {};
    const name = groupName.trim();

    if (!name) {
      found.groupName = "Give the group a name.";
    } else if (existingNames.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
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
      await createGroup({ groupName: groupName.trim(), players: filled });
      toast.success("Group created.");
      await onCreated();
      onClose();
    } catch (error) {
      if (error?.status === 409) {
        setErrors((current) => ({ ...current, groupName: "You already have a group with this name." }));
      } else if (error?.status === 400) {
        setFormError(error.message || "Check the group name and player names.");
      } else {
        setFormError("Couldn't create the group. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New group"
      description="Save the people you play with so you don't retype them every round."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting}>
            Create group
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
