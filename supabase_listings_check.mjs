import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
const env = fs.readFileSync(path.resolve('./.env'), 'utf8').split(/\r?\n/).reduce((acc, line) => { const [k,v] = line.split('='); if(k) acc[k] = v; return acc }, {});
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('listings').select('id,farmer_id,crop,status,created_at').order('created_at', { ascending: false }).limit(50);
console.log(JSON.stringify({ error, data }, null, 2));
