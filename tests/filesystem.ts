export type Fault = (
  path: string,
  operation: "write" | "close" | "after-close" | "remove",
) => void;
class MemoryFile {
  readonly kind = "file";
  data = new Uint8Array();
  constructor(
    readonly name: string,
    readonly path: string,
    readonly fault: Fault,
  ) {}
  async getFile() {
    return new File([this.data], this.name);
  }
  async createWritable() {
    let pending = new Uint8Array();
    return {
      write: async (value: string | Blob | ArrayBuffer | Uint8Array) => {
        this.fault(this.path, "write");
        pending =
          typeof value === "string"
            ? new TextEncoder().encode(value)
            : value instanceof Blob
              ? new Uint8Array(await value.arrayBuffer())
              : new Uint8Array(value);
      },
      close: async () => {
        this.fault(this.path, "close");
        this.data = pending;
        this.fault(this.path, "after-close");
      },
      abort: async () => {},
    };
  }
}
export class MemoryDirectory {
  readonly kind = "directory";
  readonly entries = new Map<string, MemoryFile | MemoryDirectory>();
  constructor(
    readonly name = "device",
    readonly path = "",
    readonly fault: Fault = () => {},
  ) {}
  async getFileHandle(name: string, options?: { create?: boolean }) {
    let entry = this.entries.get(name);
    if (!entry && options?.create) {
      entry = new MemoryFile(name, `${this.path}/${name}`, this.fault);
      this.entries.set(name, entry);
    }
    if (!entry) throw new DOMException("Missing file", "NotFoundError");
    if (entry.kind !== "file")
      throw new DOMException("Wrong kind", "TypeMismatchError");
    return entry;
  }
  async getDirectoryHandle(name: string, options?: { create?: boolean }) {
    let entry = this.entries.get(name);
    if (!entry && options?.create) {
      entry = new MemoryDirectory(name, `${this.path}/${name}`, this.fault);
      this.entries.set(name, entry);
    }
    if (!entry) throw new DOMException("Missing directory", "NotFoundError");
    if (entry.kind !== "directory")
      throw new DOMException("Wrong kind", "TypeMismatchError");
    return entry;
  }
  async removeEntry(name: string) {
    this.fault(`${this.path}/${name}`, "remove");
    if (!this.entries.delete(name))
      throw new DOMException("Missing entry", "NotFoundError");
  }
  async *values() {
    yield* this.entries.values();
  }
  handle() {
    return this as unknown as FileSystemDirectoryHandle;
  }
}
