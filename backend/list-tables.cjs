const { Client } = require('pg');

async function listTables() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'fixmyrv',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    const result = await client.query('SELECT tablename FROM pg_tables WHERE schemaname = $1', ['public']);
    console.log('Available tables:');
    result.rows.forEach(row => console.log('  -', row.tablename));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

listTables();
