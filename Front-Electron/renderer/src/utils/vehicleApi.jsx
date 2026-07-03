import { httpRequest } from '../../utils';
import { VehicleForm } from '../components/VehicleComponents';
import { openModal, closeModal } from './modalManager';
import { StatusModal } from '../components/StatusModal';

export function createVehicle(data, setData) {
    httpRequest({
        url: 'user-api/vehicles',
        method: 'POST',
        useToken: true,
        body: data
    })
        .then((result) => {
            fetchVehicles(setData);
            const msg = result.message;
            openModal( <StatusModal title="Vehículo creado" msg={msg} onClose={closeModal} isError={false} /> );
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal(<StatusModal title="Error al crear vehículo" msg={msg} onClose={closeModal} />);
        });
}
export function fetchVehicles(setData, setMeta, params) {
    httpRequest({ url: 'user-api/vehicles', method: 'GET', useToken: true, params })
        .then((result) => {
            setData(Array.isArray(result.data) ? result.data : []);
            setMeta(result.meta);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal( <StatusModal title="Error al obtener vehículos" msg={msg} onClose={closeModal} />);
        });
}

export function fetchVehicleById(vehicleId, setData, isDelete, setMeta, currentPage) {
    httpRequest({ url: `user-api/vehicles/${vehicleId}`, method: 'GET', useToken: true })
        .then((result) => {
            const vehicle = result.data[0];
            openModal(<VehicleForm vehicle={vehicle} setData={setData} isEdit={true} isDelete={isDelete} onDelete={deleteVehicle} setMeta={setMeta} currentPage={currentPage} />);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal( <StatusModal title="Error al obtener vehículo" msg={msg} onClose={closeModal} />);
        });
}

export function updateVehicle(vehicleId, data, setData, setMeta, params) {
    httpRequest({
        url: `user-api/vehicles/${vehicleId}`,
        method: 'PATCH',
        useToken: true,
        body: data
    })
        .then((result) => {
            const msg = result.message;
            openModal(<StatusModal title="Vehículo actualizado" msg={msg} onClose={closeModal} isError={false} />);
            fetchVehicles(setData, setMeta, params);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal(
                <StatusModal title="Error al actualizar vehículo" msg={msg} onClose={closeModal} />
            );
        });
}

export function deleteVehicle(vehicleId, data, setData) {
    httpRequest({
        url: `user-api/vehicles/${vehicleId}`,
        method: 'DELETE',
        useToken: true,
        body: data
    })
        .then((result) => {
            const msg = result.message;
            openModal(<StatusModal title="Vehículo eliminado" msg={msg} onClose={closeModal} isError={false} />);
            fetchVehicles(setData);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal(
                <StatusModal title="Error al eliminar vehículo" msg={msg} onClose={closeModal} />
            );
        });
}