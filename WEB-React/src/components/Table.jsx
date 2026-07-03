function Table({ 
  headers = [], 
  data = [], 
  actions = [], 
  onRowClick = null, 
  onRowHover = null, 
  onRowLeave = null, 
  selectedIndex = null,
  hoveredIndex = null
}) {
    return (
        <div className="table-responsive">
        <table className="table table-bordered table-striped">
            <thead className="table-dark">
            <tr>
                {headers.map((header, index) => (
                <th key={index}>{header}</th>
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
                data.map((item, rowIndex) => {
                    const isSelected = selectedIndex === rowIndex;
                    const isHovered = hoveredIndex === rowIndex;
                    
                    let rowClasses = "";
                    if (onRowClick || onRowHover) rowClasses += "interactive ";
                    if (isSelected) rowClasses += "selected ";
                    if (isHovered) rowClasses += "hovered ";
                    
                    return (
                        <tr 
                            key={rowIndex}
                            onClick={() => onRowClick?.(rowIndex)}
                            onMouseEnter={() => onRowHover?.(rowIndex)}
                            onMouseLeave={() => onRowLeave?.()}
                            className={rowClasses.trim()}
                        >
                            {headers.map((header, colIndex) => (
                                <td key={colIndex}>{item?.[header] ?? "-"}</td>
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
                                            onClick={(e) => {
                                                e.stopPropagation(); // Evitar que el click se propague a la fila
                                                action.onClick?.(item);
                                            }}
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
                    );
                })
            )}
            </tbody>
        </table>
        </div>
    );
}


export default Table;
