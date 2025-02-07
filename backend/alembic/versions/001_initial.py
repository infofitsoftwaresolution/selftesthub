"""initial

Revision ID: 001
Revises: 000
Create Date: 2024-02-05 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

revision = '001'
down_revision = '000'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create users table first
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_id', 'users', ['id'])

    # Then create quizzes table
    op.create_table(
        'quizzes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('duration', sa.Integer(), nullable=False),
        sa.Column('questions', JSON, nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_quizzes_id', 'quizzes', ['id'])
    op.create_index('ix_quizzes_title', 'quizzes', ['title'])

def downgrade() -> None:
    # Drop in reverse order
    op.drop_index('ix_quizzes_title')
    op.drop_index('ix_quizzes_id')
    op.drop_table('quizzes')
    op.drop_index('ix_users_email')
    op.drop_index('ix_users_id')
    op.drop_table('users') 