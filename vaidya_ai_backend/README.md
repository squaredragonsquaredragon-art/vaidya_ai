# Vaidya AI Backend

This is the FastAPI backend for the Vaidya AI health assistant.

## Features
- **FastAPI**: Modern, high-performance web framework.
- **PostgreSQL**: Robust relational database.
- **OpenAI GPT-4**: Integrated for health assistance and medicine analysis.
- **Dockerized**: Easy setup with Docker and Docker Compose.

## Project Structure
- `app/`: Main application code.
  - `api/`: API endpoints (Auth, Chat, etc.).
  - `core/`: Configuration and settings.
  - `db/`: Database models and connection.
  - `services/`: Business logic and external services (LLM).
- `Dockerfile`: Container definition.
- `docker-compose.yml`: Services orchestration (App + Database).

## Setup & Running

1. **Prerequisites**: Ensure you have Docker and Docker Compose installed.
2. **Environment Variables**:
   - Copy `.env.example` to `.env`.
   - Add your `OPENAI_API_KEY` to the `.env` file.
3. **Launch**:
   ```bash
   docker-compose up --build
   ```

The API will be available at `http://localhost:8000`.
Swagger documentation: `http://localhost:8000/docs`.

## To-Do
- [ ] Implement proper JWT authentication.
- [ ] Add more comprehensive health assistant prompts.
- [ ] Connect the frontend to use these endpoints instead of mock data.
