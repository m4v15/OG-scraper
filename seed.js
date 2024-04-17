require('dotenv').config()
const { db } = require('@vercel/postgres');

async function buildGfmTable(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    // Create the "users" table if it doesn't exist
    const createTable = await client.sql`
        DROP TABLE IF EXISTS gfms;
        CREATE TABLE IF NOT EXISTS gfms (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        url TEXT NOT NULL UNIQUE,
        imageurl TEXT UNIQUE,
        title TEXT,
        progress TEXT
      );
    `;

    console.log(`Created "gfms" table`);

    return {
      createTable,
    };
  } catch (error) {
    console.error('Error building table:', error);
    throw error;
  }
}

async function main() {
  const client = await db.connect();

  await buildGfmTable(client);

  await client.end();
}

main().catch((err) => {
  console.error(
    'An error occurred while attempting to seed the database:',
    err,
  );
});
