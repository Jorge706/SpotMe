import { useEffect } from "react";
import TabView from "../../components/TabView";
import GeoCerca from "./Geocerca";
import Table from "../../components/Table";
import pencilIcon from "../../assets/icons/pencil.png";
import cancelIcon from "../../assets/icons/cancel.png";
import WatchdogView from "../../components/WatchdogView";
function WatchdogTopView() {
    return (
        <TabView
            defaultTab="watchdog"
            tabs={[
                {
                key: "watchdog",
                label: "Watchdog",
                content: <WatchdogView />,
                },
                {
                key: "geocercas",
                label: "Geocercas",
                content: <GeoCerca />,
                },
                
        ]}
        />
    );
}

export default WatchdogTopView;