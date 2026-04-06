# 📱 M&M Driver — Guía de Aplicación Móvil

Esta guía detalla cómo configurar, ejecutar y entender el ecosistema móvil de M&M Driver.

## 🛠️ Stack Tecnológico
- **Framework**: Flutter (v3.0+)
- **Lenguaje**: Dart
- **Estado**: Riverpod / Provider
- **Mapas**: Google Maps SDK (Mobile)
- **Real-time**: Socket.io / Firebase (Notificaciones)

---

## 🚀 Instalación y Ejecución

### 1. Requisitos Previos
Asegúrate de tener instalado:
- **Flutter SDK**: [Instalar Flutter](https://docs.flutter.dev/get-started/install)
- **Android Studio** (para Android) o **Xcode** (para iOS/Mac).

### 2. Configuración Inicial
Desde la terminal, entra a la carpeta del proyecto móvil:
```bash
cd mobile_client
flutter pub get
```

### 3. Configuración de API
Busca el archivo de configuración (usualmente en `lib/core/constants/api_constants.dart` o similar) y asegúrate de que apunte a la producción:
- **API URL**: `https://m-mdriver-production.up.railway.app/api/v1`

### 4. Ejecutar
Conecta tu teléfono o abre un emulador y ejecuta:
```bash
flutter run
```

---

## 🌐 Web vs 📱 Mobile: ¿Cuál es la diferencia?

| Característica | Landing Web | Aplicación Móvil |
| :--- | :--- | :--- |
| **Uso Principal** | Reservas rápidas y administración. | Seguimiento en tiempo real y seguridad. |
| **GPS** | Ubicación aproximada vía IP/Navegador. | **GPS de alta precisión** (Segundo a segundo). |
| **Notificaciones** | Solo si la pestaña está abierta. | **Notificaciones Push** nativas (incluso cerrada). |
| **Seguridad** | Registro de incidentes. | **Botón SOS físico** / Botón de pánico en pantalla. |
| **Chófer** | No recomendada para conducir. | **Interfaz de Navegación** activa para el chófer. |

---

## 🔐 Configuración de Secretos (Producción)

Para que la app sea funcional al 100%, debes configurar estas claves privadas que **no están en el código** por seguridad:

### 1. Google Maps (INDISPENSABLE)
Sin esto, los mapas saldrán vacíos.
- **Android**: Crea el archivo `mobile_client/android/local.properties` y añade:
  ```properties
  GOOGLE_MAPS_API_KEY=TU_CLAVE_AQUI
  ```
- **iOS**: Abre `mobile_client/ios/Runner/AppDelegate.swift` y pega tu clave en `GMSServices.provideAPIKey("TU_CLAVE_AQUI")`.

### 2. Firebase (Notificaciones Push)
- Ve a [Firebase Console](https://console.firebase.google.com/).
- Crea un proyecto y añade apps Android/iOS.
- Descarga `google-services.json` y ponlo en `mobile_client/android/app/`.
- Descarga `GoogleService-Info.plist` y ponlo en `mobile_client/ios/Runner/`.

### 3. Firma de Android (.jks)
Para generar el APK final que subirás a la web:
- Crea un archivo `mobile_client/android/key.properties` con la ruta a tu archivo `.jks` y contraseñas.

---

> [!TIP]
> Para generar una versión instalable (APK) para Android para tu web:
> `flutter build apk --release --split-per-abi`
