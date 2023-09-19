import { PlainTextFileDb } from "./plainTextFileDb.js";

export class JsonFileDb<T> {
  private fileDb: PlainTextFileDb;
  private defaultValue: T;

  constructor(filepath: string, defaultValue: T) {
    this.fileDb = new PlainTextFileDb(filepath);
    this.defaultValue = defaultValue;
  }

  read(): T {
    const data = this.fileDb.read();
    if (data) return JSON.parse(data);
    else return this.defaultValue;
  }

  write(data: T): void {
    this.fileDb.write(JSON.stringify(data, null, 2));
  }

  del(): void {
    this.fileDb.del();
  }
}
