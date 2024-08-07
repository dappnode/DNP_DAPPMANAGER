import fs from "fs";
import path from "path";

export class PlainTextFileDb {
  private filepath: string;

  constructor(filepath: string) {
    this.filepath = filepath;
  }

  read(): string | undefined {
    try {
      return fs.readFileSync(this.filepath, "utf8").trim();
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      return undefined;
    }
  }

  write(data: string): void {
    fs.mkdirSync(path.dirname(this.filepath), { recursive: true });
    fs.writeFileSync(this.filepath, data);
  }

  del(): void {
    try {
      fs.unlinkSync(this.filepath);
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
  }
}
