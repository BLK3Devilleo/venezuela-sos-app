import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqjjgbynsslthrhwntra.supabase.co';
const supabaseKey = '***SUPABASE_KEY_REMOVED***';

export const supabase = createClient(supabaseUrl, supabaseKey);
