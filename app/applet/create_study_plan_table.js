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
    if (!res.ok) {
        console.error(await res.text());
    }
}

const query = `
CREATE TABLE IF NOT EXISTS public.study_plan_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id TEXT NOT NULL,
    medium_block_name TEXT NOT NULL,
    day_number INTEGER NOT NULL,
    date_label TEXT NOT NULL,
    tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.study_plan_blocks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now
DROP POLICY IF EXISTS "Allow all operations on study_plan_blocks" ON public.study_plan_blocks;
CREATE POLICY "Allow all operations on study_plan_blocks" ON public.study_plan_blocks FOR ALL USING (true) WITH CHECK (true);
`;

await exec_sql(query);
