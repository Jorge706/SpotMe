import { useEffect } from "react";
import TabView from "../../components/TabView";
import Table from "../../components/Table";
import pencilIcon from "../../assets/icons/pencil.png";
import cancelIcon from "../../assets/icons/cancel.png";

function LeafletMap() {
  useEffect(() => {
    const lat = 34.6777115;
    const lng = 135.4036376;

    const map = window.L.map("leaflet-map").setView([lat, lng], 13);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    window.L.marker([lat, lng])
      .addTo(map)
      .bindPopup("Ubicación actual")
      .openPopup();

    return () => {
      map.remove(); // limpia el mapa al desmontar el componente
    };
  }, []);

  return (
    <div
      id="leaflet-map"
      style={{ width: "100%", height: "400px", marginTop: "1rem" }}
    ></div>
  );
}



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
          <div>Aqui irian los eventos</div>
            <RenderTable />
          </>
          ,
        },
        {
          key: "viajes",
          label: "Historial de viajes",
          content: <div>Aqui iria el historial</div>,
        },
        {
          key: "visualizacion",
          label: "Visualización en Vivo",
          content: <LeafletMap />,
        },
        {
          key: "watchdog",
          label: "Watchdog",
          content: <div>Aqui se veria el watchdog</div>,
        },
      ]}
    />
  );
}

export default AdministracionTopView;
