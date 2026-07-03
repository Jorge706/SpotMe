import { useState } from "react";

function TabView({ tabs, defaultTab, renderExtraButton, children, onTabChange }) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].key);

    const handleTabClick = (tabKey) => {
        setActiveTab(tabKey);
        if (onTabChange) onTabChange(tabKey);
    };

    return (
        <>
            <div className="tab-buttons-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="tab-buttons-left" style={{ display: "flex", gap: "8px" }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabClick(tab.key)}
                            className={`tab-button ${activeTab === tab.key ? "active" : ""}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Render the custom button if provided */}
                {renderExtraButton && renderExtraButton(activeTab)}
            </div>

            {/* Tab content area */}
            <div className="tab-view">
                <div className="tab-content">
                    {tabs.find((tab) => tab.key === activeTab)?.content}
                </div>
                {children && <div className="tab-footer">{children}</div>}
            </div>
        </>
    );
}

export default TabView;
