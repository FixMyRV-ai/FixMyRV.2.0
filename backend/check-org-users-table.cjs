const { Client } = require("pg");

const devConfig = {
  host: "localhost",
  port: 5433,
  database: "fixmyrv",
  user: "postgres",
  password: "postgres",
};

async function checkTableStructure() {
  const client = new Client(devConfig);
  await client.connect();
  
  // Get table structure
  const result = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'organizations' 
    ORDER BY ordinal_position;
  `);
  
  console.log('organizations table structure:');
  console.table(result.rows);
  
  await client.end();
}

checkTableStructure().catch(console.error);
