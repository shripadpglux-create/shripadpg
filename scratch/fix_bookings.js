import fs from "fs";
import path from "path";

const filePath = path.resolve("backend/data/bookings.json");

try {
  const text = fs.readFileSync(filePath, "utf-8");
  
  // Try direct parse first
  try {
    const data = JSON.parse(text);
    console.log("JSON is already 100% valid! Count:", data.length);
    process.exit(0);
  } catch (err) {
    console.log("JSON parse error detected:", err.message);
  }

  // Split into individual object strings
  const items = text.split(/\n\s*\{\s*\n/);
  const cleanBookings = [];

  for (let raw of items) {
    let str = raw.trim();
    if (!str) continue;
    if (!str.startsWith("{")) str = "{\n" + str;
    if (str.endsWith(",")) str = str.slice(0, -1).trim();
    if (str.endsWith("]")) str = str.slice(0, -1).trim();
    if (str.endsWith(",")) str = str.slice(0, -1).trim();
    if (!str.endsWith("}")) str = str + "\n}";

    // Fix known typos
    str = str.replace(/"pe"pending"/g, '"pending"');
    str = str.replace(/^\s*phone":/gm, '    "phone":');

    try {
      const parsed = JSON.parse(str);
      if (
        parsed &&
        parsed.id &&
        typeof parsed.name === "string" &&
        !parsed.name.includes("<script") &&
        !parsed.name.includes("<!DOCTYPE")
      ) {
        cleanBookings.push(parsed);
      }
    } catch {
      // Ignore corrupted HTML garbage chunks
    }
  }

  console.log(`Repaired successfully! Saved ${cleanBookings.length} clean booking records.`);
  fs.writeFileSync(filePath, JSON.stringify(cleanBookings, null, 2), "utf-8");
} catch (error) {
  console.error("Failed to repair bookings.json:", error);
}
