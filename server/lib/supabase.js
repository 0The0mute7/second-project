const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('Supabase environment variables are missing. API routes will fail until SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
}

const supabase = createClient(
    supabaseUrl || 'https://example.supabase.co',
    supabaseServiceRoleKey || 'missing-service-role-key',
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

const mustGetData = async (query, fallbackMessage) => {
    const { data, error } = await query;

    if (error || !data) {
        throw new Error(error?.message || fallbackMessage);
    }

    return data;
};

const maybeSingle = async (query, fallbackMessage) => {
    const { data, error } = await query.maybeSingle();

    if (error) {
        throw new Error(error.message || fallbackMessage);
    }

    return data;
};

module.exports = {
    supabase,
    mustGetData,
    maybeSingle
};
