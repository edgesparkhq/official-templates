// Typed runtime input keys for app code.
// VarKey and SecretKey are string literal union types, not values or config storage.
// Add a key here before using vars.get("KEY") or secret.get("KEY") in code.
// Values still come from .env.local in local dev and remote vars/secrets in deployed envs.

// ADMIN_EMAIL gates the /api/admin/* routes — the request user must match this
// value to receive a 200 instead of 403. Set it once with:
//   edgespark var set ADMIN_EMAIL=you@example.com
export type VarKey =
  | "ADMIN_EMAIL";

export type SecretKey = never;
