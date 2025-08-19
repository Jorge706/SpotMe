import { httpRequest } from '../../utils';
import { UserForm } from '../components/UserComponents';
import { openModal, closeModal } from './modalManager';
import { StatusModal } from '../components/StatusModal';

export function createUser(data, setData) {
    httpRequest({
        url: 'user-api/users',
        method: 'POST',
        useToken: true,
        body: data
    })
        .then((result) => {
            fetchUsers(setData);
            const msg = result.message;
            openModal( <StatusModal title="Usuario creado" msg={msg} onClose={closeModal} isError={false} /> );
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal(<StatusModal title="Error al crear usuario" msg={msg} onClose={closeModal} />);
        });
}
export function fetchUsers(setData, setMeta, body) {
    httpRequest({ url: 'user-api/users', method: 'GET', useToken: true, params: body })
        .then((result) => {
            setData(Array.isArray(result.data) ? result.data : []);
            setMeta(result.meta);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal( <StatusModal title="Error al obtener usuarios" msg={msg} onClose={closeModal} />);
        });
}

export function fetchUserById(userId, setData, isDelete, setMeta, currentPage) {
    httpRequest({ url: `user-api/users/${userId}`, method: 'GET', useToken: true })
        .then((result) => {
            const user = result.data[0];
            openModal(<UserForm user={user} setData={setData} isEdit={true} isDelete={isDelete} onDelete={deleteUser} setMeta={setMeta} currentPage={currentPage} />);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal( <StatusModal title="Error al obtener usuario" msg={msg} onClose={closeModal} />);
        });
}

export function updateUser(userId, data, setData, setMeta, params) {
    httpRequest({
        url: `user-api/users/${userId}`,
        method: 'PATCH',
        useToken: true,
        body: data
    })
        .then((result) => {
            const msg = result.message;
            openModal(<StatusModal title="Usuario actualizado" msg={msg} onClose={closeModal} isError={false} />);
            fetchUsers(setData, setMeta, params);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal(
                <StatusModal title="Error al actualizar usuario" msg={msg} onClose={closeModal} />
            );
        });
}

export function deleteUser(userId, data, setData) {
    httpRequest({
        url: `user-api/users/${userId}`,
        method: 'DELETE',
        useToken: true,
        body: data
    })
        .then((result) => {
            const msg = result.message;
            openModal(<StatusModal title="Usuario eliminado" msg={msg} onClose={closeModal} isError={false} />);
            fetchUsers(setData);
        })
        .catch((error) => {
            const msg = JSON.parse(error.message).message;
            openModal(
                <StatusModal title="Error al eliminar usuario" msg={msg} onClose={closeModal} />
            );
        });
}