<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\CustomerRegistrationController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest:staff,customer')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('register', [CustomerRegistrationController::class, 'create'])
        ->name('register');

    Route::post('register', [CustomerRegistrationController::class, 'store']);
});

Route::middleware('auth:staff,customer')->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
