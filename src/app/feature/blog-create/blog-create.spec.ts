import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogCreate } from './blog-create';

describe('BlogCreate', () => {
  let component: BlogCreate;
  let fixture: ComponentFixture<BlogCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(BlogCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('is invalid with the empty default model (required fields)', () => {
    expect(component.blogForm().invalid()).toBe(true);
  });

  it('rejects titles shorter than 3 characters', () => {
    component.blogModel.set({ title: 'ab', content: '', category: 'general' });
    expect(component.blogForm.title().invalid()).toBe(true);
  });

  it('rejects titles with special characters', () => {
    component.blogModel.set({ title: 'Titel!!', content: '', category: 'general' });
    expect(
      component.blogForm
        .title()
        .errors()
        .some((error) => error.kind === 'specialCharacters'),
    ).toBe(true);
  });

  it('accepts umlauts in the title', () => {
    component.blogModel.set({ title: 'Über Züge', content: '', category: 'general' });
    expect(
      component.blogForm
        .title()
        .errors()
        .some((error) => error.kind === 'specialCharacters'),
    ).toBe(false);
  });

  it('rejects content shorter than twice the title length (cross-field)', () => {
    component.blogModel.set({
      title: 'Ein langer Titel',
      content: 'Kurz',
      category: 'general',
    });
    expect(
      component.blogForm
        .content()
        .errors()
        .some((error) => error.kind === 'contentTooShort'),
    ).toBe(true);
  });

  it('is valid with well-formed data', () => {
    component.blogModel.set({
      title: 'Mein Titel',
      content: 'Das ist ein ausreichend langer Inhalt für diesen Blog-Beitrag.',
      category: 'tech',
    });
    expect(component.blogForm().valid()).toBe(true);
  });
});
