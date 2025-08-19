import { useState } from "react";

function TabView({ tabs, defaultTab }) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].key);

    return (
        <>
        <div className="tab-buttons-container">
            {tabs.map((tab) => (
            <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
            >
                {tab.label}
            </button>
            ))}
        </div>

        {/* Tab content area */}
        <div className="tab-view">
            <div className="tab-content">
            {tabs.find((tab) => tab.key === activeTab)?.content}
            </div>
        </div>
        </>
    );
}

export default TabView;
