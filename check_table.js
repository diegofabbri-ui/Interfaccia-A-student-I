import { supabase } from './src/supabase';

async function checkTable() {
  const { data, error } = await supabase
    .from('web_research_exams')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Table columns:', Object.keys(data[0] || {}));
  }
}

checkTable();
