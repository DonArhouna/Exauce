import { getCsrfToken } from './csrf';
import { mockRequest } from './mock/backend';
import { ApiError, fallbackProblem, isProblem } from './problem';
import type { Problem } from './types';

export type ApiMode = 'mock' | 'prism' | 'http';
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export const API_MODE: ApiMode = (import.meta.env.VITE_API_MODE ?? 'mock') as ApiMode;

const MUTATING: Method[] = ['POST', 'PUT', 'PATCH', 'DELETE'];

function baseUrl(): string {
  if (API_MODE === 'prism') return import.meta.env.VITE_PRISM_BASE_URL ?? 'http://localhost:4010';
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';
}

type UnauthorizedHandler = (problem: Problem) => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Enregistre le gestionnaire global des 401 (session expirée). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export interface ApiRequestOptions {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  /** Désactive la purge globale (bootstrap de session, login). */
  skipUnauthorizedHandler?: boolean;
}

function buildQuery(query?: ApiRequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {
    Accept: 'application/json, application/problem+json',
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (MUTATING.includes(method)) {
    const token = getCsrfToken();
    if (token) headers['X-CSRF-Token'] = token;
  }

  let response: { status: number; body: unknown; headers: Headers };

  try {
    if (API_MODE === 'mock') {
      const mock = await mockRequest({
        method,
        path,
        body: options.body,
        query: options.query ?? {},
        csrfToken: getCsrfToken(),
      });
      response = { status: mock.status, body: mock.body, headers: new Headers(mock.headers) };
    } else {
      const result = await fetch(`${baseUrl()}${path}${buildQuery(options.query)}`, {
        method,
        headers,
        credentials: 'include',
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal,
      });
      const text = await result.text();
      let parsed: unknown;
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
      }
      response = { status: result.status, body: parsed, headers: result.headers };
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(fallbackProblem(0), 0);
  }

  if (response.status === 401 && !options.skipUnauthorizedHandler) {
    const problem = isProblem(response.body)
      ? response.body
      : fallbackProblem(401, 'Session expirée');
    unauthorizedHandler?.(problem);
  }

  if (response.status < 200 || response.status >= 300) {
    const problem = isProblem(response.body)
      ? response.body
      : fallbackProblem(response.status);
    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;
    throw new ApiError(problem, response.status, Number.isFinite(retryAfter) ? retryAfter : undefined);
  }

  if (response.status === 204) return undefined as T;
  return response.body as T;
}
