// test-connection.js (separate file)
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://asivaprakash23:asivaprakash23@moodchatbotmern.dlel1lu.mongodb.net/?retryWrites=true&w=majority&appName=moodchatbotmern";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("SUCCESS: Connection works!");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
