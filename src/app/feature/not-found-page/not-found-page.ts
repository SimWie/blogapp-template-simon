import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, MatButtonModule],
  template: `
    <div class="not-found">
      <h1>404 – Seite nicht gefunden</h1>
      <p>Die gesuchte Seite existiert nicht.</p>
      <a mat-button routerLink="/">Zurück zur Übersicht</a>
    </div>
  `,
  styles: [
    `
      .not-found {
        text-align: center;
        margin-top: 4rem;
      }
    `,
  ],
})
export class NotFoundPage {}
