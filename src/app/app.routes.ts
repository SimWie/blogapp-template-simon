import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { BlogOverviewPage } from './feature/blog-overview/blog-overview-page';
import { BlogService } from './shared/blog-service/blog-service';
import { Blog } from './shared/blog-card/blog.model';

const blogResolver: ResolveFn<Blog | undefined> = (route) => {
  return inject(BlogService).getBlogByID(Number(route.paramMap.get('id')));
};

export const routes: Routes = [
  { path: '', component: BlogOverviewPage },
  {
    path: 'blog/:id',
    loadComponent: () => import('./feature/detail-page/detail-page').then((m) => m.DetailPage),
    resolve: { blog: blogResolver },
  },
  {
    path: 'about',
    loadComponent: () => import('./feature/about-page/about-page').then((m) => m.AboutPage),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./feature/not-found-page/not-found-page').then((m) => m.NotFoundPage),
  },
];
