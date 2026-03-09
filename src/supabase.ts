import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdgquwhvegznbcqqvbug.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkZ3F1d2h2ZWd6bmJjcXF2YnVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDk0NTA3NiwiZXhwIjoyMDgwNTIxMDc2fQ.j8GcWe2MBMwI5kwHphD6G1tSbx-WeGmGUKXKVhP4Ook';

export const supabase = createClient(supabaseUrl, supabaseKey);
