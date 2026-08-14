import { Link } from "react-router-dom";
import { Button, Screen } from "../ui";

export function NotFoundScreen() {
  return (
    <Screen
      center
      width="narrow"
      eyebrow="404"
      title="Nothing here"
      subtitle="That page went undercover. It may have been renamed, or never existed at all."
      actions={
        <Button as={Link} to="/">
          Back to the games
        </Button>
      }
    />
  );
}

export default NotFoundScreen;
