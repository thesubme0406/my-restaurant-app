<?php

use App\Http\Controllers\Admin\BuffetTierController;
use App\Http\Controllers\Admin\BuffetTierMenuController;
use App\Http\Controllers\Admin\IngredientController;
use App\Http\Controllers\Admin\MasterDataController;
use App\Http\Controllers\Admin\MenuCatgController;
use App\Http\Controllers\Admin\MenuController;
use App\Http\Controllers\Admin\NewsController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\PurchaseController;
use App\Http\Controllers\Admin\QueueBoardController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\StockInController;
use App\Http\Controllers\Admin\StockUsageController;
use App\Http\Controllers\Admin\SupplierController;
use App\Http\Controllers\Admin\TableController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\Customer\CustomerAboutController;
use App\Http\Controllers\Customer\CustomerContactController;
use App\Http\Controllers\Customer\CustomerHomeController;
use App\Http\Controllers\Customer\CustomerMenuController;
use App\Http\Controllers\Customer\CustomerNewsController;
use App\Http\Controllers\Customer\CustomerProfileController;
use App\Http\Controllers\Customer\ReserveController;
use App\Http\Controllers\QueueDashboardController;
use App\Http\Controllers\StaffLookupController;
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
    Route::get('/directory/staff-by-phone', StaffLookupController::class)->name('directory.staff-by-phone');
    Route::get('/bookings/lookup-customer-by-phone', [BookingController::class, 'lookupCustomerByPhone'])
        ->name('bookings.lookup-customer-by-phone');
    Route::post('/queues', [QueueDashboardController::class, 'storeQueue'])->name('queues.store');
    Route::post('/queues/{booking}/call', [QueueDashboardController::class, 'callQueue'])->name('queues.call');
    Route::post('/queues/{booking}/skip', [QueueDashboardController::class, 'skipQueue'])->name('queues.skip');
    Route::post('/queues/{booking}/cancel', [QueueDashboardController::class, 'cancelQueue'])->name('queues.cancel');
    Route::post('/tables/{table}/status', [QueueDashboardController::class, 'updateTableStatus'])->name('tables.status');
    Route::post('/assignments', [QueueDashboardController::class, 'assignBookingToTable'])->name('assignments.store');
});

Route::prefix('customer')->name('customer.')->group(function () {
    Route::get('/home', CustomerHomeController::class)->name('home');
    Route::get('/menu', [CustomerMenuController::class, 'index'])->name('menu');

    Route::middleware(['auth:customer'])->group(function () {
        Route::get('/reserve', [ReserveController::class, 'index'])->name('reserve');
        Route::get('/reserve/stats', [ReserveController::class, 'stats'])->name('reserve.stats');
        Route::post('/reserve', [BookingController::class, 'store'])->name('reserve.store');
        Route::patch('/reserve/{booking}/cancel', [BookingController::class, 'cancel'])->name('reserve.cancel');
        Route::get('/reserve/new', function () {
            return redirect()->route('customer.reserve');
        })->name('reserve.new');

        Route::get('/profile', [CustomerProfileController::class, 'edit'])->name('profile');
        Route::patch('/profile', [CustomerProfileController::class, 'update'])->name('profile.update');

        Route::get('/dashboard', CustomerHomeController::class)->name('dashboard');
    });

    Route::get('/news', [CustomerNewsController::class, 'index'])->name('news');
    Route::get('/news/api/published', [CustomerNewsController::class, 'publishedApi'])->name('news.published-api');

    Route::get('/contact', CustomerContactController::class)->name('contact');

    Route::get('/about', CustomerAboutController::class)->name('about');
});

Route::get('/menu', fn () => redirect()->route('customer.menu'));
Route::get('/home', fn () => redirect()->route('customer.home'));
Route::get('/news', fn () => redirect()->route('customer.news'));
Route::get('/contact', fn () => redirect()->route('customer.contact'));
Route::get('/about', fn () => redirect()->route('customer.about'));
Route::middleware(['auth:customer'])->get('/reserve', fn () => redirect()->route('customer.reserve'));
Route::middleware(['auth:customer'])->get('/profile', fn () => redirect()->route('customer.profile'));

