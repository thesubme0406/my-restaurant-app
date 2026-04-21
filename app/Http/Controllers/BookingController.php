<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    /**
     * Resolve a display name for a phone number from the latest matching booking
     * (by id) or the customers table. Bookings take precedence when a name exists
     * so the last-used spelling on file is shown first.
     */
    public function lookupCustomerByPhone(Request $request): JsonResponse
    {
        $raw = (string) $request->query('phone', '');
        $phone = preg_replace('/\D+/', '', $raw) ?? '';

        if (strlen($phone) < 8 || strlen($phone) > 15) {
            return response()->json([
                'name' => null,
                'matched' => false,
            ]);
        }

        $booking = Booking::query()
            ->where('phone', $phone)
            ->orderByDesc('id')
            ->with(['customer:id,name,phone'])
            ->first();

        $nameFromBooking = null;
        if ($booking !== null) {
            $rawName = $booking->customer_name ?: $booking->customer?->name;
            if (is_string($rawName)) {
                $trimmed = trim($rawName);
                $nameFromBooking = $trimmed !== '' ? $trimmed : null;
            }
        }

        $customer = Customer::query()->where('phone', $phone)->first();
        $nameFromCustomer = null;
        if ($customer !== null && is_string($customer->name)) {
            $trimmed = trim($customer->name);
            $nameFromCustomer = $trimmed !== '' ? $trimmed : null;
        }

        $name = $nameFromBooking ?? $nameFromCustomer;

        return response()->json([
            'name' => $name,
            'matched' => $name !== null,
        ]);
    }
}
