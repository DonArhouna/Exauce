"""Le contrat `openapi.yaml` est la source de vérité (règle d'or du projet).

Ces tests verrouillent le fait que l'API publie exactement le contrat validé,
et que chaque route implémentée y figure.
"""

from __future__ import annotations

from typing import Any

import yaml
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import resolve_contract_path


def _contract() -> dict[str, Any]:
    path = resolve_contract_path(get_settings())
    with path.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def test_contract_file_exists_and_is_versioned() -> None:
    path = resolve_contract_path(get_settings())
    assert path.exists(), "Le contrat openapi.yaml doit accompagner le code."
    contract = _contract()
    assert contract["openapi"].startswith("3.1")
    assert contract["servers"][0]["url"] == "/api/v1"


def test_served_schema_is_the_contract(client: TestClient) -> None:
    """`/docs` et les tests de contrat lisent le fichier validé, pas un schema généré."""
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert response.json() == _contract()


def test_every_implemented_path_is_declared_in_the_contract(client: TestClient) -> None:
    """Aucune route opérationnelle ne peut exister hors contrat.

    Les chemins du contrat sont sans préfixe (`servers[0].url` = `/api/v1`) :
    on retire donc ce préfixe aux routes implémentées avant la comparaison.
    """
    contract_paths = set(_contract()["paths"])
    prefix = get_settings().api_prefix
    implemented = {
        route.path[len(prefix) :]  # noqa: E203 - découpe explicite du préfixe
        for route in client.app.routes
        if getattr(route, "path", "").startswith(prefix)
    }

    undeclared = implemented - contract_paths
    assert not undeclared, f"Routes absentes du contrat : {sorted(undeclared)}"


def test_contract_has_no_duplicate_operation_ids() -> None:
    operation_ids = [
        operation["operationId"]
        for operations in _contract()["paths"].values()
        for method, operation in operations.items()
        if method in {"get", "post", "put", "patch", "delete"}
    ]

    assert len(operation_ids) == len(set(operation_ids))
