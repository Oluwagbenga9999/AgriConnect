import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
const env = fs.readFileSync(path.resolve('./.env'), 'utf8').split(/\r?\n/).reduce((acc, line) => { const idx = line.indexOf('='); if (idx === -1) return acc; const k = line.slice(0, idx).trim(); const v = line.slice(idx + 1).trim(); if (k) acc[k] = v; return acc }, {});
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('orders').select('id,listing_id,buyer_id,farmer_id,amount_kobo,status,paystack_ref,created_at').order('created_at', { ascending: false }).limit(20);
console.log(JSON.stringify({ error, data }, null, 2));
