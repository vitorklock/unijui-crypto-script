import path from "node:path";
import fs from "node:fs";

/** Ensures the output directory exists. */
export function ensureDir(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
