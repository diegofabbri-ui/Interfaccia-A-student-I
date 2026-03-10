import fs from 'fs';

const supabaseUrl = "https://sdgquwhvegznbcqqvbug.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZ3F1d2h2ZWd6bmJjcXF2YnVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDk0NTA3NiwiZXhwIjoyMDgwNTIxMDc2fQ.j8GcWe2MBMwI5kwHphD6G1tSbx-WeGmGUKXKVhP4Ook";

async function exec_sql(sql) {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
    });
    console.log("STATUS:", res.status);
}

const query = `
-- 1. Ensure user_progress is complete
CREATE TABLE IF NOT EXISTS public.user_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  streak_days integer null default 0,
  level integer null default 1,
  xp_current integer null default 0,
  xp_total integer null default 0,
  average_grade numeric(3, 1) null default 0.0,
  exams_passed integer null default 0,
  exams_total integer null default 0,
  total_study_hours integer null default 0,
  topics_completed integer null default 0,
  simulations_completed integer null default 0,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  studio_streak_days integer null default 0,
  user_id text null default 'default_user'::text,
  constraint user_progress_pkey primary key (id)
);

-- 2. Create study_sessions for live charts
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT DEFAULT 'default_user',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours_studied NUMERIC(4, 2) DEFAULT 0,
  category TEXT CHECK (category IN ('Lettura', 'Esercizi', 'Ripasso', 'Simulazioni', 'Mappe')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Insert default progress if empty
INSERT INTO public.user_progress (user_id, streak_days, level, xp_current, xp_total, average_grade, exams_passed, exams_total, total_study_hours, topics_completed, simulations_completed, studio_streak_days)
SELECT 'default_user', 5, 3, 450, 2450, 27.5, 4, 12, 120, 45, 12, 8
WHERE NOT EXISTS (SELECT 1 FROM public.user_progress);

-- 4. Insert dummy sessions for the last 30 days to populate charts
INSERT INTO public.study_sessions (user_id, date, hours_studied, category)
SELECT 
  'default_user', 
  (CURRENT_DATE - (i || ' day')::interval)::date, 
  (random() * 5 + 1)::numeric(4,2), 
  (ARRAY['Lettura', 'Esercizi', 'Ripasso', 'Simulazioni', 'Mappe'])[floor(random() * 5 + 1)]
FROM generate_series(0, 30) s(i)
WHERE NOT EXISTS (SELECT 1 FROM public.study_sessions);
`;

await exec_sql(query);
