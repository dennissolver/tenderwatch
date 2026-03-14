import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);
try {
  await sql.unsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS acn TEXT');
  console.log('acn column added');
} catch (e) {
  console.error('Failed:', e.message);
} finally {
  await sql.end();
}
