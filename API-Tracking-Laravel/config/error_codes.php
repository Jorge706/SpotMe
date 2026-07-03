<?php

return [
    // ================================
    // CÓDIGOS DE ERROR DE AUTENTICACIÓN (EA)
    // ================================
    'EA0001' => 'Datos del usuario incorrectos.',
    'EA0002' => 'El código de verificación no es correcto.',
    'EA0003' => 'La contraseña no es segura, no cumple los requisitos.',
    'EA0004' => 'Las contraseñas no coinciden.',
    'EA0005' => 'No autorizado.',
    'EA0006' => 'Prohibido el acceso.',
    'EA0007' => 'Recurso no encontrado.',
    'EA0008' => 'El código de verificación ha expirado.',
    'EA0009' => 'La verificación de ReCaptcha no fue completada o aceptada.',

    // ================================
    // CÓDIGOS DE ERROR CRUD (ECD)
    // ================================
    'ECD001' => 'Este correo ya está en uso.',
    'ECD002' => 'Datos del Vehículo incorrectos.',
    'ECD003' => 'Nombre demasiado grande.',
    'ECD004' => 'Apellidos demasiado grandes.',
    'ECD005' => 'VIN demasiado grande.',
    'ECD006' => 'La información no pudo ser procesada.',
    'ECD007' => 'El Rol seleccionado no existe.',
    'ECD008' => 'La contraseña es demasiado grande.',
    'ECD009' => 'El usuario ya tiene el registro completo',

    // ================================
    // CÓDIGOS DE ERROR DE SISTEMA (ES)
    // ================================
    'ES0001' => 'Error interno, no se pudo completar la solicitud.',
    'ES0002' => 'No se pudo actualizar la información del usuario.',
    'ES0003' => 'Solicitud entendida, pero no pudo ser procesada por errores semánticos en los datos enviados.',
    'ES0004' => 'No se pudo procesar la petición.',

    // ================================
    // CÓDIGOS DE ERROR DE OBTENCIÓN DE DATOS (EGD)
    // ================================
    'EGD001' => 'No se pudo obtener la ubicación en tiempo real, verifica tus selecciones y vuelve a intentarlo.',
    'EGD002' => 'No se pudo obtener la ubicación histórica, verifica tus selecciones y vuelve a intentarlo.',
    'EGD003' => 'No se pudo obtener información del Watchdog, vuelve a intentarlo.',
    'EGD004' => 'No se pudo obtener información de los eventos del dispositivo, verifica tus selecciones y vuelve a intentarlo.',
    'EGD005' => 'No se pudo obtener tu información, vuelve a intentarlo más tarde.',
    'EGD006' => 'No se pudo obtener la información de los usuarios.',
    'EGD007' => 'No hay información que mostrar.',
    'EGD008' => 'No se encontró un usuario válido.',

    // ================================
    // CÓDIGOS DE ERROR DE DATOS VACÍOS (EMD)
    // ================================
    'EMD001' => 'No hay información que mostrar.',
    'EMD002' => 'No hay información en este periodo de consulta.',
    'EMD003' => 'No hay información del Watchdog del dispositivo.',

    // ================================
    // CÓDIGOS DE ERROR DE LECTURA DE DATOS (ERD)
    // ================================
    'ERD001' => 'Error en la lectura del código QR, vuelve a intentarlo.',

    // ================================
    // CÓDIGOS DE ERROR DE SUBIDA DE DATOS (EUD)
    // ================================
    'EUD001' => '¡No se pudo enviar la alerta! Verifica tu conexión a internet y vuelve a intentarlo.',
];
