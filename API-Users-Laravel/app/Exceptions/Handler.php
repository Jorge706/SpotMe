<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Helpers\ErrorCodeHelper;
use App\Traits\ApiResponseTrait;
use Throwable;

class Handler extends ExceptionHandler
{
    use ApiResponseTrait;
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param Request $request
     * @param Throwable $e
     * @return \Symfony\Component\HttpFoundation\Response
     *
     * @throws Throwable
     */
    public function render($request, Throwable $e)
    {
        //si es produccion no ejecutar esto  

        if (env('APP_ENV') === 'production') {

        if ($request->expectsJson() || $request->is(patterns: 'api/*')) {
            // Para errores HTTP específicos
            if ($this->isHttpException($e)) {
                $statusCode = $e->getStatusCode();
                // Para errores 400 (petición incorrecta)
                if ($statusCode === 400) {
                    return $this->response(
                        400,
                        false,
                        ErrorCodeHelper::getMessage('ES0004'),
                        [],
                        []
                    );
                }

                // Para errores 401 (no autorizado)
                if ($statusCode === 401) {
                    return $this->response(
                        401,
                        false,
                        ErrorCodeHelper::getMessage('EA0005'),
                        [],
                        []
                    );
                }

                // Para errores 403 (prohibido)
                if ($statusCode === 403) {
                    return $this->response(
                        403,
                        false,
                        ErrorCodeHelper::getMessage('EA0006'),
                        [],
                        []
                    );
                }

                // Para errores 404 (recurso no encontrado)
                if ($statusCode === 404) {
                    return $this->response(
                        404,
                        false,
                        ErrorCodeHelper::getMessage('EA0007'),
                        [],
                        []
                    );
                }

                // Para errores 500 (errores internos del servidor)
                if ($statusCode === 500) {
                    return $this->response(
                        401,
                        false,
                        ErrorCodeHelper::getMessage('EA0005'),
                        [],
                        []
                    );
                }
            }

            return $this->response(
                500,
                false,
                ErrorCodeHelper::getMessage('ES0001'),
                [],
                []
            );

        }
    }

        return parent::render($request, $e);
    }
}
