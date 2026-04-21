<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerAboutController extends Controller
{
    public function __invoke(Request $request): Response
    {
        abort_if($request->user('customer') === null, 403);

        return Inertia::render('Customer/AboutPage');
    }
}
