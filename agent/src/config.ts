import "dotenv/config";

// Add new required env vars here (e.g. SUPABASE_URL).
const REQUIRED = ["PHOTON_PROJECT_ID", "PHOTON_PROJECT_SECRET", "MUSE_API_KEY"] as const;

type RequiredKey = (typeof REQUIRED)[number];

export type Config = Record<RequiredKey, string>;

function loadConfig(): Config {
  const missing = REQUIRED.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      missing.map((key) => `Missing env var ${key}`).join("\n") +
        "\nCopy .env.example to .env and fill it in (or set the variables in Railway).",
    );
  }

  return Object.fromEntries(
    REQUIRED.map((key) => [key, process.env[key]!.trim()]),
  ) as Config;
}

export const config = loadConfig();
