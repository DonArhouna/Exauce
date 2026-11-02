import { API_MODE, apiBaseUrl, apiRequest } from '../client';
import { getCsrfToken } from '../csrf';
import { ApiError, fallbackProblem, isProblem } from '../problem';
import type { MediaItem, MediaKind, MediaList } from '../types';

export interface MediaQuery {
  kind?: MediaKind;
  search?: string;
  limit?: number;
  offset?: number;
}

/** `GET /admin/media` — médiathèque paginée, filtres `kind` et recherche. */
export async function listMedia(query: MediaQuery = {}): Promise<MediaList> {
  return apiRequest<MediaList>('/admin/media', {
    query: {
      kind: query.kind,
      search: query.search,
      limit: query.limit ?? 24,
      offset: query.offset ?? 0,
    },
  });
}

/** `GET /admin/media/{id}` — métadonnées d'un média. */
export async function getMedia(id: string): Promise<MediaItem> {
  return apiRequest<MediaItem>(`/admin/media/${id}`);
}

/** `DELETE /admin/media/{id}` — refusé par le serveur si le média est référencé. */
export async function deleteMedia(id: string): Promise<void> {
  await apiRequest<void>(`/admin/media/${id}`, { method: 'DELETE' });
}

export interface UploadOptions {
  kind: MediaKind;
  /** Progression de 0 à 100, pour une barre de progression accessible. */
  onProgress?: (percent: number) => void;
}

/**
 * `POST /admin/media/upload` — téléversement d'un fichier unique.
 *
 * En mode `http`, la requête part en `multipart/form-data` via XHR : `fetch`
 * n'expose pas la progression d'envoi. Le mode `mock` simule la progression
 * avant d'appeler le routeur en mémoire.
 */
export async function uploadMedia(file: File, options: UploadOptions): Promise<MediaItem> {
  if (API_MODE === 'mock') {
    const report = options.onProgress ?? (() => {});
    report(10);
    await new Promise((resolve) => window.setTimeout(resolve, 20));
    report(55);
    const item = await apiRequest<MediaItem>('/admin/media/upload', {
      method: 'POST',
      body: {
        filename: file.name,
        mime: file.type,
        size_bytes: file.size,
        kind: options.kind,
      },
    });
    report(100);
    return item;
  }

  return uploadWithProgress(file, options);
}

function uploadWithProgress(file: File, options: UploadOptions): Promise<MediaItem> {
  return new Promise<MediaItem>((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('kind', options.kind);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${apiBaseUrl()}/admin/media/upload`);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Accept', 'application/json, application/problem+json');
    const csrf = getCsrfToken();
    if (csrf) xhr.setRequestHeader('X-CSRF-Token', csrf);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      options.onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onerror = () => reject(new ApiError(fallbackProblem(0), 0));
    xhr.onload = () => {
      let parsed: unknown;
      try {
        parsed = xhr.responseText ? JSON.parse(xhr.responseText) : undefined;
      } catch {
        parsed = xhr.responseText;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        options.onProgress?.(100);
        resolve(parsed as MediaItem);
        return;
      }
      const problem = isProblem(parsed) ? parsed : fallbackProblem(xhr.status);
      reject(new ApiError(problem, xhr.status));
    };

    xhr.send(form);
  });
}
