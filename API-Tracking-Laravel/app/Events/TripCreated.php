<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class TripCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $trip;

    /**
     * Create a new event instance.
     */
    public function __construct($trip)
    {
        $this->trip = $trip;
        Log::info('Evento TripCreated lanzado', ['trip' => $trip]);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [new Channel('trips-device-' . $this->trip->device->serial_number)]; // Canal publico, luego cambiar a privado.
        // return [
        //     new PrivateChannel('trips'),
        // ];
    }

    public function broadcastAs(){
        return 'trip.created'; // Nombre del evento para front end
    }

    public function broadcastWith()
    {
        return [
            'trip' => [
                'serial_number' => $this->trip->device->serial_number,
                'latitude' => $this->trip->latitude,
                'longitude' => $this->trip->longitude,
                'date_time' => $this->trip->date_time,
            ]
        ];
    }
}