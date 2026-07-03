<?php

namespace App\Contracts;

use Illuminate\Http\JsonResponse;

interface ApiResponseInterface
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
     */
    public function response(int $code, bool $status, string $message, array $data = [], array $meta = []): JsonResponse;
}
