import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "associates.json");

function ensureFile() {
  try {
    if (!fs.existsSync("data")) {
      fs.mkdirSync("data", { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
    }
  } catch (err) {
    console.error("Error ensuring data file:", err);
  }
}

export function getAssociates(): any[] {
  try {
    ensureFile();
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading associates:", err);
    return [];
  }
}

export function saveAssociates(data: any[]) {
  try {
    ensureFile();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error saving associates:", err);
  }
}
