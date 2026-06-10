import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { TileComponent } from './tile.component';
import { Tiles } from '@18ai/engine';

describe('TileComponent', () => {
  let fixture: ComponentFixture<TileComponent>;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TileComponent);
    fixture.componentInstance.tile = Tiles.byId('9');
    fixture.componentInstance.rotation = 0;
    fixture.detectChanges();
    nativeElement = fixture.nativeElement;
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('for tile #9', () => {
    it('renders two <line> elements for a single-path tile (black line/white outline)', () => {
      const lines = nativeElement.querySelectorAll('line');
      expect(lines.length).toBe(2);
    });

    it('positions lines from edge 0 (N) to edge 3 (s)', () => {
      const lines = nativeElement.querySelectorAll('line');
      const black = lines[1];
      expect(black.getAttribute('y1')).toBe('-87');
      expect(black.getAttribute('y2')).toBe('87');
      expect(black.getAttribute('x1')).toBe('0');
      expect(black.getAttribute('x2')).toBe('0');
    });

    it('applies rotation transform on the outer <g>', () => {
      const g = nativeElement.querySelector('svg:g');
      expect(g.getAttribute('transform')).toBe('rotate(0)');
    });
  });
});
