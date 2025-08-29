const { Client } = require('pg');

async function describeTable() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'fixmyrv',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    const result = await client.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1', ['users']);
    console.log('Users table structure:');
    result.rows.forEach(row => console.log('  -', row.column_name, ':', row.data_type));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

describeTable();
