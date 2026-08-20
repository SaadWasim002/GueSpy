import { useState } from "react";
import { Button, Modal, useToast } from "../../../ui";
import { isStatus } from "../../../lib/apiError";
import { backRuleFor } from "../backPolicy";
import { navigateGameState } from "../gameEngineService";
import styles from "./BackControl.module.css";

/**
 * One step back through the game, under the rules in `backPolicy`.
 *
 * Renders nothing where back is not offered, so a screen can hand this to
 * `Screen` unconditionally and let the policy decide — no screen needs to
 * know which statuses the server accepts.
 *
 * Quiet on purpose. Every screen this appears on has a primary action the
 * room is waiting on, and a back button that competes with it is a back
 * button people press by accident on a device being passed around.
 *
 * @param busy  the screen's own action is in flight — don't offer a second
 */
export function BackControl({ session, busy = false }) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  const rule = backRuleFor(session.status, session.data);
  if (!rule) return null;

  const go = async () => {
    setPending(true);

    try {
      const state = await navigateGameState("back");
      setConfirming(false);
      /*
       * Last, and nothing after it: adopting the state swaps the screen and
       * unmounts this component, so `pending` is deliberately left set
       * rather than cleared into a component that no longer exists.
       */
      session.applyState(state);
    } catch (error) {
      setPending(false);
      setConfirming(false);

      if (isStatus(error, 400)) {
        // The round moved on underneath — a timer expired, or the device was
        // acted on elsewhere. Whatever is on screen is stale; re-read it.
        toast.warning("The round has already moved on.");
        session.refresh();
      } else {
        toast.error("Couldn't go back. Try again.");
      }
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        iconLeft="←"
        className={styles.button}
        disabled={busy}
        loading={pending && !rule.confirm}
        onClick={() => (rule.confirm ? setConfirming(true) : go())}
      >
        {rule.label}
      </Button>

      {rule.confirm ? (
        <Modal
          open={confirming}
          onClose={pending ? undefined : () => setConfirming(false)}
          dismissible={!pending}
          size="sm"
          title={rule.confirm.title}
          description={rule.confirm.body}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
                Keep going
              </Button>
              <Button onClick={go} loading={pending}>
                {rule.confirm.action}
              </Button>
            </>
          }
        />
      ) : null}
    </>
  );
}

export default BackControl;
