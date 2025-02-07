"""add quiz attempts

Revision ID: 002
Revises: 001
Create Date: 2024-02-05 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'quiz_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('quiz_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('answers', JSON, nullable=True),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('is_completed', sa.Boolean(), default=False),
        sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_quiz_attempts_id', 'quiz_attempts', ['id'])

def downgrade() -> None:
    op.drop_index('ix_quiz_attempts_id')
    op.drop_table('quiz_attempts') 