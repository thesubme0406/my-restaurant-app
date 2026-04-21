<?php

use App\Http\Controllers\QueueDashboardController;
use App\Http\Middleware\EnsureStaffIsManager;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    if (Auth::guard('staff')->check()) {
        $staff = Auth::guard('staff')->user();

        return $staff->role === 'manager'
            ? redirect()->route('admin.dashboard')
            : redirect()->route('staff.dashboard');
    }

    if (Auth::guard('customer')->check()) {
        return redirect()->route('customer.dashboard');
    }

    return redirect()->route('login');
})->middleware(['auth:staff,customer'])->name('dashboard');

Route::middleware(['auth:staff'])->prefix('queue-dashboard')->name('queue-dashboard.')->group(function () {
    Route::post('/queues', [QueueDashboardController::class, 'storeQueue'])->name('queues.store');
    Route::post('/queues/{booking}/skip', [QueueDashboardController::class, 'skipQueue'])->name('queues.skip');
    Route::post('/queues/{booking}/cancel', [QueueDashboardController::class, 'cancelQueue'])->name('queues.cancel');
    Route::post('/tables/{table}/status', [QueueDashboardController::class, 'updateTableStatus'])->name('tables.status');
    Route::post('/assignments', [QueueDashboardController::class, 'assignBookingToTable'])->name('assignments.store');
});

Route::middleware(['auth:customer'])->prefix('customer')->name('customer.')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Customer/Dashboard');
    })->name('dashboard');
});

Route::middleware(['auth:staff'])->prefix('staff')->name('staff.')->group(function () {
    Route::get('/dashboard', [QueueDashboardController::class, 'index'])->name('dashboard');

    Route::get('/test', function () {
        return Inertia::render('Admin/Test');
    })->name('test');

    Route::get('/inventory', function () {
        return Inertia::render('Admin/Inventory');
    })->name('inventory');

    Route::get('/purchase', function () {
        return Inertia::render('Admin/Purchase');
    })->name('purchase');

    Route::get('/import', function () {
        return Inertia::render('Admin/Import');
    })->name('import');

    Route::get('/payments', function () {
        return Inertia::render('Admin/Payments');
    })->name('payments');
});

Route::middleware(['auth:staff', EnsureStaffIsManager::class])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/test', function () {
        return Inertia::render('Admin/Test');
    })->name('test');

    Route::get('/dashboard', [QueueDashboardController::class, 'index'])->name('dashboard');

    Route::get('/basic-info', function () {
        return Inertia::render('Admin/BasicInfo');
    })->name('basic-info');

    Route::get('/inventory', function () {
        return Inertia::render('Admin/Inventory');
    })->name('inventory');

    Route::get('/purchase', function () {
        return Inertia::render('Admin/Purchase');
    })->name('purchase');

    Route::get('/import', function () {
        return Inertia::render('Admin/Import');
    })->name('import');

    Route::get('/payments', function () {
        return Inertia::render('Admin/Payments');
    })->name('payments');

    Route::get('/reports', function () {
        return Inertia::render('Admin/Reports');
    })->name('reports');
});

require __DIR__.'/auth.php';
