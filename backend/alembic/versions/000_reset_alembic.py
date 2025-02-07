"""reset alembic

Revision ID: 000
Revises: 
Create Date: 2024-02-05 10:00:00.000000

"""
from alembic import op

revision = '000'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Drop and recreate alembic_version table
    op.execute('DROP TABLE IF EXISTS alembic_version')
    op.execute('CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)')
    op.execute("INSERT INTO alembic_version (version_num) VALUES ('000')")

def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS alembic_version') 