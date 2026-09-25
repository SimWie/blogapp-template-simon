import { Component, OnInit, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../auth-store';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatMenuModule,
    MatDivider,
    AsyncPipe,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
})
export class SidebarComponent implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  protected readonly authStore = inject(AuthStore);

  protected readonly title = 'HFTM Web Applications (IN353)';
  isDark = false;
  currentTheme = 'blue';

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map((result) => result.matches),
    shareReplay(),
  );

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
