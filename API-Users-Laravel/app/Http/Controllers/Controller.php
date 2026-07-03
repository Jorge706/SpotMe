<?php

namespace App\Http\Controllers;

use App\Contracts\ApiResponseInterface;
use App\Traits\ApiResponseTrait;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

class Controller extends BaseController implements ApiResponseInterface
{
    use AuthorizesRequests, ValidatesRequests, ApiResponseTrait;
}
