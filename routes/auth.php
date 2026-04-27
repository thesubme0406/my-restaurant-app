<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\CustomerRegistrationController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest:customer')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'createCustomer'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'storeCustomer']);

    Route::get('register', [CustomerRegistrationController::class, 'create'])
        ->name('register');

    Route::post('register', [CustomerRegistrationController::class, 'store']);
});

Route::prefix('admin')->middleware('guest:staff')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'createStaff'])
        ->name('admin.login');

    Route::post('login', [AuthenticatedSessionController::class, 'storeStaff'])
        ->name('admin.login.store');
});

Route::middleware('auth:staff,customer')->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
