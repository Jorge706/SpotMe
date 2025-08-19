#include <HardwareSerial.h>
#include <SPI.h>
#include <SD.h>
#include <TinyGPSPlus.h> // Librería para las coordenadas.

#define SD_CS 5

HardwareSerial sim(1); // UART1
HardwareSerial gpsSerial(2); // UART2

const int SIM_RX = 25; // ESP32 <- SIM800L TX
const int SIM_TX = 26; // ESP32 -> SIM800L RX
const int GPS_RX = 16; // ESP32 -> SIM800L TX
const int GPS_TX = 17; // ESP32 <- SIM800L RX

// Instancia del GPS.
TinyGPSPlus gps;

const int BOTON_PIN = 33; // Pin del Boton
bool botonPresionado = false; // Estado del botón de pánico
bool alreadyResent = false;
String message = "Test desde ESP32 :D";
String device_serial = "ASD12345DL"; // Serial del dispositivo.
String mensajeJson = "";

// Temporizador para verificación de Red GSM.
unsigned long lastGsmCheck = 0;
const unsigned long gsmCheckInterval = 5000; // 5 Segundos.

// Estado de la Red GSM.
bool isGsmConnected = false;

void setup(){
  Serial.begin(115200);
  sim.begin(9600, SERIAL_8N1, SIM_RX, SIM_TX);
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  delay(3000);

  startGSM();
  delay(1000);
  startSD();

  pinMode(BOTON_PIN, INPUT_PULLUP);

  Serial.println("Sistema de alerta esperando accionarse.");
}

void loop(){
  // Leer GPS constantemente
  while(gpsSerial.available()){
    gps.encode(gpsSerial.read());
  }

  // Evento del botón de pánico.
  if (digitalRead(BOTON_PIN) == LOW && !botonPresionado){
    delay(50);
    botonPresionado = true;
    Serial.println("¡Ha ocurrido una alarma!");

    // GPS
    if(gps.location.isValid()){
      String dateTime = getDateTime(); // Método para obtener la fecha.
      float latitude = gps.location.lat(); // Obtener latitud.
      float longitude = gps.location.lng(); // Obtener longitud

      mensajeJson = "{\"device_serial\":\"" + device_serial +
                    "\",\"latitude\":" + String(latitude, 6) +
                    ",\"longitude\":" + String(longitude, 6) +
                    ",\"date_time\":\"" + dateTime + "\"}";
      
      Serial.println("Mensaje generado: " + mensajeJson);
    // ----
      if(isGsmConnected){
        if(!sms()){
          Serial.println("Red no disponible al momento del envio. Guardando en SD.");
          saveToSD("/exceptions.json", mensajeJson);
        } else {
          sendSMS(mensajeJson);
        }
      } else
      {
        saveToSD("/exceptions.json", mensajeJson);
      }
    } else {
      Serial.println("Esperando coordenadas GPS válidas...");
    }
  }

  if (digitalRead(BOTON_PIN) == HIGH && botonPresionado){
    botonPresionado = false;
  }

  // Verificar la Red GSM cada cierto tiempo.
  unsigned long currentMillis = millis();
  if(currentMillis - lastGsmCheck >= gsmCheckInterval){
    lastGsmCheck = currentMillis;

    isGsmConnected = sms(); // Solo se actualiza cada 5 segundos.

    // Reenviar datos cuando haya Red GSM.
    // Validar para reenviar eventos.
    if(isGsmConnected && !alreadyResent) {
      resendEventsFromSD();
      alreadyResent = true;
    }

    // Si se pierde la Red, se reasigna para guardar en SD y reenviar.
    if(!isGsmConnected){
      alreadyResent = false;
    }
  }

  // Loop del GSM
  while(sim.available()) {
    Serial.write(sim.read());
  }
}

// Método para iniciar memoria SD.
void startSD(){
  Serial.println("Inicializando SD...");
  delay(1000);
  if (!SD.begin(SD_CS)){
    Serial.println("No se pudo inicializar la tarjeta SD.");
    return;
  }
  Serial.println("Tarjeta SD inicializada correctamente nyaan");
}

// Método para iniciar la Red GSM.
void startGSM(){
  Serial.println("Inicializando Red GSM");
  sim.println("AT");
  delay(1000);
  sim.println("AT+CMGF=1");
  delay(1000);
  sim.println("AT+CSCS=\"GSM\"");
  delay(1000);
  sim.println("AT+CNMI=2,1,0,0,0");
  delay(1000);
}

// Validar estado de la Red GSM.
bool sms(){
  clearSIMBuffer();
  sim.println("AT+CREG?");
  delay(500);

  String response = "";

  unsigned long timeout = millis();
  while(millis() - timeout < 1000) {
    if(sim.available()) {
      response += (char)sim.read();
    }
  }

  Serial.println("Respuesta de AT+CREG: " + response);
  bool state = isConnectedToNetwork(response);
  return state;
}

// Método para validar el estado de la Red GSM.
bool isConnectedToNetwork(String cregResponse) {
  return cregResponse.indexOf("+CREG: 0,1") != -1 || cregResponse.indexOf("+CREG: 0,5") != -1;
}

