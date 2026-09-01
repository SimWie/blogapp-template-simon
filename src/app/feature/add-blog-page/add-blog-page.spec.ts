import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { AddBlogPage } from './add-blog-page';

describe('AddBlogPage', () => {
  let component: AddBlogPage;
  let fixture: ComponentFixture<AddBlogPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddBlogPage],
      // provideHttpClient(): injiziert AuthStore, dessen Konstruktor sofort
      // checkSession() (einen HTTP-Call) auslöst.
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(AddBlogPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
