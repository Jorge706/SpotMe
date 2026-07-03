import logo from '../assets/logo.png';
import carImage from '../assets/Car_Imagen.png';

function TwoSideContainer({children}){
    return(
        <div className="two-side-container">
        <div className="left-side">
          <img src={logo} alt="Logo de SpotMe" className="landing-logo"></img>
          <img src={carImage} alt="Imagen de un coche" className="car-image"></img>
        </div>

        <div className="right-side">
            {children}
        </div>
      </div>
    );
}

export default TwoSideContainer;