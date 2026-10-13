# Workbench0

**Practice smarter. Evaluate better.**

Workbench0 is an AI Response Evaluation training platform. Learners practice evaluating AI-generated responses, receive structured feedback, track recurring weaknesses, and measure readiness through simulated assessments.

## Requirements

- PHP 8.3+
- Composer
- Node.js 20+
- MySQL 8+ (SQLite supported for automated tests)

## Installation

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Configure your database in `.env`:

```env
DB_CONNECTION=mysql
DB_DATABASE=workbench0
```

Then:

```bash
php artisan migrate --seed
npm install
npm run build
```

## Running locally

Terminal 1:

```bash
php artisan serve
```

Terminal 2:

```bash
npm run dev
```

Visit `http://localhost:8000`

## Deploy demo (Vercel + Railway)

The React app can be hosted on **Vercel**; Laravel and the database run on **Railway** (or another PHP host). Step-by-step: [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md).

## Demonstration mode (partner-ready)

After `php artisan migrate --seed`, log in as **Demo Learner** and walk through:

1. **Dashboard** — level, XP, streak, continue learning (seeded in-progress lesson).
2. **Explore Academy** — three original programmes (Fundamentals, Comparative Evaluation, Rubric QC).
3. **Academy lesson** — narrated lesson + captions, checkpoint, knowledge-check quiz.
4. **Practice Arena** — Response Duel, Spot the Error, Rule Match, Scenario, Boss, Daily.
5. **Achievements** — criteria-based badges (earned through real actions only).
6. **Build My Academy** — upload `/samples/sample_evaluator_guidelines.txt` (fictional demo doc), generate curriculum with the **local provider** (no API key), review rules, publish.
7. **Project Practice / Assessment** — existing evaluation training for the linked project.

Sample guideline download: `/samples/sample_evaluator_guidelines.txt`

### Optional environment

```env
WORKBENCH_ACADEMY_PROVIDER=local
WORKBENCH_GUIDELINE_MAX_KB=10240
WORKBENCH_GUIDELINE_DISK=local
```

External AI curriculum providers can be wired later via `GuidelineAnalysisProvider` / `CurriculumGenerationProvider` (not required for demos).

## Demo credentials (local development only)

| Role | Email | Password |
|------|-------|----------|
| Learner | learner@workbench0.local | password |
| Admin | admin@workbench0.local | password |

## Testing

```bash
php artisan test
npm run build
```

## Architecture

- **Backend:** Laravel 13 modular monolith
- **Frontend:** React SPA + Bootstrap 5 + Vite
- **Auth:** Laravel Sanctum (API tokens)
- **Evaluation:** `EvaluationEngineInterface` with `LocalEvaluationEngine` (deterministic). Swap to OpenAI later via `AI_EVALUATION_DRIVER=openai`
- **Academy:** Explore programmes, Practice Arena games, XP/achievements, Build My Academy (local guideline analysis + curriculum generation)

### Evaluation flow

```
Submission → EvaluationEngineInterface → EvaluationResult
    → Skill progress + Mistake tracking → Adaptive next task
```

### API

All endpoints are under `/api/v1/`. See `routes/api.php`.

Health check: `GET /health`

## Configuration

See `config/workbench.php` for readiness thresholds, assessment defaults, and evaluation driver settings.

### Security

- API rate limiting (120 req/min authenticated, submission endpoints throttled separately)
- Security headers on all responses (`X-Content-Type-Options`, `X-Frame-Options`, etc.)
- Laravel Policies for task submission and assessment access
- Task/session ownership validation before evaluation
- Registration can be disabled in production via `WORKBENCH_ALLOW_REGISTRATION=false`

## Adding content

Use the admin UI (`/admin`) or seeders in `database/seeders/` as examples for projects, tasks, rubrics, and lessons.

When editing tasks that already have submissions, create a new task version rather than mutating historical content.

## Future OpenAI integration

Implement `OpenAIEvaluationEngine` implementing `EvaluationEngineInterface`. Register it in `EvaluationServiceProvider` when `AI_EVALUATION_DRIVER=openai`. No changes required to React, controllers, or domain models.
