const { Client } = require('pg');

async function describeChats() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'fixmyrv',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    const result = await client.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1', ['chats']);
    console.log('Chats table columns:');
    result.rows.forEach(row => console.log('  -', row.column_name));
    
    console.log('\nChat data:');
    const chats = await client.query('SELECT * FROM chats');
    chats.rows.forEach(row => {
      console.log('Chat:', row.id);
      Object.keys(row).forEach(key => {
        console.log('  ', key, ':', row[key]);
      });
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

describeChats();
