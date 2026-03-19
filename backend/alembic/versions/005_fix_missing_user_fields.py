"""fix missing user fields

Revision ID: 005
Revises: 004
Create Date: 2024-03-19

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing is_superuser column
    op.add_column('users', sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    # Add missing profile_image column
    op.add_column('users', sa.Column('profile_image', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'profile_image')
    op.drop_column('users', 'is_superuser')
