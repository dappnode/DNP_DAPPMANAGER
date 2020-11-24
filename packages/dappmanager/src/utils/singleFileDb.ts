import fs from "fs";
import path from "path";

export class SingleFileDb {
  filepath: string;

  constructor(filepath: string) {
    this.filepath = filepath;
  }

  read(): string | null {
    try {
      return fs.readFileSync(this.filepath, "utf8").trim();
    } catch (e) {
      if (e.code === "ENOENT") return null;
      else throw e;
    }
  }

  write(data: string): void {
    fs.mkdirSync(path.dirname(this.filepath), { recursive: true });
    fs.writeFileSync(this.filepath, data);
  }
}
