// Type stubs for jspdf, jspdf-autotable, and xlsx
// These libraries are available at runtime but not listed in package.json.
// These minimal declarations suppress TypeScript errors.

declare module "jspdf" {
  interface jsPDFOptions {
    orientation?: string;
    unit?: string;
    format?: string | number[];
  }
  class jsPDF {
    constructor(options?: jsPDFOptions);
    text(
      text: string,
      x: number,
      y: number,
      options?: Record<string, unknown>,
    ): this;
    setFontSize(size: number): this;
    setFont(font: string, style?: string): this;
    setTextColor(r: number, g?: number, b?: number): this;
    setFillColor(r: number, g?: number, b?: number): this;
    rect(x: number, y: number, w: number, h: number, style?: string): this;
    line(x1: number, y1: number, x2: number, y2: number): this;
    addPage(): this;
    save(filename: string): void;
    internal: { pageSize: { getWidth(): number; getHeight(): number } };
    lastAutoTable: { finalY: number };
  }
  export default jsPDF;
}

declare module "jspdf-autotable" {
  import type jsPDF from "jspdf";
  interface UserOptions {
    head?: unknown[][];
    body?: unknown[][];
    startY?: number;
    theme?: string;
    headStyles?: Record<string, unknown>;
    alternateRowStyles?: Record<string, unknown>;
    styles?: Record<string, unknown>;
    margin?: Record<string, number>;
    bodyStyles?: Record<string, unknown>;
    columnStyles?: Record<string, Record<string, unknown>>;
  }
  function autoTable(doc: jsPDF, options: UserOptions): void;
  export default autoTable;
}

declare module "xlsx" {
  interface WorkBook {
    SheetNames: string[];
    Sheets: Record<string, WorkSheet>;
  }
  interface WorkSheet {
    [key: string]: unknown;
  }
  const utils: {
    book_new(): WorkBook;
    aoa_to_sheet(data: unknown[][]): WorkSheet;
    book_append_sheet(wb: WorkBook, ws: WorkSheet, name: string): void;
    json_to_sheet(data: Record<string, unknown>[]): WorkSheet;
  };
  function writeFile(wb: WorkBook, filename: string): void;
}
