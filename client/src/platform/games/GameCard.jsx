import { useNavigate } from "react-router-dom";
import { Badge, Card } from "../../ui";
import { cn } from "../../lib/cn";
import { PLAY_MODE_LABELS, PLAY_MODES } from "../../games/types";
import styles from "./GameCard.module.css";

/**
 * One game in the hub.
 *
 * `entry` is the server's `active_games` row; `module` is this build's
 * implementation, or null when the server offers a game the client cannot
 * render yet. The card stays visible in that case, marked as coming soon —
 * more honest than hiding it, and it shows the platform is growing.
 */
export function GameCard({ entry, module }) {
  const navigate = useNavigate();
  const playable = Boolean(module);

  const name = module?.meta.name ?? entry.name ?? entry.gameType;
  const tagline = module?.meta.tagline ?? entry.description ?? "";

  return (
    <Card
      interactive={playable}
      accentEdge={playable}
      pad="lg"
      tone={playable ? "raised" : "default"}
      className={cn(styles.card, !playable && styles.locked)}
      onClick={playable ? () => navigate(`/play/${module.id}`) : undefined}
      aria-label={playable ? `Play ${name}` : `${name} — coming soon`}
      disabled={!playable}
    >
      <span className={styles.emblem} aria-hidden="true">
        {module?.meta.emblem ?? "🎲"}
      </span>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <span className={styles.name}>{name}</span>
          {!playable ? <Badge tone="neutral">Coming soon</Badge> : null}
        </div>

        {tagline ? <span className={styles.tagline}>{tagline}</span> : null}

        <div className={styles.facts}>
          {module?.modes.map((mode) => (
            <Badge key={mode} tone={mode === PLAY_MODES.PASS_AND_PLAY ? "accent" : "neutral"}>
              {PLAY_MODE_LABELS[mode]}
            </Badge>
          ))}
          {module?.meta.players ? <Badge>{module.meta.players}</Badge> : null}
          {module?.meta.length ? <Badge>{module.meta.length}</Badge> : null}
        </div>
      </div>

      {playable ? (
        <span className={styles.cta} aria-hidden="true">
          Play →
        </span>
      ) : null}
    </Card>
  );
}

export default GameCard;
