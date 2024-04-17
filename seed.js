require('dotenv').config()
const { db } = require('@vercel/postgres');
const {
  gfms
} = require('./placeholder-data.js');

async function seedGfms(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    // Create the "users" table if it doesn't exist
    const createTable = await client.sql`
        DROP TABLE IF EXISTS gfms;
        CREATE TABLE IF NOT EXISTS gfms (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        url TEXT NOT NULL UNIQUE,
        imageurl TEXT UNIQUE,
        title TEXT
      );
    `;

    console.log(`Created "gfms" table`);

    // Insert data into the "users" table
    const insertedGfms = await Promise.all(
      gfms.map(async (gfm) => {
        return client.sql`
        INSERT INTO gfms (url, imageurl, title)
        VALUES (${gfm.url}, ${gfm.imageurl}, ${gfm.title});
      `;
      }),
    );

    console.log(`Seeded ${insertedGfms.length} users`);

    return {
      createTable,
      gfms: insertedGfms,
    };
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

async function main() {
  const client = await db.connect();

  await seedGfms(client);

  await client.end();
}

main().catch((err) => {
  console.error(
    'An error occurred while attempting to seed the database:',
    err,
  );
});
