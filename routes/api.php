<?php

use App\Http\Controllers\Api\V1\Admin\AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\AdminProjectController;
use App\Http\Controllers\Api\V1\Admin\AdminTaskController;
use App\Http\Controllers\Api\V1\Admin\AdminTaskTypeController;
use App\Http\Controllers\Api\V1\Admin\AdminAuditLogController;
use App\Http\Controllers\Api\V1\AssessmentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ProgressController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\TrainingController;
use App\Http\Controllers\Api\V1\TrainingProgramController;
use App\Http\Controllers\Api\V1\AcademyLearnerController;
use App\Http\Controllers\Api\V1\PracticeArenaController;
use App\Http\Controllers\Api\V1\LearnerAcademyProgressController;
use App\Http\Controllers\Api\V1\LearnerProfileController;
use App\Http\Controllers\Api\V1\IntegrityController;
use App\Http\Controllers\Api\V1\Admin\AdminAchievementController;
use App\Http\Controllers\Api\V1\Admin\AdminLearnerController;
use App\Http\Controllers\Api\V1\Admin\AdminPracticeChallengeController;
use App\Http\Controllers\Api\V1\Admin\AdminLessonController;
use App\Http\Controllers\Api\V1\Admin\AdminLessonQuizController;
use App\Http\Controllers\Api\V1\Admin\AdminVideoCheckpointController;
use App\Http\Controllers\Api\V1\Admin\AdminTrainingModuleController;
use App\Http\Controllers\Api\V1\Admin\AdminTrainingProgramController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        Route::get('/projects', [ProjectController::class, 'index']);
        Route::get('/projects/{project}', [ProjectController::class, 'show']);
        Route::get('/projects/{project}/lessons', [ProjectController::class, 'lessons']);

        Route::post('/training/sessions', [TrainingController::class, 'startSession']);
        Route::get('/training/next-task', [TrainingController::class, 'nextTask']);
        Route::post('/training/tasks/{taskVersion}/submit', [TrainingController::class, 'submit'])
            ->middleware('throttle:submissions');
        Route::get('/training/history', [TrainingController::class, 'history']);

        Route::get('/me/dashboard', [ProgressController::class, 'dashboard']);
        Route::get('/me/academy-dashboard', [LearnerAcademyProgressController::class, 'academyDashboard']);
        Route::get('/me/skills', [ProgressController::class, 'skills']);
        Route::get('/me/mistakes', [ProgressController::class, 'mistakes']);

        Route::get('/programs', [TrainingProgramController::class, 'index']);
        Route::get('/programs/{program}', [TrainingProgramController::class, 'show']);
        Route::get('/programs/{program}/progress', [TrainingProgramController::class, 'progress']);
        Route::post('/programs/{program}/enrol', [TrainingProgramController::class, 'enrol']);

        Route::get('/integrity/assessment', [IntegrityController::class, 'assessmentRules']);
        Route::get('/integrity/assessment/status', [IntegrityController::class, 'assessmentStatus']);
        Route::post('/integrity/assessment/acknowledge', [IntegrityController::class, 'acknowledgeAssessment']);

        Route::get('/me/profile', [LearnerProfileController::class, 'show']);
        Route::put('/me/profile', [LearnerProfileController::class, 'update']);
        Route::get('/academy-lessons/{lesson}', [TrainingProgramController::class, 'lesson']);
        Route::post('/academy-lessons/{lesson}/progress', [LearnerAcademyProgressController::class, 'updateLessonProgress']);
        Route::post('/checkpoints/{checkpoint}/submit', [LearnerAcademyProgressController::class, 'submitCheckpoint']);
        Route::post('/quizzes/{quiz}/submit', [LearnerAcademyProgressController::class, 'submitQuiz']);

        Route::get('/practice-arena/challenges', [PracticeArenaController::class, 'index']);
        Route::get('/practice-arena/challenges/{challenge}', [PracticeArenaController::class, 'show']);
        Route::post('/practice-arena/challenges/{challenge}/submit', [PracticeArenaController::class, 'submit'])
            ->middleware('throttle:submissions');

        Route::get('/my-academies', [AcademyLearnerController::class, 'index']);
        Route::post('/my-academies', [AcademyLearnerController::class, 'store']);
        Route::get('/my-academies/{academy}', [AcademyLearnerController::class, 'show']);
        Route::post('/my-academies/{academy}/documents', [AcademyLearnerController::class, 'uploadDocument'])
            ->middleware('throttle:10,1');
        Route::post('/my-academies/{academy}/generate', [AcademyLearnerController::class, 'generate'])
            ->middleware('throttle:5,1');
        Route::post('/my-academies/{academy}/publish', [AcademyLearnerController::class, 'publish']);
        Route::get('/my-academies/{academy}/curriculum', [AcademyLearnerController::class, 'curriculum']);

        Route::get('/assessments/current', [AssessmentController::class, 'current']);
        Route::post('/assessments', [AssessmentController::class, 'store']);
        Route::get('/assessments/{assessment}', [AssessmentController::class, 'show']);
        Route::post('/assessments/{assessment}/tasks/{taskVersion}/submit', [AssessmentController::class, 'submitTask'])
            ->middleware('throttle:submissions');
        Route::post('/assessments/{assessment}/finalize', [AssessmentController::class, 'finalize']);
        Route::get('/assessments/{assessment}/result', [AssessmentController::class, 'result']);

        Route::prefix('admin')->middleware('admin')->group(function () {
            Route::get('/dashboard', [AdminDashboardController::class, 'index']);
            Route::get('/learners', [AdminLearnerController::class, 'index']);
            Route::get('/learners/{user}', [AdminLearnerController::class, 'show']);
            Route::post('/learners/{user}/enrolments', [AdminLearnerController::class, 'enrol']);
            Route::get('/achievements', [AdminAchievementController::class, 'index']);
            Route::put('/achievements/{achievement}', [AdminAchievementController::class, 'update']);
            Route::get('/practice-challenges', [AdminPracticeChallengeController::class, 'index']);
            Route::post('/practice-challenges', [AdminPracticeChallengeController::class, 'store']);
            Route::put('/practice-challenges/{practiceChallenge}', [AdminPracticeChallengeController::class, 'update']);
            Route::get('/projects', [AdminProjectController::class, 'index']);
            Route::post('/projects', [AdminProjectController::class, 'store']);
            Route::get('/projects/{project}', [AdminProjectController::class, 'show']);
            Route::put('/projects/{project}', [AdminProjectController::class, 'update']);
            Route::get('/projects/{project}/task-types', [AdminTaskTypeController::class, 'index']);
            Route::post('/projects/{project}/task-types', [AdminTaskTypeController::class, 'store']);
            Route::put('/projects/{project}/task-types/{taskType}', [AdminTaskTypeController::class, 'update']);
            Route::get('/tasks', [AdminTaskController::class, 'index']);
            Route::post('/tasks', [AdminTaskController::class, 'store']);
            Route::get('/audit-logs', [AdminAuditLogController::class, 'index']);
            Route::get('/training-programs', [AdminTrainingProgramController::class, 'index']);
            Route::get('/training-programs/{trainingProgram}', [AdminTrainingProgramController::class, 'show']);
            Route::put('/training-programs/{trainingProgram}', [AdminTrainingProgramController::class, 'update']);
            Route::post('/training-programs/{trainingProgram}/modules', [AdminTrainingModuleController::class, 'store']);
            Route::put('/training-modules/{trainingModule}', [AdminTrainingModuleController::class, 'update']);
            Route::delete('/training-modules/{trainingModule}', [AdminTrainingModuleController::class, 'destroy']);
            Route::post('/training-modules/{trainingModule}/lessons', [AdminLessonController::class, 'store']);
            Route::get('/lessons/{lesson}', [AdminLessonController::class, 'show']);
            Route::put('/lessons/{lesson}', [AdminLessonController::class, 'update']);
            Route::delete('/lessons/{lesson}', [AdminLessonController::class, 'destroy']);
            Route::post('/lessons/{lesson}/checkpoints', [AdminVideoCheckpointController::class, 'store']);
            Route::put('/video-checkpoints/{videoCheckpoint}', [AdminVideoCheckpointController::class, 'update']);
            Route::delete('/video-checkpoints/{videoCheckpoint}', [AdminVideoCheckpointController::class, 'destroy']);
            Route::put('/lessons/{lesson}/quiz', [AdminLessonQuizController::class, 'upsert']);
            Route::post('/lesson-quizzes/{lessonQuiz}/questions', [AdminLessonQuizController::class, 'storeQuestion']);
            Route::put('/quiz-questions/{quizQuestion}', [AdminLessonQuizController::class, 'updateQuestion']);
            Route::delete('/quiz-questions/{quizQuestion}', [AdminLessonQuizController::class, 'destroyQuestion']);
            Route::delete('/learners/{user}/enrolments/{enrolment}', [AdminLearnerController::class, 'unenrol']);
        });
    });
});
