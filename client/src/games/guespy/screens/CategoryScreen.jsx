import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Screen,
  Skeleton,
  StepTrail,
  TextInput,
  useToast,
} from "../../../ui";
import { cn } from "../../../lib/cn";
import { fetchCategories, selectCategory } from "../categoryService";
import { SETUP_STEPS } from "../setupSteps";
import styles from "./CategoryScreen.module.css";

/** Above this many categories, scanning beats scrolling. */
const SEARCH_THRESHOLD = 8;

export function CategoryScreen({ session }) {
  const toast = useToast();

  const [categories, setCategories] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoadError(null);
    try {
      setCategories(await fetchCategories());
    } catch (error) {
      setLoadError(error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /*
   * A category with no words left cannot start a game: the engine picks a
   * random *unused* word and throws when none remain, which surfaces as a
   * 500. Blocking the choice here turns a server error into an explanation.
   */
  const isPlayable = (category) => (category.totalWords ?? 0) > 0;

  const visible = useMemo(() => {
    if (!categories) return [];
    const term = query.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((c) => c.categoryName?.toLowerCase().includes(term));
  }, [categories, query]);

  const playable = useMemo(() => (categories ?? []).filter(isPlayable), [categories]);

  const surpriseMe = () => {
    if (playable.length === 0) return;
    const pick = playable[Math.floor(Math.random() * playable.length)];
    setSelectedId(pick.id);
    toast.info(`Picked ${pick.categoryName}.`);
  };

  const confirm = async () => {
    if (selectedId == null) return;
    setSubmitting(true);
    try {
      await selectCategory(selectedId);
      // The server decides what comes next; re-reading state is what moves
      // the flow rather than the client assuming the next screen.
      await session.refresh();
    } catch (error) {
      toast.error(
        error?.status === 404
          ? "That category is no longer available."
          : "Couldn't select that category. Try again.",
      );
      // It may have vanished between listing and choosing — re-read the list.
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
      title="Pick a category"
      subtitle="The secret word is drawn from whichever category you choose. Everyone but the spy will see it."
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
      <StepTrail steps={SETUP_STEPS} current="CATEGORY_SELECTION" />

      {categories === null && !loadError ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} shape="card" height="6.5rem" />
          ))}
        </div>
      ) : loadError ? (
        <EmptyState
          tone="error"
          icon="⚠"
          title="Couldn't load categories"
          description="The list didn't come back. Check the connection and try again."
          actions={<Button onClick={load}>Try again</Button>}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No categories available"
          description="There's nothing to draw words from yet. Please check back later."
          actions={<Button variant="secondary" onClick={load}>Refresh</Button>}
        />
      ) : (
        <>
          <div className={styles.toolbar}>
            {categories.length > SEARCH_THRESHOLD ? (
              <TextInput
                className={styles.search}
                size="sm"
                placeholder="Search categories"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search categories"
              />
            ) : null}

            <Button variant="secondary" size="sm" onClick={surpriseMe} disabled={playable.length === 0}>
              🎲 Surprise me
            </Button>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="Nothing matches that"
              description="Try a different search term."
              actions={<Button variant="secondary" size="sm" onClick={() => setQuery("")}>Clear search</Button>}
            />
          ) : (
            <div className={styles.grid}>
              {visible.map((category) => {
                const usable = isPlayable(category);

                return (
                  <Card
                    key={category.id}
                    interactive
                    selected={selectedId === category.id}
                    disabled={!usable || submitting}
                    onClick={() => setSelectedId(category.id)}
                    className={cn(styles.tile, !usable && styles.exhausted)}
                  >
                    <span className={styles.tileName}>{category.categoryName}</span>
                    <span className={styles.tileMeta}>
                      {usable ? (
                        <>
                          <span className={styles.count}>{category.totalWords}</span>{" "}
                          {category.totalWords === 1 ? "word" : "words"}
                        </>
                      ) : (
                        <Badge tone="warning">No words yet</Badge>
                      )}
                    </span>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </Screen>
  );
}

export default CategoryScreen;
