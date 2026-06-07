import { Rotation, Segment, segmentForPath, TileDef } from '@18ai/engine';
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tile',
  standalone: true,
  templateUrl: './tile.component.html',
  styleUrl: './tile.component.scss',
  imports: [CommonModule],
})
export class TileComponent {
  @Input({ required: true }) tile!: TileDef;
  @Input() rotation: Rotation = 0;

  get segments(): Segment[] {
    return this.tile.paths.map((p) => segmentForPath(p, this.tile.cities));
  }
}
