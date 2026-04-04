# Guía de Configuración — M&M Driver

Esta guía cubre todos los pasos necesarios para levantar el proyecto M&M Driver en un entorno local de desarrollo y prepararlo para producción.

---

## Prerrequisitos

Asegúrate de tener instalados los siguientes programas antes de continuar:

| Herramienta       | Versión mínima | Descarga                                         |
|-------------------|----------------|--------------------------------------------------|
| Node.js           | 20+            | https://nodejs.org                               |
| Flutter SDK       | 3.2+           | https://docs.flutter.dev/get-started/install     |
| Docker Desktop    | Última estable | https://www.docker.com/products/docker-desktop   |
| Git               | Cualquier      | https://git-scm.com                              |

Verifica las instalaciones:

```bash
node -v        # debe mostrar v20.x.x o superior
flutter --version
docker -v
git --version
```

---

## Paso 1: Clonar y configurar variables de entorno

```bash
git clone https://github.com/puntocero-dot/M-MDriver.git
cd M-MDriver
cp backend/.env.example backend/.env
```

Abre `backend/.env` con tu editor y completa las siguientes variables que **requieren configuración manual**:

### Seguridad y cifrado

```dotenv
# Genera con: openssl rand -hex 64
JWT_SECRET=

# Genera con: openssl rand -hex 32
MEDICAL_ENCRYPTION_KEY=
```

### Google Maps

```dotenv
# Obtén tu clave en: https://console.cloud.google.com → APIs & Services → Credentials
# Habilitar: Maps SDK for Android, Maps SDK for iOS, Directions API, Geocoding API
GOOGLE_MAPS_API_KEY=
```

### N1co (pasarela de pagos)

```dotenv
# Obtén desde el dashboard de N1co: https://dashboard.n1co.com
N1CO_API_KEY=
N1CO_MERCHANT_ID=
N1CO_WEBHOOK_SECRET=
```

### Plivo (SMS/llamadas)

```dotenv
# Obtén desde la consola de Plivo: https://console.plivo.com
PLIVO_AUTH_ID=
PLIVO_AUTH_TOKEN=
PLIVO_PHONE_NUMBER=
```

### Firebase (notificaciones push)

```dotenv
# Obtén desde Firebase Console → Configuración del proyecto → Cuentas de servicio
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

---

## Paso 2: Levantar infraestructura con Docker

Inicia solo los servicios de base de datos (postgres y redis):

```bash
docker-compose up -d postgres redis
```

Espera a que PostgreSQL esté listo antes de continuar. Puedes verificarlo con:

```bash
docker ps
# La columna STATUS debe mostrar: healthy
```

O bien:

```bash
docker exec mmdriver_postgres pg_isready -U postgres -d mmdriver
# Salida esperada: /var/run/postgresql:5432 - accepting connections
```

---

## Paso 3: Ejecutar migraciones de base de datos

Una vez que el contenedor de PostgreSQL esté saludable, aplica el esquema inicial:

```bash
docker exec -i mmdriver_postgres psql -U postgres -d mmdriver < database/migrations/001_initial_schema.sql
```

### Activar TimescaleDB (ejecutar UNA sola vez)

Conéctate a la base de datos:

```bash
docker exec -it mmdriver_postgres psql -U postgres -d mmdriver
```

Dentro del prompt de psql, ejecuta:

```sql
-- Activar extensión TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convertir la tabla de trazas GPS en una hipertabla
SELECT create_hypertable('gps_traces', 'time');

-- Comprimir datos con más de 7 días de antigüedad
SELECT add_compression_policy('gps_traces', INTERVAL '7 days');

-- Eliminar datos con más de 90 días de antigüedad
SELECT add_retention_policy('gps_traces', INTERVAL '90 days');
```

Sal del prompt con `\q`.

---

## Paso 4: Configurar precio inicial

Inserta la tarifa base de M&M Driver. Conéctate a la base de datos:

```bash
docker exec -it mmdriver_postgres psql -U postgres -d mmdriver
```

Ejecuta:

```sql
INSERT INTO pricing_config (
  name,
  base_fare,
  per_km_rate,
  per_minute_rate,
  per_stop_surcharge,
  wait_time_per_minute,
  minimum_fare,
  fuel_factor,
  company_vehicle_surcharge,
  is_active
) VALUES (
  'Tarifa Estándar M&M',
  5.00,
  0.85,
  0.25,
  2.00,
  0.20,
  12.00,
  1.05,
  8.00,
  true
);
```

Sal con `\q`.

---

## Paso 5: Ejecutar el backend

```bash
cd backend
npm install
npm run start:dev
```

Una vez iniciado:

- API REST disponible en: http://localhost:3000/api/v1
- Documentación Swagger en: http://localhost:3000/api/docs

---

## Paso 6: Ejecutar el admin

Abre una nueva terminal:

```bash
cd admin
npm install
npm run dev
```

Panel de administración disponible en: http://localhost:3001

---

## Paso 7: Configurar Flutter (app móvil)

### Android — agregar clave de Google Maps

Edita el archivo `mobile_client/android/app/src/main/AndroidManifest.xml` y agrega dentro del bloque `<application>`:

```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="TU_GOOGLE_MAPS_API_KEY"/>
```

### iOS — agregar clave de Google Maps

Edita `mobile_client/ios/Runner/AppDelegate.swift` y agrega antes de `return super.application(...)`:

```swift
GMSServices.provideAPIKey("TU_GOOGLE_MAPS_API_KEY")
```

### Instalar dependencias y generar código

```bash
cd mobile_client

