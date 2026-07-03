import React, { createContext, useState, useContext } from "react";

const LoaderContext = createContext();

export function LoaderProvider({ children }) {
    const [loading, setLoading] = useState(false);
    return (
        <LoaderContext.Provider value={{ loading, setLoading }}>
            {children}
            {loading && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                    background: "rgba(255,255,255,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center"
                    }}>
                        <div style={{
                            width: 60,
                            height: 60,
                            border: "6px solid #1976d2",
                            borderTop: "6px solid #fff",
                            borderRadius: "50%",
                            animation: "spinLoader 1s linear infinite"
                        }} />
                        <div style={{ fontSize: "1.5rem", color: "#1976d2", marginTop: 20, fontWeight: "bold", letterSpacing: 2 }}>
                            Cargando...
                        </div>
                        <style>{`
                            @keyframes spinLoader {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                </div>
            )}
        </LoaderContext.Provider>
    );
}

export function useLoader() {
    return useContext(LoaderContext);
}
