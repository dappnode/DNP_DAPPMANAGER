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

export class JsonFileDb<T> {
  fileDb: PlainTextFileDb;

  constructor(filepath: string) {
    this.fileDb = new PlainTextFileDb(filepath);
  }

  read(): T | undefined {
    const data = this.fileDb.read();
    if (data) return JSON.parse(data);
  }

  write(data: T): void {
    this.fileDb.write(JSON.stringify(data));
  }

  del(): void {
    this.fileDb.del();
  }
}
