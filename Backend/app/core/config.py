"""Configuration de l'API, lue depuis l'environnement (page 11 §3)."""

from __future__ import annotations

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Réglages effectifs, injectés par variables d'environnement `EXAUCE_*`."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="EXAUCE_",
        extra="ignore",
    )

    env: str = "dev"
    secret_key: str = "dev-only-insecure-secret-change-me-0123456789"

    database_url: str = "postgresql+asyncpg://exauce:exauce@localhost:5432/exauce"
    database_pool_size: int = 10
    database_max_overflow: int = 20

    api_prefix: str = "/api/v1"

    public_base_url: str = "http://localhost:5173"
    api_public_base_url: str = "http://localhost:8000"
    cookie_domain: str = ""
    cors_origins: str = "http://localhost:5173,http://localhost:5174"

    default_lang: str = "fr"

    rate_limit_public_per_min: int = 60
    rate_limit_contact_per_10min: int = 5
    rate_limit_admin_per_min: int = 120

    session_idle_minutes: int = 60

    mailhog_host: str = "localhost"
    mailhog_port: int = 1025
    mail_from: str = "no-reply@exauceac.com"

    media_root: str = "./media"

    #: Chemin vers le contrat openapi.yaml ; vide = chemin par défaut (repo local).
    contract_path: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        """Origines CORS explicites — jamais de wildcard (page 09 §2)."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.env == "production"

    @field_validator("env")
    @classmethod
    def _known_env(cls, value: str) -> str:
        allowed = {"dev", "test", "staging", "production"}
        if value not in allowed:
            raise ValueError(f"EXAUCE_ENV doit valoir l'un de {sorted(allowed)}")
        return value


@lru_cache
def get_settings() -> Settings:
    """Instance unique de la configuration (cacheée par processus)."""
    return Settings()
