/*
# Create appointments table (single-tenant, no auth)

1. New Tables
- `appointments`
  - `id` (uuid, primary key)
  - `clinic_id` (text, not null) — identifier of the chosen clinic (sf, ch, sb, lb)
  - `clinic_name` (text, not null) — display name of the clinic
  - `service` (text, not null) — the selected dental service
  - `name` (text, not null) — patient's full name
  - `phone` (text, not null) — patient's phone number
  - `email` (text, not null) — patient's email address
  - `preferred_date` (text) — preferred appointment date (optional)
  - `message` (text) — additional notes from the patient (optional)
  - `status` (text, default 'pending') — appointment status
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `appointments`.
- Allow anon + authenticated INSERT only (public can submit appointments).
- No SELECT/UPDATE/DELETE from the public API (handled server-side only).
*/

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id text NOT NULL,
  clinic_name text NOT NULL,
  service text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  preferred_date text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_appointments" ON appointments;
CREATE POLICY "anon_insert_appointments"
ON appointments FOR INSERT
TO anon, authenticated
WITH CHECK (true);