Route::middleware(['auth:staff'])->prefix('staff')->name('staff.')->group(function () {
    Route::get('/dashboard', [QueueDashboardController::class, 'index'])->name('dashboard');

    Route::get('/test', function () {
        return Inertia::render('Admin/Test');
    })->name('test');

    Route::get('/inventory', [StockUsageController::class, 'index'])->name('inventory');
    Route::post('/inventory', [StockUsageController::class, 'store'])->name('inventory.store');
    Route::patch('/inventory/{usageDetail}', [StockUsageController::class, 'update'])->name('inventory.update');
    Route::delete('/inventory/{usageDetail}', [StockUsageController::class, 'destroy'])->name('inventory.destroy');

    Route::get('/purchase', [PurchaseController::class, 'index'])->name('purchase');
    Route::post('/purchase', [PurchaseController::class, 'store'])->name('purchase.store');

    Route::get('/import', [StockInController::class, 'index'])->name('import');
    Route::post('/import', [StockInController::class, 'store'])->name('import.store');

    Route::get('/profile', [ProfileController::class, 'index'])->name('profile');
    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth:staff', EnsureStaffIsManager::class])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/test', function () {
        return Inertia::render('Admin/Test');
    })->name('test');

    Route::get('/dashboard', [QueueDashboardController::class, 'index'])->name('dashboard');

    Route::get('/master-data', MasterDataController::class)->name('master-data');
    Route::get('/basic-info', fn () => redirect()->route('admin.master-data'))->name('basic-info');
    Route::get('/profile', [ProfileController::class, 'index'])->name('profile');
    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::post('/staff', [StaffController::class, 'store'])->name('staff.store');
    Route::patch('/staff/{staff}', [StaffController::class, 'update'])->name('staff.update');
    Route::delete('/staff/{staff}', [StaffController::class, 'destroy'])->name('staff.destroy');

    Route::post('/buffet-tiers', [BuffetTierController::class, 'store'])->name('buffet-tiers.store');
    /* POST + multipart is reliable for file fields; PATCH multipart can drop fields on some stacks. */
    Route::match(['patch', 'post'], '/buffet-tiers/{buffetTier}', [BuffetTierController::class, 'update'])->name('buffet-tiers.update');
    Route::delete('/buffet-tiers/{buffetTier}', [BuffetTierController::class, 'destroy'])->name('buffet-tiers.destroy');
    Route::get('/buffet-tiers/{buffetTier}/menus', [BuffetTierMenuController::class, 'menuIds'])->name('buffet-tier-menus.show');
    Route::put('/buffet-tiers/{buffetTier}/menus', [BuffetTierMenuController::class, 'sync'])->name('buffet-tier-menus.sync');

    Route::post('/menus', [MenuController::class, 'store'])->name('menus.store');
    Route::match(['patch', 'post'], '/menus/{menu}', [MenuController::class, 'update'])->name('menus.update');
    Route::delete('/menus/{menu}', [MenuController::class, 'destroy'])->name('menus.destroy');

    Route::post('/menu-categories', [MenuCatgController::class, 'store'])->name('menu-categories.store');
    Route::match(['patch', 'post'], '/menu-categories/{menuCatg}', [MenuCatgController::class, 'update'])->name('menu-categories.update');
    Route::delete('/menu-categories/{menuCatg}', [MenuCatgController::class, 'destroy'])->name('menu-categories.destroy');

    Route::post('/tables', [TableController::class, 'store'])->name('tables.store');
    Route::patch('/tables/{table}', [TableController::class, 'update'])->name('tables.update');
    Route::delete('/tables/{table}', [TableController::class, 'destroy'])->name('tables.destroy');
    Route::post('/news', [NewsController::class, 'store'])->name('news.store');
    Route::match(['patch', 'post'], '/news/{news}', [NewsController::class, 'update'])->name('news.update');
    Route::delete('/news/{news}', [NewsController::class, 'destroy'])->name('news.destroy');
    Route::post('/ingredients', [IngredientController::class, 'store'])->name('ingredients.store');
    Route::patch('/ingredients/{ingredient}', [IngredientController::class, 'update'])->name('ingredients.update');
    Route::delete('/ingredients/{ingredient}', [IngredientController::class, 'destroy'])->name('ingredients.destroy');
    Route::post('/suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
    Route::patch('/suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
    Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');

    Route::get('/inventory', [StockUsageController::class, 'index'])->name('inventory');
    Route::post('/inventory', [StockUsageController::class, 'store'])->name('inventory.store');
    Route::patch('/inventory/{usageDetail}', [StockUsageController::class, 'update'])->name('inventory.update');
    Route::delete('/inventory/{usageDetail}', [StockUsageController::class, 'destroy'])->name('inventory.destroy');

    Route::get('/purchase', [PurchaseController::class, 'index'])->name('purchase');
    Route::post('/purchase', [PurchaseController::class, 'store'])->name('purchase.store');

    Route::get('/import', [StockInController::class, 'index'])->name('import');
    Route::post('/import', [StockInController::class, 'store'])->name('import.store');

    Route::get('/payments', [PaymentController::class, 'index'])->name('payments');
    Route::post('/payments', [PaymentController::class, 'store'])->name('payments.store');
    Route::get('/payments/service-lookup', [PaymentController::class, 'lookupService'])->name('payments.lookup-service');
    Route::get('/payments/active-services', [PaymentController::class, 'getActiveServices'])->name('payments.active-services');
    Route::delete('/payments/{payment}', [PaymentController::class, 'destroy'])->name('payments.destroy');
    Route::post('/payments/{payment}/restore', [PaymentController::class, 'restore'])->name('payments.restore');
    Route::patch('/payments/{payment}/voided', [PaymentController::class, 'correctVoided'])->name('payments.correct-voided');

    Route::get('/reports', [ReportController::class, 'index'])->name('reports');
    Route::get('/reports/data', [ReportController::class, 'data'])->name('reports.data');
    Route::get('/queue-board', fn () => redirect()->route('queue-board.display'))->name('queue-board');
});

// ບອດຄິວໜ້າຮ້ານ — ໜ້າຈໍ TV (ບໍ່ຕ້ອງເຂົ້າລະບົບ)
Route::get('/queue-board', [QueueBoardController::class, 'display'])->name('queue-board.display');
Route::get('/queue-board/data', [QueueBoardController::class, 'data'])->name('queue-board.data');

require __DIR__.'/auth.php';
