import { useEffect, useState } from "react";
import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  LoadingBlock,
  Modal,
  ProgressRing,
  RingValue,
  SegmentedControl,
  Skeleton,
  SkeletonText,
  Spinner,
  StepTrail,
  Stepper,
  TextInput,
  useToast,
} from "../../ui";
import styles from "./Gallery.module.css";
import "./demoThemes.css";

const THEMES = [
  { value: "violet", label: "Violet" },
  { value: "crimson", label: "Crimson" },
  { value: "mint", label: "Mint" },
  { value: "amber", label: "Amber" },
];

const SETUP_STEPS = [
  { id: "category", label: "Category" },
  { id: "group", label: "Players" },
  { id: "options", label: "Options" },
  { id: "play", label: "Play" },
];

const PLAYERS = ["Sayam", "Sunny", "Sarah", "Aarib", "Mira", "Devan"];

function Section({ title, note, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {note ? <span className={styles.sectionNote}>{note}</span> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * Living reference for the design system.
 *
 * Every primitive on one page, under a theme switcher — which is the point:
 * flipping the accent retints the whole page, so it doubles as the proof that
 * a new game module can re-skin the app without touching the UI kit.
 */
export function Gallery() {
  const toast = useToast();

  const [theme, setTheme] = useState("violet");
  const [selectedCard, setSelectedCard] = useState("b");
  const [spies, setSpies] = useState(1);
  const [step, setStep] = useState("group");
  const [name, setName] = useState("");
  const [secret, setSecret] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(45);

  // The theme is applied on <html> so the ambient body backdrop retints too.
  useEffect(() => {
    document.documentElement.dataset.game = theme;
    return () => {
      delete document.documentElement.dataset.game;
    };
  }, [theme]);

  // Looping countdown, so the ring is shown doing its actual job.
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s <= 0 ? 60 : s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const runBusy = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      toast.success("That worked.", { title: "Done" });
    }, 1400);
  };

  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <div>
          <h1 className={styles.title}>Design system</h1>
          <p className={styles.tagline}>
            Every primitive the platform is built from. Switch the accent to see how a game module
            re-skins the app — it overrides four tokens and nothing else.
          </p>
        </div>
        <SegmentedControl options={THEMES} value={theme} onChange={setTheme} label="Accent theme" />
      </header>

      <Section title="Type scale" note="Outfit for display, Inter for body">
        <div className={styles.typeSpecimen}>
          <span style={{ fontSize: "var(--text-4xl)" }}>Find the spy</span>
          <span style={{ fontSize: "var(--text-3xl)" }}>Pass the device</span>
          <span style={{ fontSize: "var(--text-2xl)" }}>Discussion time</span>
          <span style={{ fontSize: "var(--text-xl)" }}>Who do you suspect?</span>
          <p className={styles.cardBody}>
            Body copy sits at 1rem with a 1.55 line height. Long-form text is capped near 46
            characters so it stays readable on a shared laptop screen.
          </p>
        </div>
      </Section>

      <Section title="Accent tokens" note="the only group a game overrides">
        <div className={styles.swatchRow}>
          {["--accent", "--accent-bright", "--accent-deep", "--accent-2", "--accent-soft"].map(
            (token) => (
              <div key={token} className={styles.swatch}>
                <div className={styles.chip} style={{ background: `var(${token})` }} />
                <span className={styles.chipLabel}>{token}</span>
              </div>
            ),
          )}
        </div>
      </Section>

      <Section title="Buttons">
        <div className={styles.row}>
          <Button variant="primary">Start game</Button>
          <Button variant="secondary">Continue</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="danger">Delete group</Button>
          <Button variant="dangerGhost">Remove</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className={styles.row}>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button loading={busy} onClick={runBusy}>
            {busy ? "Working" : "Click to load"}
          </Button>
          <Button pulse iconRight="→">
            Waiting on you
          </Button>
        </div>
        <div className={styles.row}>
          <IconButton label="Settings" variant="solid">
            ⚙
          </IconButton>
          <IconButton label="Add" variant="accent">
            ＋
          </IconButton>
          <IconButton label="Delete" variant="danger">
            ✕
          </IconButton>
        </div>
      </Section>

      <Section title="Inputs">
        <div className={styles.formGrid}>
          <TextInput
            label="Group name"
            placeholder="Friday night crew"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            hint="Shown when you pick a group later."
          />
          <TextInput label="Password" type="password" placeholder="••••••••" />
          <TextInput label="Email" defaultValue="not-an-email" error="Enter a valid email address." />
          <TextInput
            label="Guess the word"
            centered
            placeholder="INCEPTION"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
        </div>
      </Section>

      <Section title="Cards" note="interactive cards are real buttons">
        <div className={styles.grid}>
          {[
            { id: "a", title: "Movies", body: "50 words" },
            { id: "b", title: "Sports", body: "35 words" },
            { id: "c", title: "Food", body: "42 words" },
          ].map((item) => (
            <Card
              key={item.id}
              interactive
              selected={selectedCard === item.id}
              onClick={() => setSelectedCard(item.id)}
            >
              <div className={styles.cardTitle}>{item.title}</div>
              <div className={styles.cardBody}>{item.body}</div>
            </Card>
          ))}
          <Card tone="glass" accentEdge>
            <div className={styles.cardTitle}>Glass surface</div>
            <div className={styles.cardBody}>Frosted panel with an accent hairline.</div>
          </Card>
        </div>
      </Section>

      <Section title="Players">
        <div className={styles.row}>
          <Avatar name="Sayam" size="xs" />
          <Avatar name="Sunny" size="sm" />
          <Avatar name="Sarah" size="md" />
          <Avatar name="Aarib" size="lg" state="active" />
          <Avatar name="Mira" size="lg" state="eliminated" />
          <Avatar name="Devan" size="lg" ringColor="var(--color-role-hidden)" badge="🕵" />
        </div>
        <AvatarStack names={PLAYERS} max={4} size="md" />
        <div className={styles.row}>
          <Badge>Neutral</Badge>
          <Badge tone="accent">Round 2</Badge>
          <Badge tone="success">Innocent</Badge>
          <Badge tone="danger">Spy</Badge>
          <Badge tone="warning">Tie — revote</Badge>
          <Badge tone="info" dot>
            Voting now
          </Badge>
        </div>
      </Section>

      <Section title="Game controls">
        <div className={styles.ringDemo}>
          <ProgressRing
            progress={seconds / 60}
            urgent={seconds <= 10}
            color={seconds <= 10 ? "var(--color-danger)" : undefined}
            label="Discussion time remaining"
          >
            <RingValue value={`0:${String(seconds).padStart(2, "0")}`} caption="remaining" />
          </ProgressRing>

          <div className={styles.col}>
            <Stepper
              value={spies}
              onChange={setSpies}
              min={1}
              max={2}
              unit="spies"
              label="number of spies"
              onLimit={(bound) =>
                toast.warning(
                  bound === "max" ? "This game supports at most 2 spies." : "You need at least 1 spy.",
                )
              }
            />
            <SegmentedControl
              options={[
                { value: "pass", label: "Pass & play" },
                { value: "online", label: "Online", disabled: true },
              ]}
              value="pass"
              onChange={() => {}}
              label="Play mode"
            />
          </div>
        </div>

        <StepTrail steps={SETUP_STEPS} current={step} />
        <div className={styles.row}>
          {SETUP_STEPS.map((s) => (
            <Button key={s.id} size="sm" variant="ghost" onClick={() => setStep(s.id)}>
              {s.label}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Loading & empty">
        <div className={styles.row}>
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>
        <Card pad="md">
          <LoadingBlock label="Dealing roles…" />
        </Card>
        <Card pad="md">
          <div className={styles.row}>
            <Skeleton shape="circle" width="3rem" height="3rem" />
            <div style={{ flex: 1, minWidth: "12rem" }}>
              <SkeletonText lines={3} />
            </div>
          </div>
        </Card>
        <div className={styles.formGrid}>
          <EmptyState
            icon="👥"
            title="No groups yet"
            description="Create a group of players and it will be here next time."
            actions={<Button size="sm">Create a group</Button>}
          />
          <EmptyState
            tone="error"
            icon="⚠"
            title="Couldn't load categories"
            description="The server didn't respond. Check the connection and try again."
            actions={
              <Button size="sm" variant="secondary">
                Retry
              </Button>
            }
          />
        </div>
      </Section>

      <Section title="Overlays">
        <div className={styles.row}>
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <Button variant="ghost" onClick={() => toast.success("Group created.")}>
            Success toast
          </Button>
          <Button variant="ghost" onClick={() => toast.error("Internal Server Error")}>
            Error toast
          </Button>
          <Button variant="ghost" onClick={() => toast.info("Pass the device to Sunny.")}>
            Info toast
          </Button>
        </div>
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Delete this group?"
        description="Friday night crew — 6 players. This can't be undone."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setModalOpen(false);
                toast.success("Group deleted.");
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className={styles.cardBody}>
          Escape closes this, focus is trapped inside, and it becomes a bottom sheet under 30rem.
        </p>
      </Modal>
    </div>
  );
}

export default Gallery;
