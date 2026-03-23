// supabase.js
// 1. Replace these with your actual Supabase URL and Anon Key from the Supabase Dashboard
const SUPABASE_URL = 'https://cbyjfzmbqqggegkgkrmu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNieWpmem1icXFnZ2Vna2drcm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDI4MjIsImV4cCI6MjA4OTA3ODgyMn0.aUXikhDMBLSHqppMjW0_6PgIU21wBPdQGA50xfJh-RU';

// 2. Initialize the Supabase client
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Example function to fetch sessions from Supabase instead of data.js
 */
async function getSessionsFromSupabase() {
    const { data, error } = await supabase
        .from('sessions') // Change 'sessions' to your actual table name
        .select('*');

    if (error) {
        console.error('Error fetching sessions:', error.message);
        return [];
    }

    return data;
}

/**
 * Example function to insert data into Supabase
 */
async function addStudentResultToSupabase(studentResult) {
    const { data, error } = await supabase
        .from('results') // Change 'results' to your actual table name
        .insert([studentResult]);

    if (error) {
        console.error('Error inserting result:', error.message);
        return null;
    }

    return data;
}
