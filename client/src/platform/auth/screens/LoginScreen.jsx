import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, TextInput, useToast } from "../../../ui";
import { ApiError } from "../../../lib/apiError";
import { runValidators, validateEmail } from "../../../lib/validation";
import { useAuth } from "../authContext";
import { AuthLayout } from "./AuthLayout";
import styles from "./AuthLayout.module.css";

/**
 * Turn a failed login into something to show.
 *
 * The backend sends no machine-readable error code, so this maps on HTTP
 * status — which is unambiguous here because only this endpoint was called.
 * A status that points at one field is attached to it; anything broader
 * becomes a form-level message.
 *
 * 5xx and network failures never reach this: the API client already reports
 * those globally.
 */
function describeLoginFailure(error) {
  if (!(error instanceof ApiError)) {
    return { form: "Something went wrong signing you in. Try again." };
  }

  switch (error.status) {
    case 401:
      return { form: "Incorrect email or password." };
    case 404:
      return { fields: { email: "No user exists with this email." } };
    case 400:
      return { form: "Email and password are required." };
    default:
      return { form: error.message };
  }
}

export function LoginScreen() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    // Clear the complaint as soon as the user acts on it.
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { errors: found, isValid } = runValidators({
      email: () => validateEmail(values.email),
      // Deliberately not the full password rule: an existing account may
      // predate it, and rejecting a correct password would be absurd.
      password: () => (values.password ? null : "Enter your password."),
    });

    setErrors(found);
    setFormError(null);
    if (!isValid) return;

    setBusy(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
      toast.success("Login Successful");
      // Return the user to whatever they were trying to reach, if anything.
      navigate(location.state?.from ?? "/", { replace: true });
    } catch (error) {
      const described = describeLoginFailure(error);
      setFormError(described.form ?? null);
      setErrors(described.fields ?? {});
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick a game and deal everyone in."
      formError={formError}
      onSubmit={handleSubmit}
      busy={busy}
      footer={
        <>
          <Button type="submit" size="lg" fullWidth loading={busy}>
            Log in
          </Button>
          <p className={styles.switch}>
            Don't have an account?{" "}
            <Link to="/register" className={styles.switchLink}>
              Register
            </Link>
          </p>
        </>
      }
    >
      <TextInput
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={values.email}
        onChange={update("email")}
        error={errors.email}
        autoFocus
      />

      <TextInput
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={values.password}
        onChange={update("password")}
        error={errors.password}
      />
    </AuthLayout>
  );
}

export default LoginScreen;
