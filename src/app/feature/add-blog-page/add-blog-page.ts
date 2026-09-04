import { Component, inject } from '@angular/core';
import { AuthStore } from '../../core/auth-store';
import { BlogCreate } from '../blog-create/blog-create';

/**
 * Geschützte Route (canMatch: authGuard('user')) mit dem eigentlichen
 * Blog-Erstellungsformular (BlogCreate, Signal Forms).
 */
@Component({
  selector: 'app-add-blog-page',
  imports: [BlogCreate],
  templateUrl: './add-blog-page.html',
  styleUrl: './add-blog-page.scss',
})
export class AddBlogPage {
  protected readonly authStore = inject(AuthStore);
}
