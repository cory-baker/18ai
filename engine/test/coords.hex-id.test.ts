import { describe, expect, it } from 'vitest';
import { Edge, HexId, edgeBetween, neighborOf } from '../src/index.js';

describe('coords/hex-id atomic helpers', () => {
  it('extracts column and row parts from a hex id', () => {
    expect(HexId.getPartsFromHexId('F-8')).toEqual({ col: 'F', row: 8 });
  });

  it('round-trips column ids and indexes', () => {
    const cases: readonly [string, number][] = [
      ['A', 0],
      ['B', 1],
      ['F', 5],
      ['L', 11],
      ['Z', 25],
    ];
    for (const [colId, colIdx] of cases) {
      expect(HexId.getColIdxFromColId(colId)).toBe(colIdx);
      expect(HexId.getColIdFromColIdx(colIdx)).toBe(colId);
    }
  });

  it('rejects malformed column ids and indexes', () => {
    expect(() => HexId.getColIdxFromColId('')).toThrow(/column id/);
    expect(() => HexId.getColIdxFromColId('AA')).toThrow(/column id/);
    expect(() => HexId.getColIdxFromColId('a')).toThrow(/column id/);
    expect(() => HexId.getColIdxFromColId('1')).toThrow(/column id/);

    expect(() => HexId.getColIdFromColIdx(-1)).toThrow(/column index/);
    expect(() => HexId.getColIdFromColIdx(26)).toThrow(/column index/);
    expect(() => HexId.getColIdFromColIdx(1.5)).toThrow(/column index/);
  });

  it('round-trips row ids and indexes', () => {
    const cases: readonly [string, number][] = [
      ['1', 0],
      ['2', 1],
      ['8', 7],
      ['14', 13],
    ];
    for (const [rowId, rowIdx] of cases) {
      expect(HexId.getRowIdxFromRowId(rowId)).toBe(rowIdx);
      expect(HexId.getRowIdFromRowIdx(rowIdx)).toBe(rowId);
    }
  });

  it('rejects malformed row ids and indexes', () => {
    expect(() => HexId.getRowIdxFromRowId('')).toThrow(/row id/);
    expect(() => HexId.getRowIdxFromRowId('0')).toThrow(/row id/);
    expect(() => HexId.getRowIdxFromRowId('-1')).toThrow(/row id/);
    expect(() => HexId.getRowIdxFromRowId('08')).toThrow(/row id/);
    expect(() => HexId.getRowIdxFromRowId('1.5')).toThrow(/row id/);
    expect(() => HexId.getRowIdxFromRowId('eight')).toThrow(/row id/);

    expect(() => HexId.getRowIdFromRowIdx(-1)).toThrow(/row index/);
    expect(() => HexId.getRowIdFromRowIdx(1.5)).toThrow(/row index/);
  });
});

describe('coords/hex-id getAxialFromHexId / getHexIdFromAxial', () => {
  it('converts standard 18xx hex ids into axial coordinates', () => {
    expect(HexId.getAxialFromHexId('A-3')).toEqual({ q: 0, r: 1 });
    expect(HexId.getAxialFromHexId('B-2')).toEqual({ q: 1, r: 0 });
    expect(HexId.getAxialFromHexId('B-4')).toEqual({ q: 1, r: 1 });
    expect(HexId.getAxialFromHexId('F-8')).toEqual({ q: 5, r: 1 });
    expect(HexId.getAxialFromHexId('H-6')).toEqual({ q: 7, r: -1 });
    expect(HexId.getAxialFromHexId('L-2')).toEqual({ q: 11, r: -5 });
  });

  it('round-trips through getAxialFromHexId / getHexIdFromAxial', () => {
    for (const id of ['A-3', 'B-2', 'B-4', 'C-13', 'F-8', 'H-6', 'J-4', 'K-7', 'L-2', 'L-4']) {
      expect(HexId.getHexIdFromAxial(HexId.getAxialFromHexId(id))).toBe(id);
    }
  });

  it('rejects malformed hex ids', () => {
    expect(() => HexId.getAxialFromHexId('')).toThrow(/Invalid hex id/);
    expect(() => HexId.getAxialFromHexId('AA-3')).toThrow(/Invalid hex id/);
    expect(() => HexId.getAxialFromHexId('a-3')).toThrow(/Invalid hex id/);
    expect(() => HexId.getAxialFromHexId('F8')).toThrow(/Invalid hex id/);
    expect(() => HexId.getAxialFromHexId('F-')).toThrow(/Invalid hex id/);
  });

  it('rejects ids whose column+row parity violates 18xx flat-top alternation', () => {
    expect(() => HexId.getAxialFromHexId('A-2')).toThrow(/parity/);
    expect(() => HexId.getAxialFromHexId('B-3')).toThrow(/parity/);
  });

  it('makes adjacent ids axial neighbors via the existing neighborOf utility', () => {
    const a3 = HexId.getAxialFromHexId('A-3');
    const b2 = HexId.getAxialFromHexId('B-2');
    const b4 = HexId.getAxialFromHexId('B-4');

    expect(neighborOf(a3, Edge.NE)).toEqual(b2);
    expect(neighborOf(a3, Edge.SE)).toEqual(b4);
    expect(edgeBetween(b2, b4)).toBe(Edge.S);
  });
});
