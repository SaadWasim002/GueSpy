import { useCallback, useEffect, useRef, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingBlock,
  Screen,
  useToast,
} from "../../../ui";
import { useSound } from "../../../platform/sound/soundContext";
import { SpyGuessDialog } from "../components/SpyGuessDialog";
import { castVote, fetchVotingScreen } from "../votingService";
import styles from "./VotingScreen.module.css";

/**
 * One voter at a time: the device is handed round and each active player
 * accuses somebody.
 *
 * Serves both VOTING and REVOTE — a tie re-runs the identical flow, so the
 * only difference is what the screen says about why it is happening.
 *
 * Unlike the role reveal, `GET /voting` is a pure read: it reports whose turn
 * it is without advancing anything, and the cursor moves only when a vote is
 * actually cast. So this screen can re-read freely on mount or retry, and
 * only the submit needs guarding against a double tap.
 */
export function VotingScreen({ session }) {
  const toast = useToast();
  const { play } = useSound();

  const [ballot, setBallot] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [guessOpen, setGuessOpen] = useState(false);

  // Active players stays constant across a round, so the size of the first
  // ballot (everyone but the voter) is enough to show progress.
  const [totalVoters, setTotalVoters] = useState(null);
  const [votesCast, setVotesCast] = useState(0);

  const submittingRef = useRef(false);
  const isRevote = session.status === "REVOTE";

  const load = useCallback(async () => {
    setError(null);
    try {
      const next = await fetchVotingScreen();
      setBallot(next);
      setSelected(null);
      setTotalVoters((current) => current ?? (next?.votingList?.length ?? 0) + 1);
    } catch (caught) {
      setError(caught);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = session.refresh;

  const submit = async () => {
    if (selected == null || submittingRef.current) return;
    submittingRef.current = true;
    setBusy(true);

    const wasLast = ballot?.isLast;

    try {
      await castVote(selected);
      // Safe to cue: that a vote was cast is public, only its target is not.
      play("vote");
      setVotesCast((n) => n + 1);

      if (wasLast) {
        // The round resolves server-side once the final vote lands. What
        // comes next — revote, a caught spy, an elimination, or the end of
        // the game — is the server's call, so read it rather than guess.
        await refresh();
      } else {
        await load();
      }
    } catch (caught) {
      if (caught?.status === 400) {
        toast.error("That vote wasn't accepted — the round may have moved on.");
        await refresh();
      } else if (caught?.status === 404) {
        toast.error("That player is no longer in the round.");
        await load();
      } else {
        toast.error("Couldn't record the vote. Try again.");
      }
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  };

  if (error) {
    return (
      <Screen center width="reading" title="Voting stalled">
        <EmptyState
          tone="error"
          icon="⚠"
          title="Couldn't load whose turn it is"
          description="Nothing has been lost — the round is still on the server. Try again."
          actions={<Button onClick={load}>Try again</Button>}
        />
      </Screen>
    );
  }

  if (!ballot) {
    return (
      <Screen center width="narrow">
        <LoadingBlock label="Setting up the vote…" />
      </Screen>
    );
  }

  const candidates = ballot.votingList ?? [];

  return (
    <Screen
      width="reading"
      eyebrow={isRevote ? "Revote" : "Voting"}
      title={isRevote ? "It's a tie — vote again" : (ballot.displayTextHeader ?? "Voting time")}
      subtitle={
        isRevote
          ? "Nobody had a clear majority. Same players, same choice, one more go."
          : "Everyone accuses one person. The most votes gets sent home."
      }
      actions={
        <Button
          size="lg"
          onClick={submit}
          disabled={selected == null}
          loading={busy}
          iconRight={ballot.isLast ? undefined : "→"}
        >
          {ballot.isLast ? "Cast the final vote" : "Submit vote"}
        </Button>
      }
    >
      <div className={styles.turn}>
        <span className={styles.turnName}>
          <Avatar name={ballot.currentPlayerName ?? ""} size="md" state="active" />
          {ballot.currentPlayerName}
        </span>
        <span className={styles.turnHint}>
          {ballot.displayText ?? "Choose one player who you think is the spy"} — everyone else, look
          away.
        </span>
      </div>

      <div className={styles.ballot}>
        {candidates.map((candidate) => (
          <Card
            key={candidate.playerId}
            interactive
            selected={selected === candidate.playerId}
            disabled={busy}
            onClick={() => setSelected(candidate.playerId)}
            className={styles.candidate}
            pad="sm"
          >
            <Avatar name={candidate.playerName} size="sm" />
            <span className={styles.candidateName}>{candidate.playerName}</span>
          </Card>
        ))}
      </div>

      <div className={styles.progress}>
        <Badge tone="neutral">
          {totalVoters ? `Vote ${Math.min(votesCast + 1, totalVoters)} of ${totalVoters}` : "Voting"}
        </Badge>
        {candidates.length === 0 ? <span>No one left to accuse.</span> : null}
      </div>

      {/* A spy may still end it here rather than risk the tally. */}
      <div className={styles.secondary}>
        <Button variant="ghost" size="sm" onClick={() => setGuessOpen(true)} disabled={busy}>
          I'm the spy — I'll call it now
        </Button>
      </div>

      <SpyGuessDialog
        open={guessOpen}
        onClose={() => setGuessOpen(false)}
        onResolved={async () => {
          setGuessOpen(false);
          await refresh();
        }}
      />
    </Screen>
  );
}

export default VotingScreen;
