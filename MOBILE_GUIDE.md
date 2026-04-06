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

## 🧪 Cómo Probarla (Test Flow)
1. **Login**: Usa las mismas credenciales que en la Web.
2. **Rol Cliente**: Podrás ver tu viaje "En Curso" (In Progress) y ver al chófer moviéndose.
3. **Rol Chófer**: Podrás "Aceptar" viajes y "Iniciar/Finalizar" el trayecto, lo que actualizará la web automáticamente.

---

> [!TIP]
> Para generar una versión instalable (APK) para Android para pruebas:
> `flutter build apk --split-per-abi`
