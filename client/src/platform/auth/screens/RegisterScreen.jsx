import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, TextInput, useToast } from "../../../ui";
import { ApiError } from "../../../lib/apiError";
import {
  runValidators,
  validateConfirmation,
  validateEmail,
  validatePassword,
  validateUsername,
} from "../../../lib/validation";
import { useAuth } from "../authContext";
import { AuthLayout } from "./AuthLayout";
import styles from "./AuthLayout.module.css";

/** Map a failed registration onto a field or the form. See LoginScreen. */
function describeRegisterFailure(error) {
  if (!(error instanceof ApiError)) {
    return { form: "Something went wrong creating your account. Try again." };
  }

  switch (error.status) {
    case 409:
      return { fields: { email: "User already exists with this email." } };
    case 400:
      return { form: "Some fields are missing or invalid." };
    default:
      return { form: error.message };
  }
}

export function RegisterScreen() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmation: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { errors: found, isValid } = runValidators({
      username: () => validateUsername(values.username),
      email: () => validateEmail(values.email),
      password: () => validatePassword(values.password),
      confirmation: () => validateConfirmation(values.password, values.confirmation),
    });

    setErrors(found);
    setFormError(null);
    if (!isValid) return;

    setBusy(true);
    try {
      // Registration returns a token, so the account is usable immediately —
      // no reason to make someone type the same credentials a second time.
      await register({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      toast.success("Account created. You're in.");
      navigate("/", { replace: true });
    } catch (error) {
      const described = describeRegisterFailure(error);
      setFormError(described.form ?? null);
      setErrors(described.fields ?? {});
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="One account runs the game. Everyone else just needs to be in the room."
      formError={formError}
      onSubmit={handleSubmit}
      busy={busy}
      footer={
        <>
          <Button type="submit" size="lg" fullWidth loading={busy}>
            Create account
          </Button>
          <p className={styles.switch}>
            Already have an account?{" "}
            <Link to="/login" className={styles.switchLink}>
              Log in
            </Link>
          </p>
        </>
      }
    >
      <TextInput
        label="Username"
        name="username"
        autoComplete="username"
        placeholder="What should we call you?"
        value={values.username}
        onChange={update("username")}
        error={errors.username}
        autoFocus
      />

      <TextInput
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={values.email}
        onChange={update("email")}
        error={errors.email}
      />

      <TextInput
        label="Password"
        type="password"
        name="password"
        autoComplete="new-password"
        placeholder="At least 6 characters"
        value={values.password}
        onChange={update("password")}
        error={errors.password}
      />

      <TextInput
        label="Confirm password"
        type="password"
        name="confirmation"
        autoComplete="new-password"
        placeholder="Type it again"
        value={values.confirmation}
        onChange={update("confirmation")}
        error={errors.confirmation}
      />
    </AuthLayout>
  );
}

export default RegisterScreen;
