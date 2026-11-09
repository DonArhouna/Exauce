# Image Backend EXAUCE — FastAPI + Uvicorn
# Le build context est la racine du repo (cf. docker-compose.yml) afin de
# copier le contrat openapi.yaml, servi par /docs et vérifié en CI.

FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Utilisateur non-root (page 09 §6).
RUN addgroup --system app && adduser --system --ingroup app app

COPY Backend/pyproject.toml ./
COPY Backend/app ./app

# Dépendances applicatives uniquement (les dépendances dev restent hors image).
RUN pip install .

# Contrat de référence, monté/copié pour /docs et les tests de contrat.
COPY Analyse/modelisation/docs/openapi.yaml /app/contract/openapi.yaml
ENV EXAUCE_CONTRACT_PATH=/app/contract/openapi.yaml

USER app
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/api/v1/health').status==200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
