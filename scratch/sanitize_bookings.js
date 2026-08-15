import fs from "fs";
import path from "path";

const filePath = path.resolve("backend/data/bookings.json");

try {
  let content = fs.readFileSync(filePath, "utf-8");

  // Fix common quote syntax errors in text
  content = content.replace(/"id":\s*([a-zA-Z0-9_]+)"/g, '"id": "$1"');
  content = content.replace(/"id":\s*([a-zA-Z0-9_]+)\s*\n/g, '"id": "$1",\n');

  // Match all JSON object chunks
  const objectRegex = /\{[^{}]*\}/g;
  const rawMatches = content.match(objectRegex) || [];
  
  const validBookings = [];
  const seenIds = new Set();

  for (let raw of rawMatches) {
    let str = raw.trim();
    // Fix missing double quotes on id values like "id": online_123_456
    str = str.replace(/"id"\s*:\s*([a-zA-Z0-9_-]+)(?=[,\}\s])/g, '"id": "$1"');
    str = str.replace(/"status"\s*:\s*"pe"pending"/g, '"status": "pending"');

    try {
      const obj = JSON.parse(str);
      if (
        obj &&
        obj.id &&
        typeof obj.id === "string" &&
        !seenIds.has(obj.id)
      ) {
        // Filter out entries with HTML/Script injection in name, timestamp, or documents
        const isHtmlGarbage =
          (obj.name && (obj.name.includes("<script") || obj.name.includes("<!DOCTYPE") || obj.name.includes("<style"))) ||
          (obj.timestamp && (obj.timestamp.includes("<script") || obj.timestamp.includes("<!DOCTYPE") || obj.timestamp.includes("<style"))) ||
          (obj.documents && (obj.documents.includes("<script") || obj.documents.includes("<!DOCTYPE") || obj.documents.includes("<style")));

        if (!isHtmlGarbage) {
          seenIds.add(obj.id);
          validBookings.push(obj);
        }
      }
    } catch (e) {
      // Ignore unparseable chunks
    }
  }

  console.log(`Sanitized bookings successfully! Saved ${validBookings.length} clean, valid booking records.`);
  fs.writeFileSync(filePath, JSON.stringify(validBookings, null, 2), "utf-8");
} catch (err) {
  console.error("Error sanitizing bookings.json:", err);
}
