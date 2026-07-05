import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Tiles } from '@18ai/engine';
import { TileComponent } from './tile.component';
import type { TileDef, Rotation } from '@18ai/engine';

@Component({
  standalone: true,
  imports: [TileComponent],
  template: `<svg><g app-tile [tile]="tile" [rotation]="rotation"></g></svg>`,
})
class TestHost {
  @Input() tile: TileDef = Tiles.byId('9')!;
  @Input() rotation: Rotation = 0;
}

describe('TileComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    nativeElement = fixture.nativeElement;
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('For a simple N -> S tile with no stops', () => {
    it('renders two <line> elements for a single-path tile (black line/white outline)', () => {
      const lines = nativeElement.querySelectorAll('line');
      expect(lines.length).toBe(2);
    });

    it('positions lines from edge 0 (N) to edge 3 (S)', () => {
      const lines = nativeElement.querySelectorAll('line');
      const black = lines[1];
      expect(black.getAttribute('y1')).toBe('-87');
      expect(black.getAttribute('y2')).toBe('87');
      expect(black.getAttribute('x1')).toBe('0');
      expect(black.getAttribute('x2')).toBe('0');
    });

    it('applies rotation transform on the host <g>', () => {
      const g = nativeElement.querySelector('g[app-tile]');
      // SVG.js normalizes transforms to matrix format
      expect(g?.getAttribute('transform')).toContain('matrix');
    });
  });

  describe('For a tile with a single city stop', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('tile', Tiles.byId('57')!);
      fixture.detectChanges();
    });

    it('renders a circle for the city stop', () => {
      const circles = nativeElement.querySelectorAll('circle');
      expect(circles.length).toBe(1);
    });

    describe('For a tile with a revenue badge', () => {
      it('renders revenue text', () => {
        const g = nativeElement.querySelector('g[app-tile]');
        expect(g.textContent).includes('20');
      });
    });
  });
});
