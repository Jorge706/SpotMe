function StatusModal({ title, msg, onClose, isError = true }) {
    return (
        <div className={`error-modal ${isError ? 'error' : 'success'}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2>{title}</h2>
            <p>{msg}</p>
            <button className="button button--modal" style={{ marginTop: 16 , width: '100%' }} onClick={onClose}>Aceptar</button>
        </div>
    );
}

export { StatusModal };