# Instalar dependencias de Flutter
flutter pub get

# Generar modelos Freezed y serialización JSON
flutter pub run build_runner build --delete-conflicting-outputs
```

### Ejecutar la app

```bash
flutter run
```

O bien, abre la carpeta `mobile_client/` en Android Studio y ejecuta desde el IDE.

---

## Paso 8: Crear primer SUPERADMIN

Una vez que el backend esté corriendo, crea el usuario administrador inicial desde Swagger (http://localhost:3000/api/docs) o con curl:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mmdriver.com",
    "password": "YourSecurePassword123!",
    "firstName": "Admin",
    "lastName": "M&M",
    "phone": "+50371234567",
    "role": "SUPERADMIN"
  }'
```

> **IMPORTANTE DE SEGURIDAD:** Una vez creado el primer superadmin, elimina el rol `SUPERADMIN` de los roles permitidos en el DTO de registro (`RegisterDto`) para evitar que cualquier usuario externo pueda auto-asignarse ese rol.

---

## Configuraciones de Seguridad Obligatorias antes de Producción

Completa el siguiente checklist **antes** de hacer cualquier despliegue en producción:

- [ ] `JWT_SECRET` generado con `openssl rand -hex 64` (nunca usar el valor por defecto)
- [ ] `MEDICAL_ENCRYPTION_KEY` generado con `openssl rand -hex 32`
- [ ] `NODE_ENV=production` configurado en el entorno de producción
- [ ] HTTPS habilitado en todos los endpoints (TLS 1.2+ mínimo)
- [ ] Rate limiting activado en los endpoints de autenticación
- [ ] CORS configurado solo para dominios autorizados (no usar `*`)
- [ ] Helmet.js habilitado en NestJS para headers de seguridad HTTP
- [ ] Variables de entorno cargadas desde Secret Manager (GCP) o equivalente, nunca desde archivos `.env` en producción
- [ ] Rol `SUPERADMIN` eliminado del DTO de registro público
- [ ] Acceso directo a la base de datos cerrado (solo acceso interno desde la VPC)
- [ ] Redis protegido con contraseña en producción (`requirepass`)
- [ ] Logs de auditoría activados para acciones administrativas
- [ ] Datos médicos cifrados en reposo con `MEDICAL_ENCRYPTION_KEY`
- [ ] Backups automáticos de Cloud SQL configurados (frecuencia diaria mínima)
- [ ] Alertas de Cloud Monitoring configuradas para errores 5xx y latencia alta
- [ ] Vulnerability scanning habilitado en los contenedores (Artifact Registry)
- [ ] Dependencias auditadas con `npm audit` antes del despliegue

---

## APIs de Terceros — Confirmaciones pendientes con N1co

Antes de activar el módulo de pagos, confirmar con el equipo de N1co:

- Confirmar soporte de **pre-autorización (hold)** para reservas anticipadas: el sistema necesita retener el monto estimado y capturarlo o liberarlo al finalizar el viaje.
- Confirmar disponibilidad de **tokenización de tarjetas** para que los pasajeros puedan guardar métodos de pago de forma segura sin almacenar datos PCI en nuestros servidores.
- Solicitar **credenciales de sandbox/test** para desarrollo y QA.
- Confirmar el formato del **webhook de confirmación de pago** para la implementación del listener.
- Confirmar soporte para pagos en **USD** (moneda oficial de El Salvador).

---

## Arquitectura de Despliegue en GCP (Producción)

| Componente              | Servicio GCP                             | Notas                                              |
|-------------------------|------------------------------------------|----------------------------------------------------|
| REST API (NestJS)       | Cloud Run                                | Region: `us-central1` o `southamerica-east1`       |
| WebSocket GPS           | GKE Autopilot                            | Servicio separado `backend-ws`, requiere estado     |
| Base de datos           | Cloud SQL for PostgreSQL 16              | Con extensiones PostGIS + TimescaleDB              |
| Cache / Colas           | Memorystore for Redis                    | Tier Standard para alta disponibilidad             |
| Archivos / Fotos        | Cloud Storage                            | Bucket privado con acceso firmado (signed URLs)    |
| Panel de admin          | Vercel                                   | Free tier suficiente para uso interno              |
| App móvil (Android)     | Google Play Store                        | —                                                  |
| App móvil (iOS)         | Apple App Store                          | —                                                  |
| Secretos y credenciales | Google Secret Manager                    | Nunca hardcodear en variables de entorno del contenedor |
| CI/CD                   | GitHub Actions → Artifact Registry       | Build de imagen Docker + deploy automático a Cloud Run |

### Diagrama simplificado de flujo

```
App móvil (Flutter)
       │
       ├──── REST calls ────► Cloud Run (NestJS API)
       │                              │
       │                              ├── Cloud SQL (PostgreSQL + PostGIS)
       │                              ├── Memorystore (Redis)
       │                              └── Cloud Storage
       │
       └──── WebSocket GPS ─► GKE Autopilot (backend-ws)
                                       │
                                       └── Memorystore (Redis Pub/Sub)

Panel Admin (Next.js / Vercel) ──── REST calls ──► Cloud Run (NestJS API)
```
