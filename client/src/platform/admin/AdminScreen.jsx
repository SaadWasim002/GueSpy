import { useMemo, useState } from "react";
import { EmptyState, Screen, SegmentedControl } from "../../ui";
import { collectAdminSections } from "./adminSections";
import styles from "./AdminScreen.module.css";

/**
 * The admin area.
 *
 * A shell and nothing more: it decides which section is showing and renders
 * it. What each section *does* is owned by whoever contributed it — the game
 * module for its own content, the platform for configuration — so adding a
 * section never means editing this file.
 *
 * Sections mount lazily in the sense that only the active one renders, so a
 * section's data fetch happens when it is first opened rather than on every
 * visit to the page.
 */

/** Platform-owned sections. Configuration lands here in the next branch. */
const PLATFORM_SECTIONS = [];

export function AdminScreen() {
  const sections = useMemo(() => collectAdminSections(PLATFORM_SECTIONS), []);
  const [activeId, setActiveId] = useState(() => sections[0]?.id ?? null);

  const active = sections.find((section) => section.id === activeId) ?? sections[0] ?? null;

  return (
    <Screen
      flow
      width="wide"
      eyebrow="Admin"
      title="Manage the game"
      subtitle="Categories, the words drawn from them, and the settings every round runs on."
    >
      {sections.length === 0 ? (
        <EmptyState
          icon="🛠"
          title="Nothing to manage yet"
          description="No game has contributed an admin section, and there are no platform settings registered."
        />
      ) : (
        <>
          {/*
            One section renders as a heading rather than a switcher — a
            single-option control invites a click that does nothing. It
            becomes a real switcher as soon as there is somewhere to switch.
          */}
          {sections.length > 1 ? (
            <SegmentedControl
              label="Admin section"
              value={active.id}
              onChange={setActiveId}
              options={sections.map((section) => ({ value: section.id, label: section.label }))}
            />
          ) : (
            <h2 className={styles.only}>{active.label}</h2>
          )}

          <div className={styles.section}>
            <active.Component />
          </div>
        </>
      )}
    </Screen>
  );
}

export default AdminScreen;
