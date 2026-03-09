<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    public function index()
    {
        return response()->json(Unit::orderBy('sort_order')->get());
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:50']);
        $unit = Unit::create([
            'name' => $request->name,
            'sort_order' => Unit::max('sort_order') + 1,
        ]);
        return response()->json($unit, 201);
    }

    public function update(Request $request, Unit $unit)
    {
        $request->validate(['name' => 'required|string|max:50']);
        $unit->update(['name' => $request->name]);
        return response()->json($unit);
    }

    public function destroy(Unit $unit)
    {
        $unit->delete();
        return response()->json(null, 204);
    }
}
