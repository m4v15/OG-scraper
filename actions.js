require("dotenv").config();
const { db } = require("@vercel/postgres");
const ogs = require("open-graph-scraper");
const { apiRows, spreadsheet, tableRows } = require("./placeholder-data.js");

const APIurl = "https://sheetdb.io/api/v1/40wut492o5iqb";

/// fetch URLs from google sheet
const filterSpreadsheet = (rows) => {
  let parsedRows = [];
  rows.forEach((row) => {
    if (
      row["Notes"] !== "OUT" &&
      row["Notes"] !== "CLOSED" &&
      !!row["GFM Link"]
    ) {
      console.log({ row });
      const parsedRow = {
        url: row["GFM Link"],
        progress: row["Money Raised USD"],
      };
      parsedRows.push(parsedRow);
    }
  });
  return parsedRows;
};

async function getUrls() {
  const url = APIurl;
  const response = await fetch(url);
  const jsonResponse = await response.json();
  return filterSpreadsheet(jsonResponse);
}

// fetch OG data for each URL

async function fetchOGdata(url) {
  if (!url) {
    console.log("no URL");
    return;
  }
  const options = { url };
  return ogs(options)
    .then((data) => {
      const { result } = data;
      const { ogTitle, ogImage } = result;
      // console.log({ogImage, ogTitle, ogUrl})
      const ogData = {
        imageurl: ogImage[0]["url"],
        title: ogTitle,
      };
      // console.log({tableData})
      return ogData;
    })
    .catch((err) => console.log({ err }));
}

async function getOGdata(rows) {
  tableData = [];
  for (const row of rows) {
    const ogData = await fetchOGdata(row.url);
    if (ogData) {
      const tableRowObject = {
        ...row,
        ...ogData,
      };
      tableData.push(tableRowObject);
    }
  }
  return tableData;
}

// send URL & OG data to database

async function createTable(client) {
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
    console.error("Error creating table:", error);
    throw error;
  }
}

async function addRow(client, data) {
  try {
    // Insert data into the "users" table
    const insertedGfms = await client.sql`
          INSERT INTO gfms (url, imageurl, title, progress)
          VALUES (${data.url}, ${data.imageurl}, ${data.title}, ${data.progress})
          ON CONFLICT DO NOTHING;
        `;

    console.log({ insertedGfms });

    return {
      addRow,
    };
  } catch (error) {
    console.error("Error adding gfms:", error);
    throw error;
  }
}

async function mainAdd() {
  const client = await db.connect();
  console.log("connected to db");

  const urls = await getUrls();
  console.log("retrieved urls from spreadsheet");

  const tableRows = await getOGdata(urls);
  console.log("retrieved OG data");

  // await createTable(client)
  // console.log('table created')

  for (let i = 0; i < tableRows.length; i++) {
    await addRow(client, tableRows[i]);
  }

  console.log(`added ${tableRows.length} lines of data to DB`);

  await client.end();
}
//////////////////////////////
// RUN CODE

mainAdd().catch((err) => {
  console.error(
    "An error occurred while attempting to add to the database:",
    err
  );
});
