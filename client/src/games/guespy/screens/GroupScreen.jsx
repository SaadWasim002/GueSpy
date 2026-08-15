import { useCallback, useEffect, useState } from "react";
import {
  AvatarStack,
  Badge,
  Button,
  Card,
  EmptyState,
  Screen,
  Skeleton,
  StepTrail,
  useToast,
} from "../../../ui";
import { cn } from "../../../lib/cn";
import { useAppConfig } from "../../../platform/config/configContext";
import { fetchGroups, selectGroup } from "../groupService";
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
  const [formOpen, setFormOpen] = useState(false);

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
          actions={<Button onClick={() => setFormOpen(true)}>Create a group</Button>}
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
              onClick={() => setFormOpen(true)}
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
                <Card
                  key={group.id}
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
              );
            })}
          </div>

          {/*
            Editing and deleting are absent on purpose: the backend exposes
            only create, get and select for groups, so those buttons could
            only ever fail. Stated plainly rather than left as a silent gap.
          */}
          <p className={styles.note}>
            Groups can't be edited or deleted yet — that needs backend support. Create a new group
            if the line-up changes.
          </p>
        </>
      )}

      <GroupFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={load}
        minPlayers={minPlayers}
        maxPlayers={maxPlayers}
        existingNames={(groups ?? []).map((group) => group.groupName)}
      />
    </Screen>
  );
}

export default GroupScreen;
