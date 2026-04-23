<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'max:32'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws ValidationException
     */
    public function authenticate(string $guard): void
    {
        $this->ensureIsNotRateLimited($guard);
        $phone = $this->normalizedPhone();

        if (! Auth::guard($guard)->attempt(['phone' => $phone, 'password' => $this->string('password')->toString()], $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey($guard));

            throw ValidationException::withMessages([
                'phone' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey($guard));
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(string $guard): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey($guard), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey($guard));

        throw ValidationException::withMessages([
            'phone' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(string $guard): string
    {
        return Str::transliterate(Str::lower($guard).'|'.Str::lower($this->normalizedPhone()).'|'.$this->ip());
    }

    private function normalizedPhone(): string
    {
        return preg_replace('/\D+/', '', $this->string('phone')->toString()) ?? '';
    }
}
