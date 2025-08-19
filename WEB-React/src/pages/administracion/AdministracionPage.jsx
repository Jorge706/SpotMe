import { useEffect } from "react";
import TabView from "../../components/TabView";
import Table from "../../components/Table";
import Visualizacion from "./Visualizacion";
import pencilIcon from "../../assets/icons/pencil.png";
import cancelIcon from "../../assets/icons/cancel.png";
import EventsView from "../../components/EventsView";
import TripsView from "../../components/TripsView";
import WatchdogView from "../../components/WatchdogView";
function RenderTable() {
  const headers = ["inventory_id", "film_id", "store_id", "Última actualización"];

  const data = [
    {
      inventory_id: 1,
      film_id: 101,
      store_id: 5,
      "Última actualización": "2025-07-23 15:30",
    },
    {
      inventory_id: 2,
      film_id: 202,
      store_id: 3,
      "Última actualización": "2025-07-22 14:15",
    },
    {
      inventory_id: 3,
      film_id: 303,
      store_id: 1,
      "Última actualización": "2025-07-21 13:00",
    },
  ];

  const actions = [
    {
      label: "Editar",
      icon: pencilIcon,
      onClick: (item) => alert("Editar: " + JSON.stringify(item)),
    },
    {
      label: "Eliminar",
      icon: cancelIcon,
      onClick: (item) => alert("Eliminar: " + JSON.stringify(item)),
    },
  ];

  return <Table headers={headers} data={data} actions={actions} />;
}


function AdministracionTopView() {
  return (
    <TabView
      defaultTab="eventos"
      tabs={[
        {
          key: "eventos",
          label: "Eventos",
          content: 
          <>
            <EventsView />
          </>
          ,
        },
        {
          key: "viajes",
          label: "Historial de viajes",
          content: 
          <>
            <TripsView />
          </>,
        },
        {
          key: "visualizacion",
          label: "Visualización en Vivo",
          content: 
          <>
            <Visualizacion />
          </>,
        },
        {
          key: "watchdog",
          label: "Watchdog",
          content: 
          <>
            <WatchdogView />
          </>,
        },
      ]}
    />
  );
}

export default AdministracionTopView;