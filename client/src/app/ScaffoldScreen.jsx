import { Badge, Card, EmptyState, Screen } from "../ui";
import { useAppConfig } from "../platform/config/configContext";

/**
 * Temporary stand-in for a route whose real screen lands in a later branch.
 *
 * It is not decoration: it renders the live provider state, which is how the
 * shell itself gets verified before there are any real screens — you can see
 * whether config actually loaded and what the resolved values are. Every use
 * of this is deleted as its branch lands.
 */
export function ScaffoldScreen({ title, subtitle, branch, showConfig = false }) {
  const { settings, isLoading } = useAppConfig();

  return (
    <Screen center width="reading" eyebrow="Scaffolding" title={title} subtitle={subtitle}>
      <EmptyState
        icon="🚧"
        title={`Arrives in ${branch}`}
        description="The app shell, routing, session handling and API layer are in place. This screen is the next branch's job."
      />

      {showConfig ? (
        <Card pad="md">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-4)" }}>
            <strong style={{ fontFamily: "var(--font-display)" }}>Loaded config</strong>
            {isLoading ? <Badge tone="info" dot>Fetching</Badge> : <Badge tone="success">Ready</Badge>}
          </div>
          <pre
            style={{
              margin: 0,
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(settings, null, 2)}
          </pre>
        </Card>
      ) : null}
    </Screen>
  );
}

export default ScaffoldScreen;
