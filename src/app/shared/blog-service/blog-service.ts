import { inject, Injectable } from '@angular/core';
import { Blog, BlogContent, blogListSchema } from '../blog-card/blog.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { safeParse } from 'zod/mini';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private httpClient = inject(HttpClient);
  private apiUrl = environment.apiUrl + 'entries';

  async getAll(): Promise<Blog[]> {
    try {
      const response = await firstValueFrom(this.httpClient.get<BlogContent>(this.apiUrl));
      const result = safeParse(blogListSchema, response.data);

      if (!result.success) {
        console.error('Ungültige Blog-Daten vom Backend:', result.error);
        return [];
      }

      return result.data;
    } catch (error) {
      console.error('Fehler beim Laden der Blogs:', error);
      return [];
    }
  }

  async getByID(id: number): Promise<Blog> {
    try {
      return await firstValueFrom(this.httpClient.get<Blog>(`${this.apiUrl}/${id}`));
    } catch (error) {
      console.error(`Fehler beim Laden des Blogs ${id}:`, error);
      throw error;
    }
  }

  async createBlog(blog: Blog): Promise<Blog | null> {
    try {
      return await firstValueFrom(this.httpClient.post<Blog>(this.apiUrl, blog));
    } catch (error) {
      console.error('Fehler beim Erstellen des Blogs:', error);
      return null;
    }
  }

  async updateBlog(id: number, blog: Blog): Promise<Blog | null> {
    try {
      return await firstValueFrom(this.httpClient.put<Blog>(`${this.apiUrl}/${id}`, blog));
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Blogs ${id}:`, error);
      return null;
    }
  }

  async deleteBlog(id: number): Promise<boolean> {
    try {
      await firstValueFrom(this.httpClient.delete<void>(`${this.apiUrl}/${id}`));
      return true;
    } catch (error) {
      console.error(`Fehler beim Löschen des Blogs ${id}:`, error);
      return false;
    }
  }
}
