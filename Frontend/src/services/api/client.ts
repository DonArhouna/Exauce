/**
 * Couche API isolée — point d'accès client.
 * Aujourd'hui : mocks. Demain : FastAPI derrière VITE_API_URL, sans refonte
 * (même signatures de fonctions, fetch réel au lieu du mock).
 */
export const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
