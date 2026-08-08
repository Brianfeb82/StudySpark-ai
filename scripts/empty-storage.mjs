// Empties the Firebase Storage bucket for StudySpark AI.
//
// Credentials (one of):
//   gcloud auth application-default login
//   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
//     (Firebase console > Project Settings > Service Accounts > Generate new private key)
//
// Usage:
//   node scripts/empty-storage.mjs            # dry run (lists objects)
//   node scripts/empty-storage.mjs --force    # deletes everything
import { Storage } from "@google-cloud/storage";

const BUCKET = "studyspark-ai-1490b.firebasestorage.app";
const FORCE = process.argv.includes("--force");

const bucket = new Storage().bucket(BUCKET);

const [files] = await bucket.getFiles();

console.log(`${files.length} object(s) in gs://${BUCKET}`);
for (const file of files) {
  if (FORCE) {
    await file.delete();
    console.log(`deleted: ${file.name}`);
  } else {
    console.log(`keep    (dry run): ${file.name}`);
  }
}

if (FORCE) {
  console.log("Done. Storage quota frees up within a minute or two.");
} else {
  console.log("Dry run - nothing deleted. Re-run with --force to empty the bucket.");
}