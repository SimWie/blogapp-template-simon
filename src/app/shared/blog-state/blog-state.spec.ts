import { TestBed } from '@angular/core/testing';

import { BlogStateService } from './blog-state';

describe('BlogStateService', () => {
  let service: BlogStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BlogStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