// Método para enviar SMS.
void sendSMS(String message){
  /*
  clearSIMBuffer();
  sim.print("AT+CMGS=\"+52XXXXXXXXXX\"\r"); // <-- Reemplazar por el telefono al que se enviará el SMS.
  delay(2000);
  sim.print(message);
  delay(1000);
  sim.write(26);
  delay(5000);
  sim.println("SMS enviado (esperando)...");
  */
  clearSIMBuffer();
  Serial.println("Enviando comando AT+CMGS..."); // Debug
  sim.print("AT+CMGS=\"+52XXXXXXXXXX\"\r");
  delay(100);

  // Esperar a que aparezca el prompt '>' antes de enviar el mensaje.
  unsigned long timeout = millis();
  bool promptReceived = false;
  while(millis() - timeout < 5000){
    if(sim.available()){
      char c = sim.read();
      Serial.write(c);
      if (c == '>'){
        promptReceived = true;
        break;
      }
      if (c == 'E') break; // Nueva linea
    }
  }

  if(!promptReceived){
    Serial.println("Error no se recibió el prompt '>'");
    // Intentar reinicializar el módulo GSM por si se bloqueó
    startGSM(); // Debug
    delay(1000);

    /*
      NUEVAS LINEAS
    */
    clearSIMBuffer();
    sim.print("AT+CMGS=\"+52XXXXXXXXXX\"\r");
    delay(100);
    timeout = millis();
    while(millis() - timeout < 5000) {
      if(sim.available()) {
        char c = sim.read();
        Serial.write(c);
        if(c == '>'){
          promptReceived = true;
          break;
        }
      }
    }
    if(!promptReceived) {
      Serial.println("Segundo intento fallido. Abortando envío.");
      return;
    }
    // -------------
  }

  sim.print(message);
  sim.write(26);
  Serial.println("Mensaje enviado, esperando confirmación...");

  //delay(5000);
  // Debug
  timeout = millis();
  while(millis() - timeout < 5000){
    if(sim.available()) {
      char c = sim.read();
      Serial.write(c);
    }
  }
  // Debug
}

// Método para guardar datos en SD.
void saveToSD(String path, String content){
  File file = SD.open(path, FILE_APPEND);

  if(file){
    file.println(content);
    file.close();
    Serial.println("Dato guardado en SD.");
  } else {
    Serial.println("Error al guardar en SD.");
  }
}

void resendEventsFromSD(){
  // Validar que haya eventos pendientes para enviar.
  if(!SD.exists("/exceptions.json")){
    Serial.println("No hay eventos pendientes en SD.");
    return;
  }

  // Validar que se pueda abrir el archivo.
  File file = SD.open("/exceptions.json");
  if(!file) {
    Serial.println("No se puede abrir el archivo de eventos.");
    return;
  }

  // Reenviar eventos.
  Serial.println("Reenviando datos guardados...");
  /*
    NUEVAS LINEAS
  */
  String pending = "";
  bool allSent = true;
  // ---------
  // Debug
  while(file.available()) {
    if(!sms()){
      Serial.println("Red GSM caida durante el reenvio. Deteniendo proceso.");
      allSent = false;
      break;
    }

    String line = file.readStringUntil('\n');
    line.trim(); // Eliminar espacios o saltos extra.
    if(line.length() == 0) continue;

    Serial.println("Enviando: " + line);
    sendSMS(line);
    delay(5000); // Espera necesaria entre envíos.

    if(!sms()) {
      Serial.println("Envio fallido, guardando nuevamente");
      pending += line + "\n";
      allSent = false;
    }
  }

  // Proceso para reenviar eventos por SMS.
  //while (file.available()) {
    // Code
  //}

  // Cerrar archivo.
  file.close();

  // Eliminar archivo una vez que se envien todos los datos pendientes.
  //Serial.println("Todos los eventos fueron reenviados.");
  //SD.remove("/exceptions.json");

  if(allSent){
    Serial.println("Todos los eventos fueron reenviados.");
    SD.remove("/exceptions.json");
  } else {
    File newFile = SD.open("/exceptions.json", FILE_WRITE);
    if(newFile){
      newFile.print(pending);
      newFile.close();
      Serial.println("Eventos fallidos guardados para reintento");
    } else {
      Serial.println("No se pudo guardar los eventos fallidos.");
    }
  }
}

// Función para limiar el GSM.
void clearSIMBuffer(){
  while(sim.available()){
    sim.read();
  }
}

// Método para formatear a dos digitos la fecha.
String twoDigits(int number){
  if(number < 10) return "0" + String(number);
  return String(number);
}

// Método para obtener la Fecha de la coordenada.
String getDateTime(){
  if(gps.date.isValid() && gps.time.isValid()) { // Se valida que la fecha y tiempos de la coordenada.
    return String(gps.date.year()) + "-" +
           twoDigits(gps.date.month()) + "-" +
           twoDigits(gps.date.day()) + " " +
           twoDigits(gps.time.hour()) + ":" +
           twoDigits(gps.time.minute()) + ":" +
           twoDigits(gps.time.second());
  } else {
  return "2025-07-26 00:00:00";  // Fallback
  }
}