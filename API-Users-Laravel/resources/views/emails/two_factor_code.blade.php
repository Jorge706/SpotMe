<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tu código de verificación</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 40px 20px;
            background-color: #f6f9fc;
            color: #32325d;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            padding: 40px 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header .icon {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .content {
            padding: 40px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 30px;
            color: #32325d;
        }
        .code-section {
            text-align: center;
            margin: 30px 0;
        }
        .code-label {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 15px;
        }
        .code-box {
            display: inline-block;
            background-color: #f8fafc;
            border: 2px dashed #007bff;
            border-radius: 8px;
            padding: 20px 40px;
            margin: 10px 0;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            color: #007bff;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
        }
        .client-info {
            background-color: #f8fafc;
            border-radius: 6px;
            padding: 20px;
            margin: 30px 0;
        }
        .client-info-title {
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
        }
        .client-info-value {
            color: #6b7280;
            font-size: 14px;
        }
        .verification-btn {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: background-color 0.2s;
        }
        .btn:hover {
            background-color: #0056b3;
        }
        .important-section {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
        }
        .important-title {
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
        }
        .important-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .important-list li {
            color: #6b7280;
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        .important-list li::before {
            content: '•';
            color: #007bff;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        .footer {
            background-color: #f8fafc;
            padding: 30px 40px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">🔐</div>
            <h1>Verificación en dos pasos</h1>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hola {{ $user ? $user->name : 'Usuario' }},
            </div>
            
            <div class="code-section">
                <div class="code-label">Tu código de verificación es:</div>
                <div class="code-box">
                    <div class="code">{{ $code }}</div>
                </div>
            </div>
            
            <div class="client-info">
                <div class="client-info-title">
                    🌐 Origen de la solicitud: {{ $clientName }}
                </div>
                <div class="client-info-value">
                    Esta solicitud proviene de {{ $clientName }}
                </div>
            </div>
            
            @if($verificationUrl)
            <div class="verification-btn">
                <p>Para mayor comodidad, puedes hacer clic en el siguiente botón para ir directamente a la pantalla de verificación:</p>
                <a href="{{ $verificationUrl }}" class="btn">Verificar Código</a>
            </div>
            @endif
            
            <div class="important-section">
                <div class="important-title">Importante:</div>
                <ul class="important-list">
                    <li>Este código expirará en 10 minutos</li>
                    <li>Si no solicitaste este código, ignora este email</li>
                    <li>Nunca compartas este código con nadie</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p>SpotMe - Sistema de Autenticación Segura</p>
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
        </div>
    </div>
</body>
</html>
