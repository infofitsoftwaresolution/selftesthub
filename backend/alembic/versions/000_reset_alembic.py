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
    # Base migration - no-op starting point
    pass

def downgrade() -> None:
    pass 