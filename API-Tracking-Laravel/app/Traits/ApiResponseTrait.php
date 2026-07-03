<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    /**
     * Return a JSON response
     *
     * @param int $code HTTP status code
     * @param bool $status Operation status (true for success, false for failure)
     * @param string $message Response message
     * @param array $data Response data
     * @param array $meta Additional metadata
     * @return JsonResponse
     * This method constructs a standardized JSON response format
     */
    public function response(int $code, bool $status, string $message, array $data = [], array $meta = [] ): JsonResponse
    {
        return response()->json([
            'code' => $code,
            'status' => $status,
            'message' => $message,
            'data' => $data,
            'meta' => $meta
        ], $code);
    }
}
