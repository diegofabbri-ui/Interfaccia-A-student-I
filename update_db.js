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
-- Ensure user_progress has all requested columns
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS studio_streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'default_user';

-- Update the default row if it exists, or insert it
INSERT INTO public.user_progress (
  streak_days, level, xp_current, xp_total, average_grade, 
  exams_passed, exams_total, total_study_hours, topics_completed, 
  simulations_completed, studio_streak_days, user_id
)
VALUES (0, 1, 0, 0, 0.0, 0, 0, 0, 0, 0, 0, 'default_user')
ON CONFLICT (id) DO UPDATE SET
  streak_days = EXCLUDED.streak_days,
  level = EXCLUDED.level,
  xp_current = EXCLUDED.xp_current,
  xp_total = EXCLUDED.xp_total,
  average_grade = EXCLUDED.average_grade,
  exams_passed = EXCLUDED.exams_passed,
  exams_total = EXCLUDED.exams_total,
  total_study_hours = EXCLUDED.total_study_hours,
  topics_completed = EXCLUDED.topics_completed,
  simulations_completed = EXCLUDED.simulations_completed,
  studio_streak_days = EXCLUDED.studio_streak_days;
`;

await exec_sql(query);
