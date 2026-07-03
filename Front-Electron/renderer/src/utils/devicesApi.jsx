import { httpRequest } from '../../utils';
import { DeviceForm } from '../components/DeviceComponents';
import { openModal, closeModal } from './modalManager';
import { StatusModal } from '../components/StatusModal';

export function createdevice(data, setData) {
    httpRequest({
        url: 'user-api/devices',
        method: 'POST',
        useToken: true,
        body: data
    })
        .then((result) => {
            fetchDevices(setData);
            const msg = result.message;
            openModal( <StatusModal title="Dispositivo creado" msg={msg} onClose={closeModal} isError={false} /> );
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal(<StatusModal title="Error al crear dispositivo" msg={msg} onClose={closeModal} />);
        });
}
export function fetchDevices(setData, setMeta, body) {
    httpRequest({ url: 'user-api/devices', method: 'GET', useToken: true, params: body })
        .then((result) => {
            setData(Array.isArray(result.data) ? result.data : []);
            setMeta(result.meta);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal( <StatusModal title="Error al obtener dispositivos" msg={msg} onClose={closeModal} />);
        });
}

export function fetchdeviceById(deviceId, setData, isDelete) {
    httpRequest({ url: `user-api/devices/${deviceId}`, method: 'GET', useToken: true })
        .then((result) => {
            const device = result.data[0];
            openModal(<DeviceForm closeModal={closeModal} device={device} setData={setData} openModal={openModal} isEdit={true} isDelete={isDelete} onDelete={deletedevice} />);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal( <StatusModal title="Error al obtener dispositivo" msg={msg} onClose={closeModal} />);
        });
}

export function updatedevice(deviceId, data, setData) {
    httpRequest({
        url: `user-api/devices/${deviceId}`,
        method: 'PATCH',
        useToken: true,
        body: data
    })
        .then((result) => {
            const msg = result.message;
            openModal(<StatusModal title="Dispositivo actualizado" msg={msg} onClose={closeModal} isError={false} />);
            fetchDevices(setData);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal(
                <StatusModal title="Error al actualizar Dispositivo" msg={msg} onClose={closeModal} />
            );
        });
}

export function deletedevice(deviceId, data, setData) {
    httpRequest({
        url: `user-api/devices/${deviceId}`,
        method: 'DELETE',
        useToken: true,
        body: data
    })
        .then((result) => {
            const msg = result.message;
            openModal(<StatusModal title="Dispositivo eliminado" msg={msg} onClose={closeModal} isError={false} />);
            fetchDevices(setData);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal(
                <StatusModal title="Error al eliminar Dispositivo" msg={msg} onClose={closeModal} />
            );
        });
}