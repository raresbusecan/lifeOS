<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Space;

class SpaceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $spaces = $request->user()
            ->spaces()
            ->latest()
            ->get();

        return response()->json([
            'spaces' => $spaces,
        ]);
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request) {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
        ]);
        $space = $request->user()->spaces()->create($validated);
        return response()->json([
            'message' => 'Space created successfully.',
            'space' => $space,
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id) {
        $space = $request->user()
            ->spaces()
            ->findOrFail($id);
        return response()->json([
            'space' => $space,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id) {
        $space = $request->user()
            ->spaces()
            ->findOrFail($id);
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'description' => ['sometimes', 'nullable', 'string'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:50'],
            'color' => ['sometimes', 'nullable', 'string', 'max:20'],
        ]);
        $space->update($validated);
        return response()->json([
            'message' => 'Space updated successfully.',
            'space' => $space->fresh(),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id) {
        $space = $request->user()
            ->spaces()
            ->findOrFail($id);
        $space->delete();
        return response()->json([
            'message' => 'Space deleted successfully.',
        ]);
    }
}
