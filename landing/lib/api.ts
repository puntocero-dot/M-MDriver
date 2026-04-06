// ─── Landing Page API Client ─────────────────────────────────────────────────
// Public endpoints + auth flows for the M&M Driver landing page.

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://m-mdriver-production.up.railway.app/api/v1";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      body?.message ??
      body?.error ??
      `Error ${res.status}: ${res.statusText}`;
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return body as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuoteRequest {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  vehicleType?: "CLIENT" | "COMPANY";
}

export interface QuoteResponse {
  estimatedPrice: number;
  estimatedDistanceMeters: number;
  estimatedDurationSeconds: number;
  currency: string;
  expiresAt: string;
  breakdown: {
    base: number;
    distance: number;
    time: number;
    stops: number;
    fuel: number;
    vehicleSurcharge: number;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface CreateTripRequest {
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  quotedPrice: number;
  notes?: string;
  scheduledAt?: string;
}

export interface Trip {
  id: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  fare?: number;
  shareToken?: string;
  createdAt: string;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/** PUBLIC: Calcula cotización sin necesidad de estar logueado */
export async function calculateQuote(
  data: QuoteRequest
): Promise<QuoteResponse> {
  return request<QuoteResponse>("/quoter/quote", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Registra un nuevo cliente */
export async function registerClient(
  data: RegisterRequest
): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Login */
export async function loginClient(
  email: string,
  password: string
): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/** Crea un viaje (requiere token JWT) */
export async function createTrip(
  data: CreateTripRequest,
  token: string
): Promise<Trip> {
  return request<Trip>("/trips", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** OBTIENE HISTORIAL DE VIAJES (requiere token JWT) */
export async function getMyTrips(
  token: string,
  page = 1,
  limit = 10
): Promise<{ data: Trip[]; total: number }> {
  // El backend retorna [Trip[], number]
  const [data, total] = await request<[Trip[], number]>(
    `/trips/my?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return { data, total };
}
