import { useState } from "react";
import styles from "./Confetti.module.css";

const PALETTE = [
  "var(--accent)",
  "var(--accent-bright)",
  "var(--accent-2)",
  "var(--color-success)",
  "var(--color-warning)",
];

/**
 * One-shot burst of falling confetti.
 *
 * Pure CSS animation rather than a canvas or a physics library: it is a few
 * dozen absolutely-positioned elements with randomised custom properties,
 * which costs nothing next to pulling in a dependency for one screen.
 *
 * The layout is randomised once per mount and held in state, not useMemo.
 * useMemo is a hint React is free to discard, and a discarded one here would
 * re-roll every piece mid-fall; a lazy state initialiser runs exactly once.
 *
 * Hidden entirely under prefers-reduced-motion — see the module CSS.
 */
export function Confetti({ pieces = 60, colors = PALETTE }) {
  const [shards] = useState(() =>
    Array.from({ length: pieces }, (_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.9}s`,
      duration: `${2.4 + Math.random() * 1.8}s`,
      spin: `${Math.random() * 1080 - 540}deg`,
      color: colors[i % colors.length],
    })),
  );

  return (
    <div className={styles.field} aria-hidden="true">
      {shards.map((shard) => (
        <span
          key={shard.id}
          className={styles.piece}
          style={{
            "--x": shard.x,
            "--delay": shard.delay,
            "--duration": shard.duration,
            "--spin": shard.spin,
            "--piece-color": shard.color,
          }}
        />
      ))}
    </div>
  );
}

export default Confetti;
