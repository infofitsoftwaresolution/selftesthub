"""add_video_url

Revision ID: 007
Revises: 006
Create Date: 2026-03-23 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('quiz_attempts', sa.Column('video_url', sa.String(), nullable=True))


def downgrade():
    op.drop_column('quiz_attempts', 'video_url')
