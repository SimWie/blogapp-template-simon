import { Component, inject } from '@angular/core';
import { AuthStore } from '../../core/auth-store';

/**
 * Platzhalter für die eigentliche Create-Blog-Seite -- das echte Formular ist
 * nicht Teil dieses Arbeitsblatts. Hier geht's nur darum, eine konkrete,
 * per canMatch geschützte Route zu haben, an der sich Guard + Rollen-Check
 * end-to-end testen lassen.
 */
@Component({
  selector: 'app-add-blog-page',
  templateUrl: './add-blog-page.html',
  styleUrl: './add-blog-page.scss',
})
export class AddBlogPage {
  protected readonly authStore = inject(AuthStore);
}
