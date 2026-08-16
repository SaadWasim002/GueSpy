import { useCallback, useEffect, useState } from "react";
import {
  AvatarStack,
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Modal,
  Screen,
  Skeleton,
  StepTrail,
  useToast,
} from "../../../ui";
import { cn } from "../../../lib/cn";
import { useAppConfig } from "../../../platform/config/configContext";
import { deleteGroup, fetchGroups, selectGroup } from "../groupService";
import { SETUP_STEPS } from "../setupSteps";
import { GroupFormModal } from "./GroupFormModal";
import styles from "./GroupScreen.module.css";

const playersOf = (group) => group?.players?.playerNames ?? [];

export function GroupScreen({ session }) {
  const toast = useToast();
  const { settings } = useAppConfig();

  const [groups, setGroups] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // null = closed, { group: null } = create, { group } = edit.
  const [form, setForm] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setGroups(await fetchGroups());
    } catch (error) {
      setLoadError(error);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const minPlayers = settings.minPlayersInGroup;
  const maxPlayers = settings.maxPlayersInGroup;
  const atGroupLimit = groups !== null && groups.length >= settings.maxGroups;

  // A group saved before the limits changed can now be too small to play.
  const isPlayable = (group) => playersOf(group).length >= minPlayers;

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);

    try {
      await deleteGroup(pendingDelete.id);
      toast.success(`"${pendingDelete.groupName}" deleted.`);
      // A deleted group cannot stay selected.
      if (selectedId === pendingDelete.id) setSelectedId(null);
      setPendingDelete(null);
      await load();
    } catch (error) {
      toast.error(
        error?.status === 404
          ? "That group is already gone."
          : error?.status === 403
            ? "That group belongs to someone else."
            : "Couldn't delete the group. Try again.",
      );
      // Either way the list is no longer trustworthy — re-read it.
      setPendingDelete(null);
      await load();
    } finally {
      setDeleting(false);
    }
  };

  const confirm = async () => {
    if (selectedId == null) return;
    setSubmitting(true);
    try {
      await selectGroup(selectedId);
      await session.refresh();
    } catch (error) {
      toast.error(
        error?.status === 404
          ? "That group no longer exists."
          : "Couldn't select that group. Try again.",
      );
      load();
      setSelectedId(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      width="wide"
      eyebrow="Set up"
      title="Who's playing?"
      subtitle="Pick a saved group, or add the people in the room now. Order matters — the device gets passed down the list."
      actions={
        <Button
          size="lg"
          onClick={confirm}
          disabled={selectedId == null}
          loading={submitting}
          iconRight="→"
        >
          Continue
        </Button>
      }
    >
      <StepTrail steps={SETUP_STEPS} current="GROUP_SELECTION" />

      {groups === null && !loadError ? (
        <div className={styles.list}>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} shape="card" height="8rem" />
          ))}
        </div>
      ) : loadError ? (
        <EmptyState
          tone="error"
          icon="⚠"
          title="Couldn't load your groups"
          description="The list didn't come back. Check the connection and try again."
          actions={<Button onClick={load}>Try again</Button>}
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No groups yet"
          description="Start by adding everyone who's playing. You can reuse the group next time."
          actions={<Button onClick={() => setForm({ group: null })}>Create a group</Button>}
        />
      ) : (
        <>
          <div className={styles.toolbar}>
            <span className={styles.count}>
              {groups.length} of {settings.maxGroups} groups
            </span>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setForm({ group: null })}
              disabled={atGroupLimit}
              title={atGroupLimit ? "You've reached the maximum number of groups." : undefined}
            >
              + New group
            </Button>
          </div>

          <div className={styles.list}>
            {groups.map((group) => {
              const names = playersOf(group);
              const usable = isPlayable(group);

              return (
                /*
                 * The card itself is the select button — a big target for the
                 * primary action. Edit and delete sit *outside* it as
                 * siblings: a button cannot legally contain other buttons,
                 * and nesting them would also make every edit click select
                 * the group on the way through.
                 */
                <div key={group.id} className={styles.groupSlot}>
                  <Card
                    interactive
                    selected={selectedId === group.id}
                    disabled={!usable || submitting}
                    onClick={() => setSelectedId(group.id)}
                    className={cn(styles.group, !usable && styles.tooSmall)}
                  >
                    <div className={styles.groupHead}>
                      <span className={styles.groupName}>{group.groupName}</span>
                      <span className={styles.groupCount}>{names.length}</span>
                    </div>

                    <AvatarStack names={names} max={6} size="sm" />

                    <span className={styles.names}>{names.join(", ")}</span>

                    {!usable ? <Badge tone="warning">Needs {minPlayers}+ players</Badge> : null}
                  </Card>

                  <div className={styles.groupTools}>
                    <IconButton
                      label={`Edit ${group.groupName}`}
                      size="sm"
                      variant="solid"
                      disabled={submitting}
                      onClick={() => setForm({ group })}
                    >
                      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path
                          d="M13.5 3.5a1.9 1.9 0 0 1 2.7 2.7L7.6 14.8l-3.5.8.8-3.5z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </IconButton>

                    <IconButton
                      label={`Delete ${group.groupName}`}
                      size="sm"
                      variant="solid"
                      disabled={submitting}
                      onClick={() => setPendingDelete(group)}
                    >
                      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path
                          d="M4 6h12M8 6V4.5h4V6M6 6l.7 9.2h6.6L14 6M8.5 8.8v4M11.5 8.8v4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>

        </>
      )}

      <GroupFormModal
        open={form !== null}
        group={form?.group ?? null}
        onClose={() => setForm(null)}
        onSaved={load}
        minPlayers={minPlayers}
        maxPlayers={maxPlayers}
        existingNames={(groups ?? []).map((group) => group.groupName)}
      />

      <Modal
        open={pendingDelete !== null}
        onClose={deleting ? undefined : () => setPendingDelete(null)}
        dismissible={!deleting}
        size="sm"
        title={`Delete "${pendingDelete?.groupName ?? ""}"?`}
        description="This can't be undone. The people in it aren't affected — only the saved line-up."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Keep it
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting}>
              Delete group
            </Button>
          </>
        }
      >
        <p className={styles.note}>
          {playersOf(pendingDelete).length > 0
            ? playersOf(pendingDelete).join(", ")
            : "This group has no players saved."}
        </p>
      </Modal>
    </Screen>
  );
}

export default GroupScreen;
