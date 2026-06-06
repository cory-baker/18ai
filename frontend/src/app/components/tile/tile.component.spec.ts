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
});
