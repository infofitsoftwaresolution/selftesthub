"""create questions table

Revision ID: create_questions_table
Revises: <previous_revision_id>
Create Date: 2024-02-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic.
revision = 'create_questions_table'
down_revision = '<previous_revision_id>'  # Set this to your last migration
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('quiz_id', sa.Integer(), nullable=False),
        sa.Column('text', sa.String(), nullable=False),
        sa.Column('options', JSON, nullable=False),
        sa.Column('correctanswer', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_questions_id'), 'questions', ['id'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_questions_id'), table_name='questions')
    op.drop_table('questions') 