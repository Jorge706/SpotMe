function Button({children, disabled = false, ...props}){
    return(
        <button className="button" disabled={disabled} {...props}>
            {children}
        </button>
    );
}

export default Button;