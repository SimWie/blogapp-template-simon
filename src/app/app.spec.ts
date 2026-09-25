import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // provideHttpClient(): App injiziert jetzt AuthStore, dessen
      // Konstruktor sofort checkSession() (einen HTTP-Call) auslöst.
      providers: [provideRouter(routes), provideHttpClient()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the sidebar', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    // Titel/Toolbar sitzen jetzt in der SidebarComponent, siehe
    // sidebar.component.spec.ts -- App rendert nur noch <app-sidebar/>.
    expect(compiled.querySelector('app-sidebar')).toBeTruthy();
  });
});
