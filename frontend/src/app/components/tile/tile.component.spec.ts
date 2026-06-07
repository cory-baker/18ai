import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { TileComponent } from './tile.component';

describe('TileComponent', () => {
  let fixture: ComponentFixture<TileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TileComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('render two <line> elements for a single-path tile (black line/white outline)', () => {
    const lines = fixture.nativeElement.querySelectorAll('line')
    expect(lines.length).toBe(2)
  })
});
