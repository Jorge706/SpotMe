import { httpRequest } from '../../utils';
import { openModal, closeModal } from './modalManager';
import { StatusModal } from '../components/StatusModal';

export function fetchGeofences(setData, setMeta, body) {
    httpRequest({
        url: '/tracking-api/geofences/',
        method: 'GET',
        useToken: true,
        params: body,
    })
        .then((result) => {
            setData(Array.isArray(result.data) ? result.data : []);
            if (setMeta) {
                setMeta(result.meta);
            }
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal(
                <StatusModal
                    title="Error al obtener geocercas"
                    msg={msg}
                    onClose={closeModal}
                />
            );
        });
}

export function updateGeofence(id, data, onSuccess) {
    httpRequest({
        url: `/tracking-api/geofences/${id}`,
        method: 'PATCH',
        useToken: true,
        body: data,
    })
        .then((result) => {
            if (onSuccess) onSuccess(result);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal(
                <StatusModal
                    title="Error al actualizar geocerca"
                    msg={msg}
                    onClose={closeModal}
                />
            );
        });
}

export function createGeofence(data, onSuccess) {
    httpRequest({
        url: '/tracking-api/geofences/',
        method: 'POST',
        useToken: true,
        body: {
            device_id: data.device_id,
            name: data.name,
            latitude: data.latitude,
            longitude: data.longitude,
            radius: data.radius,
            is_active: true,
            'g-recaptcha-response': data['g-recaptcha-response'], 
        },
    })
    .then((result) => {
        if (onSuccess) onSuccess(result);
        openModal(
            <StatusModal
                title="Geocerca creada"
                msg="La geocerca se creó correctamente."
                onClose={closeModal}
            />
        );
    })
    .catch((error) => {
        let msg = "Error desconocido";
        try {
            msg = JSON.parse(error.message).message;
        } catch {
            msg = error.message || msg;
        }
        openModal(
            <StatusModal
                title="Error al crear geocerca"
                msg={msg}
                onClose={closeModal}
            />
        );
    });
}

export function deleteGeofence(id, onSuccess) {
    httpRequest({
        url: `/tracking-api/geofences/${id}`,
        method: 'DELETE',
        useToken: true,
    })
    .then((result) => {
        if (onSuccess) onSuccess(result);
        openModal(
            <StatusModal
                title="Geocerca eliminada"
                msg="La geocerca se eliminó correctamente."
                onClose={closeModal}
            />
        );
    })
    .catch((error) => {
        let msg = "Error desconocido";
        try {
            msg = JSON.parse(error.message).message;
        } catch {
            msg = error.message || msg;
        }
        openModal(
            <StatusModal
                title="Error al eliminar geocerca"
                msg={msg}
                onClose={closeModal}
            />
        );
    });
}
