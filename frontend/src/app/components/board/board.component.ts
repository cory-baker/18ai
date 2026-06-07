import { Component } from '@angular/core';
import { Map as ChesapeakeMap, type HexSlot } from '@18ai/engine';

@Component({
  selector: 'app-board',
  standalone: true,
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export class Board {
  /** Flat-top hex vertex radius; must match the numeric `polyPoints` string below. */
  private static readonly HEX_RADIUS = 100;
  /** https://www.redblobgames.com/grids/hexagons/#size-and-spacing */
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

  /**
   * Axial (q, r) → pixel center for a flat-top hex.
   * https://www.redblobgames.com/grids/hexagons/#hex-to-pixel-axial
   */
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
        return h;
      }
    }
  }
}
