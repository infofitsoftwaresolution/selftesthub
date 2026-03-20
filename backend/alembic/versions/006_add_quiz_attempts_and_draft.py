"""add quiz drafts and attempts

Revision ID: 006
Revises: 005
Create Date: 2024-03-20

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add max_attempts
    op.add_column('quizzes', sa.Column('max_attempts', sa.Integer(), nullable=False, server_default='1'))
    # Add is_draft
    op.add_column('quizzes', sa.Column('is_draft', sa.Boolean(), nullable=False, server_default=sa.text('false')))

def downgrade() -> None:
    op.drop_column('quizzes', 'is_draft')
    op.drop_column('quizzes', 'max_attempts')
