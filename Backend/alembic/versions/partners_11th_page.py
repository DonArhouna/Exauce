"""partners — 11e page (mission Frontend 2026-11-07)

Revision ID: partners_11th_page
Revises: 3f5b234f6ef3
Create Date: 2026-11-07

Cette migration est indépendante de la migration média (note
`conception-medias-images-videos.md`, non validée) : elle ne touche que la
nouvelle table `partners` et le registre `entity_translations`.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "partners_11th_page"
down_revision: Union[str, Sequence[str], None] = "3f5b234f6ef3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "partners",
        sa.Column("source_key", sa.String(length=60), nullable=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("logo_media_id", sa.UUID(), nullable=True),
        sa.Column("website_url", sa.String(length=500), nullable=True),
        sa.Column("position", sa.SmallInteger(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["logo_media_id"], ["medias.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "uq_partners_source_key",
        "partners",
        ["source_key"],
        unique=True,
        postgresql_where=sa.text("source_key IS NOT NULL"),
    )
    op.create_index("ix_partners_position", "partners", ["position"], unique=False)

    op.drop_constraint(
        "ck_entity_translations_entity_type", "entity_translations", type_="check"
    )
    op.create_check_constraint(
        "ck_entity_translations_entity_type",
        "entity_translations",
        "entity_type IN ('node', 'page', 'page_section', 'publication', 'category', "
        "'media', 'setting', 'interventiontype', 'sector', 'office', 'team_member', "
        "'partner')",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        "ck_entity_translations_entity_type", "entity_translations", type_="check"
    )
    op.create_check_constraint(
        "ck_entity_translations_entity_type",
        "entity_translations",
        "entity_type IN ('node', 'page', 'page_section', 'publication', 'category', "
        "'media', 'setting', 'interventiontype', 'sector', 'office', 'team_member')",
    )
    op.drop_index("ix_partners_position", table_name="partners")
    op.drop_index("uq_partners_source_key", table_name="partners")
    op.drop_table("partners")
