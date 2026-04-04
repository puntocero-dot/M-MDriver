-- =============================================================================
-- M&M Driver — Servicio de Chófer Premium en El Salvador
-- Migración inicial: Esquema completo de la base de datos
-- Versión: 001
-- Fecha: 2026-04-03
-- =============================================================================
-- Este archivo define toda la estructura de datos del sistema M&M Driver:
-- usuarios, choferes, vehículos, viajes, pagos (N1co), rastreo GPS,
-- telemetría de conducción, alertas SOS y auditoría.
-- =============================================================================


-- =============================================================================
-- EXTENSIONES REQUERIDAS
-- =============================================================================

-- PostGIS: soporte de datos geoespaciales (ubicaciones GPS, rutas)
CREATE EXTENSION IF NOT EXISTS postgis;

-- pgcrypto: funciones de cifrado para datos médicos sensibles
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- uuid-ossp: generación de UUIDs v4 como claves primarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================================
-- ESQUEMAS
-- =============================================================================

-- Esquema principal: tablas de negocio generales
-- (ya existe por defecto, pero lo documentamos explícitamente)
-- CREATE SCHEMA IF NOT EXISTS public;

-- Esquema médico: datos de salud con cifrado a nivel de columna
CREATE SCHEMA IF NOT EXISTS medical;

-- Esquema de auditoría: registro de actividad y cambios
CREATE SCHEMA IF NOT EXISTS audit;

COMMENT ON SCHEMA medical IS 'Datos médicos sensibles. Las columnas críticas usan cifrado simétrico con pgp_sym_encrypt/pgp_sym_decrypt. La clave de cifrado proviene de la variable de entorno de la aplicación (MEDICAL_ENCRYPTION_KEY). NUNCA debe hardcodearse en el código.';
COMMENT ON SCHEMA audit IS 'Registro de auditoría de actividad del sistema. No modificar directamente.';


-- =============================================================================
-- TIPOS ENUMERADOS (ENUMs)
-- =============================================================================

-- Roles de usuario en el sistema
CREATE TYPE user_role AS ENUM (
    'CLIENT',
    'DRIVER',
    'SUPERVISOR',
    'SUPERADMIN'
);

-- Estados del ciclo de vida de un viaje (máquina de estados)
-- QUOTED        → Precio calculado, esperando confirmación del cliente
-- CONFIRMED     → Cliente confirmó, buscando chofer
-- DRIVER_ASSIGNED → Chofer asignado, aún no en camino
-- EN_ROUTE_TO_PICKUP → Chofer en camino al punto de recogida
-- AT_PICKUP     → Chofer llegó al punto de recogida, esperando cliente
-- IN_TRANSIT    → Viaje en curso
-- AT_STOP       → Chofer en una parada intermedia
-- WAITING_AT_STOP → Esperando al cliente en una parada
-- COMPLETED     → Viaje finalizado exitosamente
-- CANCELLED     → Viaje cancelado
-- SOS_ACTIVE    → Alerta de emergencia activada durante el viaje
CREATE TYPE trip_status AS ENUM (
    'QUOTED',
    'CONFIRMED',
    'DRIVER_ASSIGNED',
    'EN_ROUTE_TO_PICKUP',
    'AT_PICKUP',
    'IN_TRANSIT',
    'AT_STOP',
    'WAITING_AT_STOP',
    'COMPLETED',
    'CANCELLED',
    'SOS_ACTIVE'
);

-- Tipo de propietario de vehículo
CREATE TYPE vehicle_owner_type AS ENUM (
    'COMPANY',
    'CLIENT'
);

-- Tipos de eventos de telemetría de conducción
CREATE TYPE driving_event_type AS ENUM (
    'HARD_BRAKE',
    'HARD_ACCELERATION',
    'SHARP_TURN',
    'SPEEDING'
);

-- Métodos de pago aceptados
CREATE TYPE payment_method_type AS ENUM (
    'CREDIT_CARD',
    'DEBIT_CARD',
    'CASH'
);

-- Estados del ciclo de vida de un pago
CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'HOLD_PLACED',
    'CAPTURED',
    'REFUNDED',
    'FAILED'
);

-- Estados de alerta SOS
CREATE TYPE sos_status AS ENUM (
    'ACTIVE',
    'ACKNOWLEDGED',
    'RESOLVED'
);


-- =============================================================================
-- SECCIÓN 1: USUARIOS Y AUTENTICACIÓN
-- =============================================================================

-- Tabla principal de usuarios del sistema
-- Aplica a clientes, choferes, supervisores y superadmins
CREATE TABLE IF NOT EXISTS public.users (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               VARCHAR(255)    NOT NULL,
    phone               VARCHAR(20)     NOT NULL,
    password_hash       VARCHAR(255)    NOT NULL,   -- Hash bcrypt, nunca texto plano
    first_name          VARCHAR(100)    NOT NULL,
    last_name           VARCHAR(100)    NOT NULL,
    role                user_role       NOT NULL    DEFAULT 'CLIENT',
    avatar_url          TEXT,
    is_active           BOOLEAN         NOT NULL    DEFAULT true,
    is_verified         BOOLEAN         NOT NULL    DEFAULT false,
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT users_email_unique   UNIQUE (email),
    CONSTRAINT users_phone_unique   UNIQUE (phone)
);

