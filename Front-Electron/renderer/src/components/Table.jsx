function Table({ headers = [], data = [], actions = [] }) {
    return (
        <div className="table-responsive">
        <table className="table table-bordered table-striped">
            <thead className="table-dark">
            <tr>
                {headers.map((header, index) => (
                    <th key={index}>
                        {typeof header === "object" ? header.label : (header.charAt(0).toUpperCase() + header.slice(1))}
                    </th>
                ))}
                {actions.length > 0 && <th>Acciones</th>}
            </tr>
            </thead>
            <tbody>
            {data.length === 0 ? (
                <tr>
                <td
                    colSpan={headers.length + (actions.length > 0 ? 1 : 0)}
                    className="text-center"
                >
                    No hay datos disponibles.
                </td>
                </tr>
            ) : (
                data.map((item, rowIndex) => (
                <tr key={rowIndex}>
                    {headers.map((header, colIndex) => (
                        <td key={colIndex}>
                            {typeof header === "object" ? (item?.[header.key] ?? "-") : (item?.[header] ?? "-")}
                        </td>
                    ))}
                    {actions.length > 0 && (
                    <td>
                        {actions.map((action, actionIndex) => (
                        <button
                            key={actionIndex}
                            className={`icon-button ${
                            action.label === "Eliminar"
                                ? "accion-danger"
                                : "accion-editar"
                            }`}
                            onClick={() => action.onClick?.(item)}
                        >
                            <img
                            src={action.icon}
                            alt={action.label}
                            style={{ width: "18px", height: "18px" }}
                            />
                        </button>
                        ))}
                    </td>
                    )}
                </tr>
                ))
            )}
            </tbody>
        </table>
        </div>
    );
}


export default Table;
