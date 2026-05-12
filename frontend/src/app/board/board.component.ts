import { Component } from '@angular/core';
import { Map as ChesapeakeMap, type HexSlot } from '@18ai/engine';

@Component({
  selector: 'app-board',
  standalone: true,
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export class Board {
  /** Center-to-vertex; must match `polyPoints` (see `docs/architecture.md` §7.1). */
  private static readonly HEX_RADIUS = 100;
  private static readonly HEX_HEIGHT = Board.HEX_RADIUS * Math.sqrt(3);

  protected readonly polyPoints = '100,0 50,87 -50,87 -100,0 -50,-87 50,-87';
  protected readonly hexes = ChesapeakeMap.map;
  protected readonly viewBox: string;

  constructor() {
    const pad = 120;
    const xs = this.hexes.map((h) => this.hexToPixel(h.q, h.r).x);
    const ys = this.hexes.map((h) => this.hexToPixel(h.q, h.r).y);
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad;
    const maxY = Math.max(...ys) + pad;
    this.viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }

  /** Flat-top hex center from axial `(q, r)` — see `docs/architecture.md` §7.1. */
  protected hexToPixel(q: number, r: number): { x: number; y: number } {
    return {
      x: 1.5 * Board.HEX_RADIUS * q,
      y: Board.HEX_HEIGHT * (r + q / 2),
    };
  }

  protected fillFor(h: HexSlot): string {
    switch (h.kind) {
      case 'open':
      case 'city':
      case 'town':
        return '#D1DFC1';
      case 'offboard':
        return '#D4A186';
      case 'static_track':
        return '#CCCEC2';
      default: {
        const _x: never = h;
        return _x;
      }
    }
  }
}
