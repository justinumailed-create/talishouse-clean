import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "associates.json");

function ensureFile() {
  if (!fs.existsSync("data")) {
    fs.mkdirSync("data", { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
}

export function getAssociates(): any[] {
  ensureFile();
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

export function saveAssociates(data: any[]) {
  ensureFile();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
