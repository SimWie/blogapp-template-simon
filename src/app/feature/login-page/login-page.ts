import { Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../environments/environment';

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Zugriff verweigert. Der Login wurde abgebrochen oder abgelehnt.',
  expired: 'Der Login-Versuch ist abgelaufen. Bitte versuche es erneut.',
  failed: 'Die Anmeldung ist fehlgeschlagen. Bitte versuche es erneut.',
};

/**
 * Login-Seite ohne Formular: kein Username-/Passwort-Feld. Der Button ist
 * eine Navigation zum BFF, das den Authorization-Code-Flow bei Keycloak
 * startet -- fetch() würde hier nicht funktionieren, der Browser muss dem
 * 302-Redirect selbst folgen.
 */
@Component({
  selector: 'app-login-page',
  imports: [MatButtonModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  // Per withComponentInputBinding() direkt aus den Query-Parametern ?returnUrl=...&error=... befüllt.
  returnUrl = input<string>('/');
  error = input<string>();

  errorMessage = computed(() => {
    const error = this.error();
    if (!error) {
      return null;
    }
    return ERROR_MESSAGES[error] ?? 'Ein unbekannter Fehler ist aufgetreten.';
  });

  loginUrl = computed(() => {
    // withComponentInputBinding() kann returnUrl auf undefined setzen, wenn
    // dieselbe LoginPage-Instanz für eine Navigation ohne den Query-Param
    // wiederverwendet wird (Router-Reuse bei gleicher Route) -- der
    // deklarierte Default('/') greift dann nicht mehr, deshalb hier nochmal
    // absichern statt dem Typ blind zu vertrauen.
    const returnUrl = this.returnUrl() || '/';
    return `${environment.bffUrl}/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  });

  onLoginClick(): void {
    window.location.href = this.loginUrl();
  }
}
