import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDivider } from '@angular/material/divider';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatDivider,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = 'HFTM Web Applications (IN353)';

  isDark = false;
  currentTheme = 'blue';

  ngOnInit(): void {
    // Gespeichertes Theme aus localStorage laden
    const savedTheme = localStorage.getItem('theme');
    const savedDark = localStorage.getItem('darkMode');

    // Immer ein Theme setzen – gespeichertes oder Standard (blau)
    this.setTheme(savedTheme ?? 'blue');

    if (savedDark !== null) {
      // Explizite Nutzer-Einstellung hat Vorrang
      this.isDark = savedDark === 'true';
    } else if (window.matchMedia) {
      // Fallback: System-Einstellung (prefers-color-scheme) lesen
      this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    document.body.classList.toggle('dark-theme', this.isDark);

    // Auf Änderungen der System-Einstellung reagieren (nur ohne manuellen Override)
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('darkMode') === null) {
          this.isDark = e.matches;
          document.body.classList.toggle('dark-theme', this.isDark);
        }
      });
    }
  }

  setTheme(theme: string): void {
    document.body.classList.remove(`theme-${this.currentTheme}`);
    this.currentTheme = theme;
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
  }

  toggleDark(): void {
    this.isDark = !this.isDark;
    document.body.classList.toggle('dark-theme', this.isDark);
    localStorage.setItem('darkMode', String(this.isDark));
  }
}
