import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { enginePlaceholder, ENGINE_VERSION } from '@18ai/engine';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule, MatCardModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('18Chesapeake');
  protected readonly engineVersion = ENGINE_VERSION;
  protected readonly engineMessage = enginePlaceholder().message;
}
