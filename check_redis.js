import { Redis } from "@upstash/redis";

const url = "https://fun-moccasin-115397.upstash.io";
const token = "gQAAAAAAAcLFAAIgcDFhZjlhNzI3MmM3Zjc0ZjhhODNkYTc1M2I5ODkxNGNmYQ";

const client = new Redis({ url, token });

async function run() {
  console.log("Fetching keys...");
  const keys = await client.keys("*");
  console.log("Keys:", keys);
  
  for (const key of keys) {
    const val = await client.get(key);
    console.log(`\nKey: ${key}`);
    console.log(JSON.stringify(val, null, 2));
  }
}

run().catch(console.error);
