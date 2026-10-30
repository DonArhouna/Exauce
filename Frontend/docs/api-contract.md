# Contrat API — FastAPI (à concevoir côté Backend)

Base : `VITE_API_URL` (défaut `http://localhost:8000/api`).
Toutes les réponses sont JSON UTF-8. Les textes FR/EN suivent la convention
`{ "fr": "...", "en": "..." }` déjà utilisée côté frontend
(`src/types/content.ts`).

## Références de types TypeScript

Voir `src/types/content.ts` : `LocalizedText`, `Publication`,
`PublicationCategory`, `Location`.

---

## GET /health
- Réponse : `200 { "ok": true }`

## GET /publications
- Query : `?category=<governance|audit|finance|hr|it|legal>&q=<recherche>&limit=6&offset=0&lang=fr|en`
- Réponse : `200 Publication[]`
```json
[
  {
    "id": "string (uuid)",
    "slug": "string — URL-safe, unique",
    "title": { "fr": "string", "en": "string" },
    "excerpt": { "fr": "string ≤ 320", "en": "string ≤ 320" },
    "body": [ { "fr": ["para", "…"], "en": ["para", "…"] } ]  // optionnel
    "category": "governance",
    "date": "2025-01-15",
    "author": "string | null",
    "image": { "src": "url", "alt": { "fr": "…", "en": "…" } } | null,
    "status": "draft | published"
  }
]
```
- Seuls les `status: "published"` sont servis au public.

## GET /publications/{slug}
- Réponse `200 Publication` ou `404 { "detail": "not_found" }`.

## POST /contact
- Requête :
```json
{
  "name": "string, 1..120",
  "email": "string (email)",
  "phone": "string, optionnel",
  "subject": "string, 1..160",
  "message": "string, 10..4000",
  "lang": "fr | en"
}
```
- Réponse `202 { "ok": true, "id": "string" }`
- Erreurs `422` validation (FastAPI/pydantic), `429` anti-abus.

## POST /auth/login
- Requête : `{ "username": string, "password": string }`
- Réponse `200 { "access_token": "…", "token_type": "bearer", "user": { "id", "name" } }`
- Erreur `401 { "detail": "bad_credentials" }`

## GET /me
- Header `Authorization: Bearer …`
- Réponse `200 { "id", "name", "email" }` / `401` non authentifié.

## GET /search
- Optionnel (le filtrage local actuel est un mock) : `?q=…&lang=fr|en`
- Réponse : `200 [{ "label": LocalizedText, "type": "service|page|publication", "href": "/fr/…" }]`

---

## Notes d'implémentation frontend
- `src/services/api/*.ts` contient des mocks avec les mêmes signatures :
  passer le corps des fonctions à `fetch(API_URL + path)` suffit.
- CORS : autoriser `http://localhost:5173` en dev, + domaine de prod.
- Aucune donnée réelle n'est envoyée tant que le backend n'existe pas
  (formulaires mockés).
