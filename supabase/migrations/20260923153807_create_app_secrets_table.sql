/*
# Create app_secrets table for storing configuration values

1. New Tables
- `app_secrets`
  - `id` (uuid, primary key)
  - `key` (text, unique, not null) — the secret key name
  - `value` (text, not null) — the secret value
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `app_secrets`.
- No public access (no SELECT/INSERT/UPDATE/DELETE for anon or authenticated).
- Only the service role (which bypasses RLS) can read these values.
*/

CREATE TABLE IF NOT EXISTS app_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;

-- No policies: only service role can access (service role bypasses RLS)
