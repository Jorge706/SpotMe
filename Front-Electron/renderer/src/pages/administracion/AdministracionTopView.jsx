import { registerModalHandlers } from "../../utils/modalManager";
import React,{ useEffect, useRef, useState } from "react";
import TabView from "../../components/TabView";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";

import pencilIcon from "../../assets/icons/pencil.png";
import cancelIcon from "../../assets/icons/cancel.png";
import addIcon from "../../assets/icons/add.png";
import { fetchUsers } from "../../utils/userApi.jsx";
import { fetchVehicles } from "../../utils/vehicleApi.jsx";
import { UserForm, UsersTable } from "../../components/UserComponents.jsx";
import { VehicleForm, VehiclesTable } from "../../components/VehicleComponents.jsx";
import { fetchAlarms } from "../../utils/alarmApi.jsx";
import { AlarmForm, AlarmsTable } from "../../components/AlarmComponents.jsx";
import { fetchDevices } from "../../utils/devicesApi.jsx";
import { DeviceForm, DevicesTable } from "../../components/DeviceComponents.jsx";

function AdministracionTopView() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState([]);
    const [activeTab, setActiveTab] = useState('usuarios');
    const [currentPage, setCurrentPage] = useState(1);

    const openModal = (content) => {
        setModalContent(content);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalContent(null);
    };

    useEffect(() => {
        registerModalHandlers(openModal, closeModal);
    }, []);

    useEffect(() => {
        if (activeTab === 'usuarios') {
            fetchUsers(setData, setMeta, { page: currentPage });

        } else if (activeTab === 'vehiculos') {
            fetchVehicles(setData, setMeta, { page: currentPage });
        } else if (activeTab === 'alarmas') {
            fetchAlarms(setData, setMeta, { page: currentPage });
        } else if (activeTab === 'dispositivos') {
            fetchDevices(setData, setMeta, { page: currentPage });
        }
    }, [activeTab, currentPage]);

    const handleCreateClick = (tabKey) => {
        const creationComponents = {
            usuarios: <UserForm setData={setData} isEdit={false} />,
            vehiculos: <VehicleForm setData={setData} isEdit={false} />,
            dispositivos: <DeviceForm setData={setData} isEdit={false} />,
            alarmas: <AlarmForm setData={setData} isEdit={false} />,
        };
        openModal(creationComponents[tabKey] || <p>Formulario no disponible.</p>);
    };

    // Handler para cambio de tab
    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        setCurrentPage(1); 
    };

    // Mapeo de tab a campo meta
    const metaKeyMap = {
        usuarios: 'users',
        vehiculos: 'vehicles',
        dispositivos: 'devices',
        alarmas: 'alarms',
    };
    const metaKey = metaKeyMap[activeTab] || activeTab;

    return (
        <>
            {isModalOpen && (
                <Modal onClose={closeModal}>
                    {modalContent}
                </Modal>
            )}

        <TabView
            defaultTab={activeTab}
            renderExtraButton={(tabKey) => (
                /* Boton verde "+ Agregar" que se muestra en cada tab */
                <button className="add-button" onClick={() => handleCreateClick(tabKey)}>
                    <img src={addIcon} alt="Agregar"/>
                    Agregar {tabKey}
                </button>
            )}
            tabs={[
                {
                    key: "usuarios",
                    label: "Usuarios",
                    content: (
                        <UsersTable setData={setData} data={data} setMeta={setMeta} currentPage={currentPage} />
                    ),
                },
                {
                    key: "vehiculos",
                    label: "Vehículos",
                    content: <VehiclesTable setData={setData} data={data} setMeta={setMeta} currentPage={currentPage} />,
                },
                {
                    key: "dispositivos",
                    label: "Dispositivos",
                    content: <DevicesTable setData={setData} data={data} setMeta={setMeta} currentPage={currentPage} />,
                },
                {
                    key: "alarmas",
                    label: "Alarmas",
                    content: <AlarmsTable setData={setData} data={data} setMeta={setMeta} currentPage={currentPage} />,
                },
            ]}
            onTabChange={handleTabChange}
        >
            <Pagination currentPage={currentPage} totalPages={meta.total_pages || 1} onPageChange={setCurrentPage} from={((currentPage - 1) * (meta.per_page || 1)) + 1} to={ Math.min( currentPage * (meta.per_page || 1), meta[`total_${metaKey}`] || meta.total || 0 )} total={meta[`total_${metaKey}`] || meta.total || 0} label={activeTab} />
        </TabView>
        </>
    );
};




export default AdministracionTopView;