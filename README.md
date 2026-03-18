# InfoFit Score - Quiz Platform

A full-stack MCQ/Test quiz platform built with FastAPI, React, and PostgreSQL.

## Tech Stack
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Deployment**: Docker, Docker Compose, Nginx

## Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Git

### Installation
1. Clone the repository
   \`\`\`bash
   git clone <your-repo-url>
   cd infofitscore
   \`\`\`

2. Create environment file
   \`\`\`bash
   cp backend/.env.example backend/.env
   \`\`\`

3. Start with Docker Compose
   \`\`\`bash
   docker-compose up -d
   \`\`\`

4. Access the application
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/api/v1/docs

## Project Structure
- `/backend` - FastAPI application
- `/frontend` - React TypeScript application
- `/nginx` - Nginx configuration
- `/alembic` - Database migrations

## Environment Variables
See `.env.example` files in respective directories.

## License
[Your License]