import { Rotation, Segment, segmentForPath, TileDef } from '@18ai/engine';
import { Component, ElementRef, Input, OnChanges, inject } from '@angular/core';
import { G } from '@svgdotjs/svg.js';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- SVG group host per architecture §7.2
  selector: 'g[app-tile]',
  standalone: true,
  template: '',
  styleUrl: './tile.component.scss',
})
export class TileComponent implements OnChanges {
  private readonly host = inject(ElementRef<SVGGElement>);

  @Input({ required: true }) tile!: TileDef;
  @Input() rotation: Rotation = 0;

  ngOnChanges(): void {
    this.render();
  }

  private render(): void {
    const group = new G(this.host.nativeElement);
    group.clear();

    // Set rotation around origin (0, 0) to avoid getBBox() call in tests
    group.transform({ rotate: this.rotation * 60, origin: [0, 0] });

    for (const segment of this.getSegments()) {
      group
        .line(segment.x1, segment.y1, segment.x2, segment.y2)
        .stroke({ color: 'white', width: 12, linecap: 'round' });

      group.line(segment.x1, segment.y1, segment.x2, segment.y2).stroke({ color: 'black', width: 9, linecap: 'round' });
    }
  }

  private getSegments(): Segment[] {
    return this.tile.paths.map((path) => segmentForPath(path, this.tile.stops));
  }
}
