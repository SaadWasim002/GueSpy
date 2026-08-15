import { useState } from "react";
import { Button, Modal, TextInput, useToast } from "../../../ui";
import { submitSpyGuess } from "../gameEngineService";

/**
 * Where a spy names the word.
 *
 * Shared between the two ways a guess happens — a spy calling it early
 * during discussion or voting, and a caught spy taking their one chance at
 * SPY_GUESS — because it is the same action with the same stakes, and
 * duplicating it would risk the two drifting apart.
 *
 * The secret word is never displayed here, whatever the caller knows.
 */
export function SpyGuessDialog({ open, onClose, onResolved, categoryName, title, description }) {
  const toast = useToast();

  const [word, setWord] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /*
   * Clear the form each time the dialog opens, so a cancelled guess is not
   * sitting there next time — which would be a tell in itself.
   *
   * Done by comparing against the previous prop during render, React's
   * documented way to adjust state when a prop changes. An effect would
   * render the stale value for a frame first, and the component cannot
   * simply be remounted instead: its Modal owns the exit animation.
   */
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setWord("");
      setError(null);
    }
  }

  const submit = async (event) => {
    event?.preventDefault?.();

    const guess = word.trim();
    if (!guess) {
      setError("Type the word you think it is.");
      return;
    }

    setSubmitting(true);
    try {
      await submitSpyGuess(guess);
      // Right or wrong, the round is over — the server decides which, and
      // the caller re-reads state to find out.
      await onResolved();
    } catch (caught) {
      if (caught?.status === 400) {
        setError(caught.message || "That guess wasn't accepted.");
      } else {
        toast.error("Couldn't submit the guess. Try again.");
      }
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      dismissible={!submitting}
      size="sm"
      title={title ?? "Call it — what's the word?"}
      description={
        description ??
        "Get it right and the spies take the round. Get it wrong and you've handed it to everyone else."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting}>
            Lock it in
          </Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <TextInput
          label={categoryName ? `The word (category: ${categoryName})` : "The word"}
          placeholder="Type your guess"
          value={word}
          onChange={(event) => {
            setWord(event.target.value);
            setError(null);
          }}
          error={error}
          centered
          autoFocus
          autoComplete="off"
        />
      </form>
    </Modal>
  );
}

export default SpyGuessDialog;