COMMENT ON TABLE public.users IS 'Tabla central de usuarios. El campo password_hash almacena el resultado de bcrypt. Los datos médicos del usuario se encuentran en medical.medical_profiles.';
COMMENT ON COLUMN public.users.password_hash IS 'Hash bcrypt de la contraseña. Nunca almacenar contraseña en texto plano.';
COMMENT ON COLUMN public.users.role IS 'Rol que determina los permisos del usuario en el sistema.';

-- Índices adicionales sobre usuarios
CREATE INDEX IF NOT EXISTS idx_users_role         ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_active    ON public.users (is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at   ON public.users (created_at DESC);


-- Tokens de refresco para autenticación JWT
-- Permite sesiones múltiples por dispositivo y revocación individual
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL
                        REFERENCES public.users (id) ON DELETE CASCADE,
    token_hash      VARCHAR(255)    NOT NULL,   -- Hash SHA-256 del token real
    device_info     JSONB,                      -- {"device": "iPhone 15", "os": "iOS 17", "app_version": "1.2.0"}
    expires_at      TIMESTAMPTZ     NOT NULL,
    revoked_at      TIMESTAMPTZ,               -- NULL = activo, NOT NULL = revocado
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT refresh_tokens_hash_unique UNIQUE (token_hash)
);

COMMENT ON TABLE public.refresh_tokens IS 'Tokens de refresco JWT. Un usuario puede tener múltiples tokens activos (uno por dispositivo). Limpiar periódicamente los tokens expirados.';
COMMENT ON COLUMN public.refresh_tokens.token_hash IS 'Hash SHA-256 del token. El token real solo se envía al cliente, nunca se persiste.';

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id   ON public.refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires   ON public.refresh_tokens (expires_at);


-- =============================================================================
-- SECCIÓN 2: PERFILES DE CLIENTES
-- =============================================================================

