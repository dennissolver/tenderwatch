import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);
try {
  // Add new columns for live session embed
  await sql.unsafe(`
    ALTER TABLE linked_accounts ADD COLUMN IF NOT EXISTS browserbase_session_id TEXT;
    ALTER TABLE linked_accounts ADD COLUMN IF NOT EXISTS live_view_url TEXT;
    ALTER TABLE linked_accounts ADD COLUMN IF NOT EXISTS manual_step_type TEXT;
  `);
  console.log('Live session columns added');

  // Add awaiting_user to account_status enum if not exists
  // Check if value exists first to avoid error
  const result = await sql.unsafe(`
    SELECT 1 FROM pg_enum WHERE enumlabel = 'awaiting_user'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'account_status')
  `);
  if (result.length === 0) {
    await sql.unsafe(`ALTER TYPE account_status ADD VALUE 'awaiting_user'`);
    console.log('awaiting_user status added to enum');
  } else {
    console.log('awaiting_user already exists in enum');
  }
} catch (e) {
  console.error('Failed:', e.message);
} finally {
  await sql.end();
}
