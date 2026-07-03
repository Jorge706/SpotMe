import { httpRequest } from '../../utils';
import { AlarmForm } from '../components/AlarmComponents';
import { openModal, closeModal } from './modalManager';
import { StatusModal } from '../components/StatusModal';

export function createAlarm(data, setData) {
    httpRequest({
        url: 'user-api/alarms',
        method: 'POST',
        useToken: true,
        body: data
    })
        .then((result) => {
            fetchAlarms(setData);
            const msg = result.message;
            openModal( <StatusModal title="Alarma creado" msg={msg} onClose={closeModal} isError={false} /> );
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal(<StatusModal title="Error al crear alarma" msg={msg} onClose={closeModal} />);
        });
}
export function fetchAlarms(setData, setMeta, body) {
    httpRequest({ url: 'user-api/alarms', method: 'GET', useToken: true, params: body })
        .then((result) => {
            setData(Array.isArray(result.data) ? result.data : []);
            setMeta(result.meta);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal( <StatusModal title="Error al obtener alarmas" msg={msg} onClose={closeModal} />);
        });
}

export function fetchAlarmById(alarmId, setData, isDelete, setMeta, currentPage) {
    httpRequest({ url: `user-api/alarms/${alarmId}`, method: 'GET', useToken: true })
        .then((result) => {
            const alarm = result.data[0];
            openModal(<AlarmForm closeModal={closeModal} alarm={alarm} setData={setData} isEdit={true} isDelete={isDelete} onDelete={deleteAlarm} setMeta={setMeta} currentPage={currentPage} />);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal( <StatusModal title="Error al obtener alarma" msg={msg} onClose={closeModal} />);
        });
}

export function updateAlarm(alarmId, data, setData, setMeta, params) {
    httpRequest({
        url: `user-api/alarms/${alarmId}`,
        method: 'PATCH',
        useToken: true,
        body: data
    })
        .then((result) => {
            const msg = result.message;
            openModal(<StatusModal title="Alarma actualizado" msg={msg} onClose={closeModal} isError={false} />);
            fetchAlarms(setData, setMeta, params);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal(
                <StatusModal title="Error al actualizar alarma" msg={msg} onClose={closeModal} />
            );
        });
}

export function deleteAlarm(alarmId, data, setData) {
    httpRequest({
        url: `user-api/alarms/${alarmId}`,
        method: 'DELETE',
        useToken: true,
        body: data
    })
        .then((result) => {
            const msg = result.message;
            openModal(<StatusModal title="Alarma eliminado" msg={msg} onClose={closeModal} isError={false} />);
            fetchAlarms(setData);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal(
                <StatusModal title="Error al eliminar alarma" msg={msg} onClose={closeModal} />
            );
        });
}