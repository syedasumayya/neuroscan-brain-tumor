/** Turns a Firebase error into a sentence a doctor can act on. Returns null when nothing should be shown. */
export function friendlyAuthError(err: unknown): string | null {
  const code = typeof err === "object" && err !== null && "code" in err ? String((err as { code: unknown }).code) : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    case "auth/weak-password":
      return "Choose a stronger password (at least 8 characters).";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "Could not reach the sign-in service. Check your internet connection.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null; // the user closed the window on purpose
    case "auth/operation-not-allowed":
      return "This sign-in method is not switched on in Firebase yet (Authentication → Sign-in method).";
    case "auth/unauthorized-domain":
      return "This web address isn't authorised in Firebase (Authentication → Settings → Authorized domains).";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
      return "The Firebase API key in .env.local is not valid. Copy it again from the Firebase console.";
    default:
      return "Something went wrong. Please try again.";
  }
}