// Typed runtime input keys for app code.
// VarKey and SecretKey are string literal union types, not values or config storage.
// Add a key here before using vars.get("KEY") or secret.get("KEY") in code.
// Values still come from .env.local in local dev and remote vars/secrets in deployed envs.

export type VarKey =
  | "GITHUB_CLIENT_ID"
  | "GOOGLE_CLIENT_ID"
  | "DISCORD_CLIENT_ID"
  | "GITLAB_CLIENT_ID"
;

export type SecretKey =
  | "GITHUB_CLIENT_SECRET"
  | "GOOGLE_CLIENT_SECRET"
  | "DISCORD_CLIENT_SECRET"
  | "GITLAB_CLIENT_SECRET";
