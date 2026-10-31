// Resets the local demo-mode database. The app re-seeds the Saffron & Sage
// demo restaurant automatically on the next request.
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.cwd(), process.env.MENUMINT_DATA_DIR || ".data");
fs.rmSync(path.join(dir, "db.json"), { force: true });
if (process.argv.includes("--uploads")) fs.rmSync(path.join(dir, "uploads"), { recursive: true, force: true });
console.log(`Local demo database reset (${dir}). It will be re-seeded on the next request.`);
