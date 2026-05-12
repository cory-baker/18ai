import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'board',
    loadComponent: () => import('./board/board.component').then((m) => m.Board),
  },
];
