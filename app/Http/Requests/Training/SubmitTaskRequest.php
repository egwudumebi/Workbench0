<?php

namespace App\Http\Requests\Training;

use Illuminate\Foundation\Http\FormRequest;

class SubmitTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'decision' => ['required', 'string', 'max:100'],
            'explanation' => ['nullable', 'string', 'max:5000'],
            'training_session_id' => ['nullable', 'integer', 'exists:training_sessions,id'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function answer(): array
    {
        return [
            'decision' => $this->string('decision')->toString(),
            'explanation' => $this->string('explanation')->toString(),
        ];
    }
}
