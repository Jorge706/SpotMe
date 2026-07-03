import Pusher from 'pusher-js';

const pusher = new Pusher('088a0f626ff602402759', {
    cluster: 'us2',
    forceTLS: true,
});

export default pusher;