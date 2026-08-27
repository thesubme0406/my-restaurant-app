<?php

namespace App\Http\Controllers;

use App\Models\Staff;
use App\Support\PhoneNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffLookupController extends Controller
{
    // ຄົ້ນຫາພະນັກງານຕາມເບີ → JSON ໃຫ້ຟອມເຕີມຊື່
    public function __invoke(Request $request): JsonResponse
    {
        $phone = PhoneNumber::digits((string) $request->query('phone', ''));

        if (! PhoneNumber::isValid($phone)) {
            return response()->json([
                'matched' => false,
                'name' => null,
                'surname' => null,
            ]);
        }

        $staff = Staff::query()->where('phone', $phone)->first();

        if ($staff === null) {
            return response()->json([
                'matched' => false,
                'name' => null,
                'surname' => null,
            ]);
        }

        return response()->json([
            'matched' => true,
            'name' => $staff->name,
            'surname' => $staff->surname,
        ]);
    }
}
