const { Client } = require('pg');

async function describeMessages() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'fixmyrv',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    const result = await client.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1', ['messages']);
    console.log('Messages table columns:');
    result.rows.forEach(row => console.log('  -', row.column_name));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

describeMessages();