-- Datos extendidos del perfil de un cliente
-- Complementa la tabla users para información específica del rol CLIENT
CREATE TABLE IF NOT EXISTS public.client_profiles (
    user_id                     UUID            PRIMARY KEY
                                    REFERENCES public.users (id) ON DELETE CASCADE,
    default_address             TEXT,
    emergency_contact_name      VARCHAR(200),
    emergency_contact_phone     VARCHAR(20),
    preferred_language          VARCHAR(5)      NOT NULL DEFAULT 'es',
    accessibility_needs         JSONB,          -- {"wheelchair": true, "visual_impairment": false, "notes": "..."}
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.client_profiles IS 'Perfil extendido del cliente. La relación es 1:1 con users. Se crea automáticamente al registrar un usuario con rol CLIENT.';
COMMENT ON COLUMN public.client_profiles.accessibility_needs IS 'JSONB con necesidades de accesibilidad. Ejemplo: {"wheelchair": true, "visual_impairment": false, "notes": "Requiere silla de ruedas plegable"}.';


-- =============================================================================
-- SECCIÓN 3: DATOS MÉDICOS (ESQUEMA medical, CIFRADO)
-- =============================================================================
-- IMPORTANTE SOBRE EL CIFRADO:
-- Las columnas sensibles usan pgp_sym_encrypt / pgp_sym_decrypt de pgcrypto.
-- La clave de cifrado NUNCA debe estar hardcodeada en el código ni en SQL.
-- Debe provenir de la variable de entorno MEDICAL_ENCRYPTION_KEY de la aplicación.
--
-- Ejemplo de uso desde la aplicación:
--   INSERT: pgp_sym_encrypt('valor_sensible', current_setting('app.medical_key'))
--   SELECT: pgp_sym_decrypt(columna_cifrada, current_setting('app.medical_key'))
--
-- Configurar la clave de sesión en la app antes de cada consulta:
--   SET app.medical_key = '<valor de MEDICAL_ENCRYPTION_KEY>';
-- =============================================================================

CREATE TABLE IF NOT EXISTS medical.medical_profiles (
    id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID        NOT NULL UNIQUE
                                REFERENCES public.users (id) ON DELETE RESTRICT,
    blood_type              VARCHAR(5),                 -- Ej: 'A+', 'O-', 'AB+'
    -- Columnas cifradas con pgp_sym_encrypt (tipo BYTEA)
    allergies               BYTEA,      -- Texto cifrado: lista de alergias
    medical_conditions      BYTEA,      -- Texto cifrado: condiciones médicas crónicas
    medications             BYTEA,      -- Texto cifrado: medicamentos actuales
    emergency_instructions  BYTEA,      -- Texto cifrado: instrucciones para emergencias
    -- Datos del médico (no cifrados, permiten contacto rápido en emergencia)
    doctor_name             VARCHAR(200),
    doctor_phone            VARCHAR(20),
    -- Datos de seguro
    insurance_provider      VARCHAR(200),
    insurance_policy_number BYTEA,      -- Texto cifrado: número de póliza
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE medical.medical_profiles IS
'Perfil médico del usuario. Las columnas BYTEA están cifradas con pgp_sym_encrypt usando la clave de la variable de entorno MEDICAL_ENCRYPTION_KEY. '
'NUNCA hardcodear la clave en SQL ni en el código fuente. '
'Para leer: pgp_sym_decrypt(columna, current_setting(''app.medical_key''))::TEXT. '
'Para escribir: pgp_sym_encrypt(''valor'', current_setting(''app.medical_key'')).';

COMMENT ON COLUMN medical.medical_profiles.allergies              IS 'CIFRADO con pgp_sym_encrypt. Lista de alergias del paciente.';
COMMENT ON COLUMN medical.medical_profiles.medical_conditions     IS 'CIFRADO con pgp_sym_encrypt. Condiciones médicas crónicas o relevantes.';
COMMENT ON COLUMN medical.medical_profiles.medications            IS 'CIFRADO con pgp_sym_encrypt. Medicamentos actuales con dosis.';
COMMENT ON COLUMN medical.medical_profiles.emergency_instructions IS 'CIFRADO con pgp_sym_encrypt. Instrucciones especiales para paramédicos en emergencia.';
COMMENT ON COLUMN medical.medical_profiles.insurance_policy_number IS 'CIFRADO con pgp_sym_encrypt. Número de póliza de seguro médico.';

CREATE INDEX IF NOT EXISTS idx_medical_profiles_user_id ON medical.medical_profiles (user_id);


-- =============================================================================
-- SECCIÓN 4: PERFILES DE CHOFERES
-- =============================================================================

-- Datos profesionales y operacionales del chofer
-- Incluye ubicación en tiempo real y estadísticas de desempeño
CREATE TABLE IF NOT EXISTS public.driver_profiles (
    user_id                 UUID            PRIMARY KEY
                                REFERENCES public.users (id) ON DELETE RESTRICT,
    license_number          VARCHAR(50)     NOT NULL,
    license_expiry          DATE            NOT NULL,
    license_photo_url       TEXT,
    uniform_size            VARCHAR(10),    -- XS, S, M, L, XL, XXL
    is_available            BOOLEAN         NOT NULL DEFAULT false,
    -- Ubicación actual en tiempo real (actualizada por la app del chofer)
    current_location        geography(POINT, 4326),
    last_location_update    TIMESTAMPTZ,
    -- Estadísticas de desempeño
    rating_avg              NUMERIC(3,2)    DEFAULT 5.00,
    total_trips             INTEGER         NOT NULL DEFAULT 0,
    vehicle_specializations JSONB,          -- {"ambulance": true, "executive": true, "airport": false}
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT driver_rating_range CHECK (rating_avg BETWEEN 0.00 AND 5.00),
    CONSTRAINT driver_total_trips_non_negative CHECK (total_trips >= 0)
);

COMMENT ON TABLE public.driver_profiles IS 'Perfil del chofer. La ubicación current_location se actualiza en tiempo real desde la app móvil. Para búsqueda de choferes cercanos usar ST_DWithin sobre el índice GIST.';
COMMENT ON COLUMN public.driver_profiles.current_location IS 'Ubicación GPS actual del chofer. Tipo geography(POINT, 4326) — coordenadas WGS-84. Actualizar solo cuando is_available = true o durante un viaje activo.';
COMMENT ON COLUMN public.driver_profiles.vehicle_specializations IS 'JSONB con habilitaciones especiales del chofer. Ej: {"ambulance": true, "executive": true, "wheelchair": false}.';

-- Índice espacial GIST para búsqueda eficiente de choferes cercanos
CREATE INDEX IF NOT EXISTS idx_driver_profiles_location
    ON public.driver_profiles USING GIST (current_location);

CREATE INDEX IF NOT EXISTS idx_driver_profiles_available
    ON public.driver_profiles (is_available)
    WHERE is_available = true;


-- =============================================================================
-- SECCIÓN 5: VEHÍCULOS
-- =============================================================================

-- Flota de vehículos (propios de la empresa o del cliente)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id                  UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_type          vehicle_owner_type  NOT NULL    DEFAULT 'COMPANY',
    owner_user_id       UUID                            -- FK nullable: solo para vehículos de cliente
                            REFERENCES public.users (id) ON DELETE SET NULL,
    make                VARCHAR(100)        NOT NULL,   -- Marca: Toyota, Mercedes, etc.
    model               VARCHAR(100)        NOT NULL,
    year                SMALLINT            NOT NULL,
    color               VARCHAR(50),
    license_plate       VARCHAR(20)         NOT NULL,
    insurance_policy    VARCHAR(200),
    insurance_expiry    DATE,
    photo_url           TEXT,
    is_active           BOOLEAN             NOT NULL    DEFAULT true,
    created_at          TIMESTAMPTZ         NOT NULL    DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL    DEFAULT NOW(),

    CONSTRAINT vehicles_license_plate_unique UNIQUE (license_plate),
    CONSTRAINT vehicles_year_valid CHECK (year BETWEEN 1990 AND 2100),
    CONSTRAINT vehicles_owner_consistency CHECK (
        -- Si el tipo es CLIENT, debe haber un owner_user_id
        (owner_type = 'CLIENT' AND owner_user_id IS NOT NULL)
        OR
        (owner_type = 'COMPANY')
    )
);

COMMENT ON TABLE public.vehicles IS 'Flota de vehículos del sistema. Puede ser propiedad de la empresa (COMPANY) o del cliente (CLIENT). Los vehículos de cliente son usados cuando el paciente posee ambulancia privada.';

CREATE INDEX IF NOT EXISTS idx_vehicles_owner_user_id  ON public.vehicles (owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_is_active      ON public.vehicles (is_active) WHERE is_active = true;


-- =============================================================================
-- SECCIÓN 6: VIAJES — MÁQUINA DE ESTADOS (COMPONENTE CRÍTICO)
-- =============================================================================
-- El ciclo de vida de un viaje sigue una máquina de estados estricta.
-- Todas las transiciones de estado se registran en trip_state_transitions.
-- La secuencia típica es:
--   QUOTED → CONFIRMED → DRIVER_ASSIGNED → EN_ROUTE_TO_PICKUP
--   → AT_PICKUP → IN_TRANSIT → (AT_STOP ↔ WAITING_AT_STOP)*
--   → COMPLETED
-- En cualquier estado activo puede dispararse: → SOS_ACTIVE
-- Desde cualquier estado antes de IN_TRANSIT: → CANCELLED
-- =============================================================================

-- Tabla principal de viajes
CREATE TABLE IF NOT EXISTS public.trips (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id               UUID            NOT NULL
                                REFERENCES public.users (id) ON DELETE RESTRICT,
    driver_id               UUID                        -- Asignado después de CONFIRMED
                                REFERENCES public.users (id) ON DELETE RESTRICT,
    vehicle_id              UUID
                                REFERENCES public.vehicles (id) ON DELETE RESTRICT,
    status                  trip_status     NOT NULL    DEFAULT 'QUOTED',

    -- Puntos de origen y destino
    pickup_address          TEXT            NOT NULL,
    pickup_location         geography(POINT, 4326)  NOT NULL,
    dropoff_address         TEXT            NOT NULL,
    dropoff_location        geography(POINT, 4326)  NOT NULL,

    -- Programación (NULL = viaje inmediato)
    scheduled_at            TIMESTAMPTZ,

    -- Marcas de tiempo del ciclo de vida
    started_at              TIMESTAMPTZ,   -- Cuando el chofer inicia el viaje (IN_TRANSIT)
    completed_at            TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    cancellation_reason     TEXT,

    -- Precios y tarifas (en USD)
    quoted_price            NUMERIC(10,2)  NOT NULL,
    final_price             NUMERIC(10,2),
    currency                VARCHAR(3)     NOT NULL    DEFAULT 'USD',

    -- Métricas del viaje
    distance_meters         INTEGER,
    duration_seconds        INTEGER,
    wait_time_seconds       INTEGER        DEFAULT 0,

    -- Referencias de pago N1co
    payment_hold_id         VARCHAR(255),  -- ID del hold en N1co (autorización previa)
    payment_capture_id      VARCHAR(255),  -- ID de la captura final en N1co

    -- Compartir viaje en vivo
    is_shared_live          BOOLEAN        NOT NULL    DEFAULT false,
    share_token             VARCHAR(64)    UNIQUE,     -- Token único para compartir seguimiento

    created_at              TIMESTAMPTZ    NOT NULL    DEFAULT NOW(),
    updated_at              TIMESTAMPTZ    NOT NULL    DEFAULT NOW(),

    CONSTRAINT trips_quoted_price_non_negative  CHECK (quoted_price >= 0),
    CONSTRAINT trips_final_price_non_negative   CHECK (final_price IS NULL OR final_price >= 0),
    CONSTRAINT trips_distance_non_negative      CHECK (distance_meters IS NULL OR distance_meters >= 0),
    CONSTRAINT trips_duration_non_negative      CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    CONSTRAINT trips_wait_time_non_negative     CHECK (wait_time_seconds IS NULL OR wait_time_seconds >= 0),
    CONSTRAINT trips_currency_length            CHECK (LENGTH(currency) = 3)
);

COMMENT ON TABLE public.trips IS 'Tabla central de viajes. Implementa una máquina de estados a través del campo status. Cada cambio de estado debe registrarse en trip_state_transitions. El campo share_token permite compartir el seguimiento en tiempo real con terceros (familiar, médico).';
COMMENT ON COLUMN public.trips.payment_hold_id IS 'ID del hold de autorización en la pasarela N1co. Se captura en CONFIRMED y se libera/captura al COMPLETED o CANCELLED.';
COMMENT ON COLUMN public.trips.share_token IS 'Token único para la URL de seguimiento en vivo: /track/{share_token}. Solo activo cuando is_shared_live = true.';

-- Índices para las consultas más frecuentes
CREATE INDEX IF NOT EXISTS idx_trips_client_id          ON public.trips (client_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id          ON public.trips (driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trips_status             ON public.trips (status);
CREATE INDEX IF NOT EXISTS idx_trips_status_active      ON public.trips (status, created_at DESC)
    WHERE status NOT IN ('COMPLETED', 'CANCELLED');
CREATE INDEX IF NOT EXISTS idx_trips_scheduled_at       ON public.trips (scheduled_at)
    WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trips_created_at         ON public.trips (created_at DESC);

-- Índices espaciales para búsqueda geográfica de viajes
CREATE INDEX IF NOT EXISTS idx_trips_pickup_location
    ON public.trips USING GIST (pickup_location);
CREATE INDEX IF NOT EXISTS idx_trips_dropoff_location
    ON public.trips USING GIST (dropoff_location);


-- Paradas intermedias de un viaje (para rutas con múltiples destinos)
CREATE TABLE IF NOT EXISTS public.trip_stops (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id             UUID            NOT NULL
                            REFERENCES public.trips (id) ON DELETE CASCADE,
    stop_order          INTEGER         NOT NULL,       -- Orden de la parada (1, 2, 3...)
    address             TEXT            NOT NULL,
    location            geography(POINT, 4326),
    arrived_at          TIMESTAMPTZ,
    departed_at         TIMESTAMPTZ,
    wait_time_seconds   INTEGER         DEFAULT 0,
    notes               TEXT,
    created_at          TIMESTAMPTZ     NOT NULL        DEFAULT NOW(),

    CONSTRAINT trip_stops_order_unique          UNIQUE (trip_id, stop_order),
    CONSTRAINT trip_stops_order_positive        CHECK (stop_order > 0),
    CONSTRAINT trip_stops_wait_non_negative     CHECK (wait_time_seconds IS NULL OR wait_time_seconds >= 0),
    CONSTRAINT trip_stops_arrival_before_depart CHECK (
        arrived_at IS NULL OR departed_at IS NULL OR arrived_at <= departed_at
    )
);

COMMENT ON TABLE public.trip_stops IS 'Paradas intermedias de un viaje. El stop_order define la secuencia. Se eliminan en cascada si se elimina el viaje padre.';

CREATE INDEX IF NOT EXISTS idx_trip_stops_trip_id_order
    ON public.trip_stops (trip_id, stop_order ASC);


-- Registro de auditoría de cada transición de estado de un viaje
-- Es el historial completo de la máquina de estados
CREATE TABLE IF NOT EXISTS public.trip_state_transitions (
    id              BIGSERIAL       PRIMARY KEY,
    trip_id         UUID            NOT NULL
                        REFERENCES public.trips (id) ON DELETE RESTRICT,
    from_status     trip_status,                    -- NULL para la transición inicial (creación)
    to_status       trip_status     NOT NULL,
    triggered_by    UUID            NOT NULL
                        REFERENCES public.users (id) ON DELETE RESTRICT,
    metadata        JSONB,                          -- Datos adicionales de contexto (ej: razón de cancelación)
    created_at      TIMESTAMPTZ     NOT NULL        DEFAULT NOW()
);

COMMENT ON TABLE public.trip_state_transitions IS 'Registro inmutable de todas las transiciones de estado de un viaje. Nunca actualizar ni eliminar registros de esta tabla. Es la fuente de verdad del historial del viaje.';
COMMENT ON COLUMN public.trip_state_transitions.from_status IS 'Estado anterior. NULL solo en la primera transición al crear el viaje.';
COMMENT ON COLUMN public.trip_state_transitions.metadata IS 'Contexto adicional. Ej: {"reason": "cliente no se presentó", "location": {...}}.';

CREATE INDEX IF NOT EXISTS idx_trip_transitions_trip_id
    ON public.trip_state_transitions (trip_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_trip_transitions_triggered_by
    ON public.trip_state_transitions (triggered_by, created_at DESC);


-- =============================================================================
-- SECCIÓN 7: RASTREO GPS (ALTO VOLUMEN DE ESCRITURAS)
-- =============================================================================
-- IMPORTANTE: Esta tabla está diseñada para ser convertida a hypertable de TimescaleDB.
--
-- Después de crear la tabla, ejecutar:
--   SELECT create_hypertable('gps_traces', 'time', chunk_time_interval => INTERVAL '1 day');
--
-- Políticas de TimescaleDB recomendadas:
--   -- Compresión automática después de 7 días:
--   SELECT add_compression_policy('gps_traces', INTERVAL '7 days');
--   -- Retención de datos: eliminar después de 90 días:
--   SELECT add_retention_policy('gps_traces', INTERVAL '90 days');
--
-- El particionamiento por tiempo reduce drásticamente el tamaño de índices
-- y permite consultas rápidas sobre rangos de tiempo recientes.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gps_traces (
    time                TIMESTAMPTZ     NOT NULL,   -- Clave de partición para TimescaleDB
    trip_id             UUID            NOT NULL
                            REFERENCES public.trips (id) ON DELETE RESTRICT,
    driver_id           UUID            NOT NULL
                            REFERENCES public.users (id) ON DELETE RESTRICT,
    location            geography(POINT, 4326)  NOT NULL,
    speed_kmh           NUMERIC(5,1),
    heading             NUMERIC(5,1),              -- Grados (0-360, Norte = 0)
    accuracy_meters     NUMERIC(5,1),              -- Precisión del GPS en metros
    altitude_meters     NUMERIC(7,1)               -- Altitud sobre el nivel del mar
);

COMMENT ON TABLE public.gps_traces IS
'Trazas GPS de alta frecuencia durante viajes activos. '
'TIMESCALEDB SETUP REQUERIDO: '
'1. Ejecutar: SELECT create_hypertable(''gps_traces'', ''time'', chunk_time_interval => INTERVAL ''1 day''); '
'2. Compresión: SELECT add_compression_policy(''gps_traces'', INTERVAL ''7 days''); '
'3. Retención: SELECT add_retention_policy(''gps_traces'', INTERVAL ''90 days''); '
'Sin TimescaleDB, crear particiones nativas por rango de tiempo en producción.';

COMMENT ON COLUMN public.gps_traces.time IS 'Clave de partición temporal para TimescaleDB. Usar TIMESTAMPTZ con zona horaria.';
COMMENT ON COLUMN public.gps_traces.heading IS 'Rumbo en grados (0-360). Norte = 0, Este = 90, Sur = 180, Oeste = 270.';

-- Índice principal para consultas de trazas de un viaje específico
CREATE INDEX IF NOT EXISTS idx_gps_traces_trip_id_time
    ON public.gps_traces (trip_id, time DESC);

-- Índice para trazas de un chofer específico (reportes, historial)
CREATE INDEX IF NOT EXISTS idx_gps_traces_driver_id_time
    ON public.gps_traces (driver_id, time DESC);

-- Índice espacial para análisis de rutas y zonas
CREATE INDEX IF NOT EXISTS idx_gps_traces_location
    ON public.gps_traces USING GIST (location);


-- =============================================================================
-- SECCIÓN 8: TELEMETRÍA DE CONDUCCIÓN (CALIDAD DE MANEJO)
-- =============================================================================

-- Eventos de conducción detectados por acelerómetros y GPS
-- Usados para evaluar la calidad y seguridad del chofer
CREATE TABLE IF NOT EXISTS public.driving_events (
    id              BIGSERIAL               PRIMARY KEY,
    trip_id         UUID                    NOT NULL
                        REFERENCES public.trips (id) ON DELETE RESTRICT,
    driver_id       UUID                    NOT NULL
                        REFERENCES public.users (id) ON DELETE RESTRICT,
    event_type      driving_event_type      NOT NULL,
    severity        NUMERIC(3,1)            NOT NULL,   -- Escala 1.0 - 10.0
    location        geography(POINT, 4326),
    speed_kmh       NUMERIC(5,1),
    recorded_at     TIMESTAMPTZ             NOT NULL    DEFAULT NOW(),

    CONSTRAINT driving_events_severity_range CHECK (severity BETWEEN 1.0 AND 10.0)
);

COMMENT ON TABLE public.driving_events IS 'Eventos de telemetría de conducción. Se generan desde sensores del dispositivo móvil del chofer. Usados para calcular puntuación de conducción y alertas a supervisores.';
COMMENT ON COLUMN public.driving_events.severity IS 'Severidad del evento en escala 1.0 (leve) a 10.0 (crítico).';

CREATE INDEX IF NOT EXISTS idx_driving_events_trip_id
    ON public.driving_events (trip_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_driving_events_driver_id
    ON public.driving_events (driver_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_driving_events_type
    ON public.driving_events (event_type, recorded_at DESC);


-- =============================================================================
-- SECCIÓN 9: PAGOS (INTEGRACIÓN N1CO)
-- =============================================================================
-- N1co es la pasarela de pagos local de El Salvador.
-- El flujo típico es:
--   1. Al confirmar viaje: crear hold (autorización) → payment_hold_id
--   2. Al completar viaje: capturar hold → payment_capture_id
--   3. Si se cancela: liberar hold (void)
-- =============================================================================

-- Registro de transacciones de pago
CREATE TABLE IF NOT EXISTS public.payments (
    id                      UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id                 UUID                    NOT NULL
                                REFERENCES public.trips (id) ON DELETE RESTRICT,
    client_id               UUID                    NOT NULL
                                REFERENCES public.users (id) ON DELETE RESTRICT,
    amount                  NUMERIC(10,2)           NOT NULL,
    currency                VARCHAR(3)              NOT NULL    DEFAULT 'USD',
    payment_method          payment_method_type     NOT NULL,
    status                  payment_status          NOT NULL    DEFAULT 'PENDING',
    -- Referencias de N1co
    n1co_transaction_id     VARCHAR(255),           -- ID de transacción en N1co
    n1co_hold_id            VARCHAR(255),           -- ID del hold/autorización en N1co
    metadata                JSONB,                  -- Respuesta completa de N1co (para debugging)
    created_at              TIMESTAMPTZ             NOT NULL    DEFAULT NOW(),
    updated_at              TIMESTAMPTZ             NOT NULL    DEFAULT NOW(),

    CONSTRAINT payments_amount_positive CHECK (amount > 0),
    CONSTRAINT payments_currency_length CHECK (LENGTH(currency) = 3)
);

COMMENT ON TABLE public.payments IS 'Registro de pagos. Integrado con N1co como pasarela de pago. El campo metadata almacena la respuesta cruda de N1co para auditoría y debugging.';
COMMENT ON COLUMN public.payments.n1co_hold_id IS 'ID del hold de autorización previa en N1co. Se crea al confirmar el viaje y se captura o libera al finalizar.';

CREATE INDEX IF NOT EXISTS idx_payments_trip_id     ON public.payments (trip_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id   ON public.payments (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status      ON public.payments (status);


-- Métodos de pago guardados del usuario (tokens de tarjeta)
-- Los datos reales de la tarjeta se almacenan en N1co, aquí solo el token
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL
                        REFERENCES public.users (id) ON DELETE CASCADE,
    type            payment_method_type NOT NULL,
    n1co_token      VARCHAR(255)    NOT NULL,   -- Token de tarjeta en N1co (PCI-compliant)
    last_four       CHAR(4),                    -- Últimos 4 dígitos para mostrar al usuario
    brand           VARCHAR(50),               -- Visa, Mastercard, etc.
    is_default      BOOLEAN         NOT NULL    DEFAULT false,
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT payment_methods_token_unique UNIQUE (n1co_token)
);

COMMENT ON TABLE public.payment_methods IS 'Métodos de pago guardados. Los datos reales de la tarjeta residen en N1co (PCI-DSS compliant). Solo se almacena el token de referencia y los últimos 4 dígitos para UI.';
COMMENT ON COLUMN public.payment_methods.n1co_token IS 'Token de tarjeta tokenizada por N1co. No contiene datos reales de tarjeta.';

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id
    ON public.payment_methods (user_id);


-- =============================================================================
-- SECCIÓN 10: CONFIGURACIÓN DE PRECIOS
-- =============================================================================

-- Configuraciones de tarifa vigentes (soporte de múltiples tarifas históricas)
CREATE TABLE IF NOT EXISTS public.pricing_config (
    id                          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                        VARCHAR(100)    NOT NULL,   -- Ej: "Tarifa Ejecutiva 2026", "Tarifa Médica Q1"
    base_fare                   NUMERIC(10,2)   NOT NULL,   -- Tarifa base por viaje
    per_km_rate                 NUMERIC(10,2)   NOT NULL,   -- Tarifa por kilómetro
    per_minute_rate             NUMERIC(10,2)   NOT NULL,   -- Tarifa por minuto de viaje
    per_stop_surcharge          NUMERIC(10,2)   NOT NULL    DEFAULT 0.00,  -- Cargo por parada adicional
    wait_time_per_minute        NUMERIC(10,2)   NOT NULL    DEFAULT 0.00,  -- Cargo por tiempo de espera/minuto
    minimum_fare                NUMERIC(10,2)   NOT NULL,   -- Tarifa mínima garantizada
    fuel_factor                 NUMERIC(5,3)    NOT NULL    DEFAULT 1.000, -- Multiplicador por costo de combustible
    company_vehicle_surcharge   NUMERIC(10,2)   NOT NULL    DEFAULT 0.00,  -- Recargo por uso de vehículo de empresa
    is_active                   BOOLEAN         NOT NULL    DEFAULT false,
    effective_from              TIMESTAMPTZ     NOT NULL,
    effective_until             TIMESTAMPTZ,               -- NULL = vigente indefinidamente
    created_at                  TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT pricing_base_fare_positive       CHECK (base_fare >= 0),
    CONSTRAINT pricing_per_km_positive          CHECK (per_km_rate >= 0),
    CONSTRAINT pricing_per_minute_positive      CHECK (per_minute_rate >= 0),
    CONSTRAINT pricing_minimum_fare_positive    CHECK (minimum_fare >= 0),
    CONSTRAINT pricing_fuel_factor_positive     CHECK (fuel_factor > 0),
    CONSTRAINT pricing_dates_valid              CHECK (
        effective_until IS NULL OR effective_from < effective_until
    )
);

COMMENT ON TABLE public.pricing_config IS 'Configuraciones de tarifas. Solo debe haber una configuración activa (is_active = true) en cada momento. El fuel_factor permite ajustes rápidos por variaciones del precio del combustible.';

CREATE INDEX IF NOT EXISTS idx_pricing_config_active
    ON public.pricing_config (is_active, effective_from DESC)
    WHERE is_active = true;


-- =============================================================================
-- SECCIÓN 11: ALERTAS SOS
-- =============================================================================

-- Alertas de emergencia disparadas durante un viaje
CREATE TABLE IF NOT EXISTS public.sos_alerts (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id             UUID            NOT NULL
                            REFERENCES public.trips (id) ON DELETE RESTRICT,
    triggered_by        UUID            NOT NULL
                            REFERENCES public.users (id) ON DELETE RESTRICT,
    location            geography(POINT, 4326),
    status              sos_status      NOT NULL    DEFAULT 'ACTIVE',
    acknowledged_by     UUID
                            REFERENCES public.users (id) ON DELETE RESTRICT,
    resolved_at         TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ     NOT NULL    DEFAULT NOW(),

    CONSTRAINT sos_resolved_requires_acknowledged CHECK (
        resolved_at IS NULL OR acknowledged_by IS NOT NULL
    )
);

COMMENT ON TABLE public.sos_alerts IS 'Alertas SOS de emergencia. Se activan desde la app del chofer o del cliente. Deben ser atendidas por supervisores en tiempo real. El estado del viaje asociado cambia a SOS_ACTIVE automáticamente.';
COMMENT ON COLUMN public.sos_alerts.triggered_by IS 'Usuario que disparó la alerta (puede ser el chofer o el cliente).';

CREATE INDEX IF NOT EXISTS idx_sos_alerts_trip_id    ON public.sos_alerts (trip_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status     ON public.sos_alerts (status, created_at DESC)
    WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_sos_alerts_location   ON public.sos_alerts USING GIST (location);


-- =============================================================================
-- SECCIÓN 12: NOTIFICACIONES
-- =============================================================================

-- Notificaciones push/in-app para usuarios
CREATE TABLE IF NOT EXISTS public.notifications (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL
                    REFERENCES public.users (id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,   -- Ej: 'TRIP_CONFIRMED', 'DRIVER_ARRIVING', 'SOS_ALERT'
    title       VARCHAR(200) NOT NULL,
    body        TEXT        NOT NULL,
    data        JSONB,                  -- Datos adicionales para deep linking en la app
    is_read     BOOLEAN     NOT NULL    DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS 'Notificaciones in-app y push. El campo data contiene información para navegar a la pantalla correcta en la app móvil. Archivar notificaciones leídas después de 30 días.';
COMMENT ON COLUMN public.notifications.type IS 'Tipo de notificación para categorización y routing en la app. Ej: TRIP_CONFIRMED, DRIVER_ARRIVING, PAYMENT_PROCESSED, SOS_ALERT.';

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
    ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
    ON public.notifications (user_id, created_at DESC)
    WHERE is_read = false;


-- =============================================================================
-- SECCIÓN 13: AUDITORÍA (ESQUEMA audit)
-- =============================================================================

-- Registro de actividad de usuarios para auditoría y seguridad
-- Incluye acciones de API, cambios de configuración, accesos a datos sensibles
CREATE TABLE IF NOT EXISTS audit.activity_log (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         UUID                        -- NULL para acciones del sistema o anónimas
                        REFERENCES public.users (id) ON DELETE SET NULL,
    action          VARCHAR(100)    NOT NULL,   -- Ej: 'USER_LOGIN', 'TRIP_CANCELLED', 'MEDICAL_DATA_ACCESSED'
    resource_type   VARCHAR(100),               -- Ej: 'trip', 'user', 'medical_profile'
    resource_id     VARCHAR(255),               -- ID del recurso afectado
    ip_address      INET,
    metadata        JSONB,                      -- Contexto adicional (headers, cambios antes/después, etc.)
    created_at      TIMESTAMPTZ     NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE audit.activity_log IS 'Registro de auditoría inmutable. NUNCA actualizar ni eliminar registros. Cada acción significativa del sistema debe registrarse aquí. Especialmente importante para accesos a datos médicos y cambios de estado de viajes.';
COMMENT ON COLUMN audit.activity_log.action IS 'Acción realizada. Usar formato SUJETO_ACCIÓN en mayúsculas. Ej: USER_LOGIN, TRIP_STATUS_CHANGED, MEDICAL_PROFILE_VIEWED.';

-- Índice para consultas por usuario (historial de actividad)
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id
    ON audit.activity_log (user_id, created_at DESC);

-- Índice para consultas por recurso (¿quién tocó este viaje?)
CREATE INDEX IF NOT EXISTS idx_activity_log_resource
    ON audit.activity_log (resource_type, resource_id);

-- Índice temporal para reportes y limpieza
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at
    ON audit.activity_log (created_at DESC);


-- =============================================================================
-- FUNCIONES AUXILIARES
-- =============================================================================

-- Función para actualizar updated_at automáticamente via trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.set_updated_at() IS 'Función trigger para actualizar automáticamente el campo updated_at en cada UPDATE.';


-- =============================================================================
-- TRIGGERS DE updated_at
-- =============================================================================

-- Trigger para users
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger para client_profiles
CREATE TRIGGER trg_client_profiles_updated_at
    BEFORE UPDATE ON public.client_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger para medical_profiles
CREATE TRIGGER trg_medical_profiles_updated_at
    BEFORE UPDATE ON medical.medical_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger para driver_profiles
CREATE TRIGGER trg_driver_profiles_updated_at
    BEFORE UPDATE ON public.driver_profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger para vehicles
CREATE TRIGGER trg_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger para trips
CREATE TRIGGER trg_trips_updated_at
    BEFORE UPDATE ON public.trips
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger para payments
CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================================================
-- DATOS SEMILLA MÍNIMOS (valores de referencia)
-- =============================================================================

-- Configuración de precio inicial de referencia (inactiva por defecto)
-- Ajustar valores según tarifas reales de M&M Driver antes de activar
INSERT INTO public.pricing_config (
    name,
    base_fare,
    per_km_rate,
    per_minute_rate,
    per_stop_surcharge,
    wait_time_per_minute,
    minimum_fare,
    fuel_factor,
    company_vehicle_surcharge,
    is_active,
    effective_from
) VALUES (
    'Tarifa Base M&M Driver 2026',
    5.00,    -- $5.00 tarifa base
    0.85,    -- $0.85 por km
    0.25,    -- $0.25 por minuto
    2.00,    -- $2.00 por parada adicional
    0.15,    -- $0.15 por minuto de espera
    8.00,    -- $8.00 tarifa mínima
    1.000,   -- Factor combustible neutro (ajustar según precio de mercado)
    3.00,    -- $3.00 recargo por vehículo de empresa
    false,   -- INACTIVA: activar manualmente después de revisión
    NOW()
) ON CONFLICT DO NOTHING;


-- =============================================================================
-- FIN DEL ESQUEMA INICIAL
-- =============================================================================
-- Para aplicar TimescaleDB (después de instalar la extensión):
--   CREATE EXTENSION IF NOT EXISTS timescaledb;
--   SELECT create_hypertable('gps_traces', 'time', chunk_time_interval => INTERVAL '1 day');
--   SELECT add_compression_policy('gps_traces', INTERVAL '7 days');
--   SELECT add_retention_policy('gps_traces', INTERVAL '90 days');
--
-- Para verificar la instalación:
--   SELECT table_name, table_schema FROM information_schema.tables
--   WHERE table_schema IN ('public', 'medical', 'audit')
--   ORDER BY table_schema, table_name;
-- =============================================================================
