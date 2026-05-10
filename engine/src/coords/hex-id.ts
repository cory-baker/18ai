import type { AxialHex } from './types.js';

export class HexId {
  static getColIdxFromColId(colId: string): number {
    if (!/^[A-Z]$/.test(colId)) {
      throw new Error(`Invalid column id: ${JSON.stringify(colId)}. Must be a single uppercase letter A–Z.`);
    }
    return colId.charCodeAt(0) - 65;
  }

  static getColIdFromColIdx(colIdx: number): string {
    if (!Number.isInteger(colIdx) || colIdx < 0 || colIdx > 25) {
      throw new Error(`Invalid column index: ${colIdx}. Must be an integer in [0, 25].`);
    }
    return String.fromCharCode(65 + colIdx);
  }

  static getRowIdxFromRowId(rowId: string): number {
    if (!/^[1-9][0-9]*$/.test(rowId)) {
      throw new Error(`Invalid row id: ${JSON.stringify(rowId)}. Must be a positive integer with no leading zeros.`);
    }
    return parseInt(rowId, 10) - 1;
  }

  static getRowIdFromRowIdx(rowIdx: number): string {
    if (!Number.isInteger(rowIdx) || rowIdx < 0) {
      throw new Error(`Invalid row index: ${rowIdx}. Must be a non-negative integer.`);
    }
    return String(rowIdx + 1);
  }

  static getPartsFromHexId(id: string): { col: string; row: number } {
    const match = /^([A-Z])-([1-9][0-9]*)$/.exec(id);
    if (!match) {
      throw new Error(`Invalid hex id: ${JSON.stringify(id)}. Expected format 'A-1'.`);
    }
    return { col: match[1]!, row: parseInt(match[2]!, 10) };
  }

  static getAxialFromHexId(id: string): AxialHex {
    const match = /^([A-Z])-([1-9][0-9]*)$/.exec(id);
    if (!match) {
      throw new Error(`Invalid hex id: ${JSON.stringify(id)}. Expected format 'A-1'.`);
    }
    const q = HexId.getColIdxFromColId(match[1]!);
    const row = parseInt(match[2]!, 10);

    if ((q + row) % 2 === 0) {
      throw new Error(
        `parity violation in hex id ${JSON.stringify(id)}: col index ${q} and row ${row} must have opposite parity in an 18xx flat-top grid.`,
      );
    }

    const r = Math.floor((row - 1) / 2) - Math.floor(q / 2);
    return { q, r };
  }

  static getHexIdFromAxial(hex: AxialHex): string {
    const { q, r } = hex;
    const col = HexId.getColIdFromColIdx(q);
    const row = 2 * r + q + 1;
    return `${col}-${row}`;
  }
}
