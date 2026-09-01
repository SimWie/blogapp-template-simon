import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

interface UserInfo {
  preferred_username: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthMeResponse {
  isAuthenticated: boolean;
  user: UserInfo | null;
}

interface LogoutResponse {
  logoutUrl: string;
}

/**
 * Zentraler Auth-State. Enthält bewusst keine login(username, password)
 * -Methode: der Login ist eine Browser-Navigation zum BFF, nicht ein
 * Formular-Submit -- die gehört auf die Login-Seite, nicht hierher.
 *
 * withCredentials und der X-Requested-With-Header werden nicht hier gesetzt,
 * sondern zentral vom bffInterceptor für jeden Request an environment.bffUrl.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private http = inject(HttpClient);

  // ─── State ────────────────────────────────────────────────────────────
  isAuthenticated = signal(false);
  user = signal<UserInfo | null>(null);
  loading = signal(true);

  // ─── Derived State ────────────────────────────────────────────────────
  roles = computed(() => this.user()?.roles ?? []);

  /**
   * Startet beim Erzeugen des Stores (also beim App-Start) einmalig den
   * Session-Check. Der canMatch-Guard wartet darauf statt zu pollen.
   */
  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.checkSession();
  }

  /** Fragt den aktuellen Session-Status beim BFF ab (GET /api/auth/me). */
  async checkSession(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<AuthMeResponse>(`${environment.bffUrl}/auth/me`),
      );
      this.isAuthenticated.set(response.isAuthenticated);
      this.user.set(response.user);
    } catch (error) {
      console.error('Fehler beim Prüfen der Session:', error);
      this.isAuthenticated.set(false);
      this.user.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Beendet die Session beim BFF und verlässt die App danach zur
   * Keycloak-Logout-URL -- kein router.navigate() danach, das liefe ins Leere.
   */
  async logout(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<LogoutResponse>(`${environment.bffUrl}/auth/logout`, {}),
      );
      this.isAuthenticated.set(false);
      this.user.set(null);
      window.location.href = response.logoutUrl;
    } catch (error) {
      console.error('Fehler beim Logout:', error);
    }
  }
}
