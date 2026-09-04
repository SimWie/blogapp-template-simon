import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  form,
  submit,
  required,
  minLength,
  maxLength,
  validate,
  FormField,
} from '@angular/forms/signals';

/** Nur Buchstaben (inkl. Umlaute/ß), Zahlen und Leerzeichen -- \p{L}/\p{N} im Unicode-Modus. */
const TITLE_WITHOUT_SPECIAL_CHARS = /^[\p{L}\p{N} ]*$/u;

interface BlogCreateModel {
  title: string;
  content: string;
  category: string;
}

/**
 * Formular zum Erstellen eines neuen Blog-Beitrags mit Signal Forms
 * (@angular/forms/signals). signal() ist das Model (reine Daten), form()
 * der Controller darüber -- Validierung + UI-State (touched/valid/errors)
 * leben ausschliesslich im form(), nicht im Model.
 */
@Component({
  selector: 'app-blog-create',
  imports: [FormField, MatButtonModule],
  templateUrl: './blog-create.html',
  styleUrl: './blog-create.scss',
})
export class BlogCreate {
  readonly categories = [
    { value: 'general', label: 'Allgemein' },
    { value: 'tech', label: 'Technik' },
    { value: 'lifestyle', label: 'Lifestyle' },
  ];

  blogModel = signal<BlogCreateModel>({
    title: '',
    content: '',
    category: 'general',
  });

  blogForm = form(this.blogModel, (s) => {
    required(s.title, { message: 'Titel ist erforderlich' });
    minLength(s.title, 3, { message: 'Titel muss mindestens 3 Zeichen lang sein' });
    maxLength(s.title, 100, { message: 'Titel darf höchstens 100 Zeichen lang sein' });

    // 3a: Custom Validator -- Titel darf keine Sonderzeichen enthalten.
    validate(s.title, ({ value }) => {
      const title = value();
      if (title && !TITLE_WITHOUT_SPECIAL_CHARS.test(title)) {
        return {
          kind: 'specialCharacters',
          message: 'Titel darf nur Buchstaben, Zahlen und Leerzeichen enthalten',
        };
      }
      return undefined;
    });

    required(s.content, { message: 'Inhalt ist erforderlich' });
    minLength(s.content, 10, { message: 'Inhalt muss mindestens 10 Zeichen lang sein' });

    // 3b: Cross-Field-Validierung -- Inhalt muss mind. doppelt so lang wie
    // der Titel sein. valueOf(s.title) macht den Validator reaktiv: ändert
    // sich der Titel, wird diese Regel automatisch neu ausgewertet, ohne
    // dass wir das selbst verdrahten müssten.
    validate(s.content, ({ value, valueOf }) => {
      const content = value();
      const title = valueOf(s.title);
      if (content && title && content.length < title.length * 2) {
        return {
          kind: 'contentTooShort',
          message: 'Inhalt muss mindestens doppelt so lang wie der Titel sein',
        };
      }
      return undefined;
    });

    required(s.category, { message: 'Kategorie ist erforderlich' });
  });

  submitted = signal(false);

  /**
   * submit() führt die übergebene Action nur aus, wenn alle Validierungen
   * bestanden sind -- ein zusätzliches if (this.blogForm().valid()) ist
   * deshalb nicht nötig.
   */
  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const success = await submit(this.blogForm, async () => {
      console.log('Blog-Beitrag abgesendet:', this.blogModel());
    });

    if (success) {
      this.submitted.set(true);
      this.blogModel.set({ title: '', content: '', category: 'general' });
    }
  }
}
