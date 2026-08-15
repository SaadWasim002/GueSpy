import { EmptyState, Screen, Skeleton } from "../../ui";
import { getGameModule } from "../../games/registry";
import { useAppConfig } from "../config/configContext";
import { useAuth } from "../auth/authContext";
import { GameCard } from "./GameCard";
import styles from "./GameHubScreen.module.css";

const HOW_IT_WORKS = [
  {
    title: "Pass the phone",
    body: "Each player sees their role privately, then hands the device on.",
  },
  {
    title: "Talk it out",
    body: "Describe the word without saying it. The spy has to bluff along.",
  },
  {
    title: "Vote",
    body: "Everyone accuses someone. Most votes gets sent home.",
  },
  {
    title: "Settle it",
    body: "Caught spies can gamble on guessing the word. Then points are dealt.",
  },
];

/**
 * The platform's home: which games are available to play.
 *
 * The list is the intersection of two sources. `active_games` says what the
 * *server* is offering; the module registry says what this *build* knows how
 * to render. A game present in the config but not in the registry is shown as
 * coming soon rather than as a card that would break on click.
 */
export function GameHubScreen() {
  const { settings, isLoading } = useAppConfig();
  const { user } = useAuth();

  const games = Array.isArray(settings.activeGames) ? settings.activeGames : [];
  const enabled = games.filter((game) => game?.enabled);

  return (
    <Screen
      width="wide"
      eyebrow={user?.username ? `Hi ${user.username}` : undefined}
      title="Choose a game"
      subtitle="One device, a room full of suspects, and a word only some of you know."
      secondary={
        // Teaches the game to someone who has never played, without standing
        // between everyone else and the button that starts one.
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>How a round goes</h2>
            <span className={styles.sectionNote}>about five minutes</span>
          </div>

          <div className={styles.steps}>
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step.title} className={styles.step}>
                <span className={styles.stepIndex} aria-hidden="true">
                  {index + 1}
                </span>
                <span className={styles.stepTitle}>{step.title}</span>
                <span className={styles.stepBody}>{step.body}</span>
              </div>
            ))}
          </div>
        </section>
      }
    >
      {isLoading && enabled.length === 0 ? (
        <div className={styles.loadingGrid}>
          <Skeleton shape="card" height="9rem" />
          <Skeleton shape="card" height="9rem" />
        </div>
      ) : enabled.length === 0 ? (
        <EmptyState
          icon="🎲"
          title="No games available"
          description="The server isn't offering any games right now. Try again in a moment."
        />
      ) : (
        <div className={styles.grid}>
          {enabled.map((entry) => (
            <GameCard
              key={entry.gameType}
              entry={entry}
              module={getGameModule(entry.gameType)}
            />
          ))}
        </div>
      )}

    </Screen>
  );
}

export default GameHubScreen;
