import axios, { AxiosError } from "axios";
import { getToken, clearToken } from "./auth";

// ─── Response types ───────────────────────────────────────────────────────────

export type TripStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DRIVER_ASSIGNED"
  | "EN_ROUTE_TO_PICKUP"
  | "ARRIVED_AT_PICKUP"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type DriverStatus = "AVAILABLE" | "ON_TRIP" | "OFFLINE";

export type SOSStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";

export interface Trip {
  id: string;
  clientName: string;
  clientPhone: string;
  driverId?: string;
  driverName?: string;
  status: TripStatus;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  fare?: number;
  notes?: string;
  shareToken?: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: DriverStatus;
  activeTripId?: string;
  lastSeenAt?: string;
  rating?: number;
  totalTrips?: number;
  vehicleModel?: string;
  vehiclePlate?: string;
  createdAt: string;
}

export interface SOSAlert {
  id: string;
  tripId: string;
  triggeredBy: string;
  triggeredAt: string;
  lat: number;
  lng: number;
  status: SOSStatus;
  notes?: string;
  resolvedAt?: string;
  acknowledgedAt?: string;
}

export interface DashboardStats {
  activeTrips: number;
  availableDrivers: number;
  sosAlerts: number;
  dailyRevenue: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://m-mdriver-production.up.railway.app/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — unwrap backend {data, statusCode} envelope + handle 401
api.interceptors.response.use(
  (response) => {
    // Backend wraps ALL responses in { data, statusCode, timestamp }
    // Axios already puts the HTTP body into response.data,
    // so response.data = { data: <actual payload>, statusCode: 200 }
    // We extract the inner payload so callers get clean objects/arrays.
    const body = response.data;
    if (body && typeof body === "object" && "data" in body && "statusCode" in body) {
      response.data = body.data;
    }
    return response;
  },
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    // Normalize error message for consumers
    const raw = error.response?.data as any;
    const message =
      raw?.data?.message ??
      raw?.message ??
      error.message ??
      "Error de conexión con el servidor";

    const normalized = new Error(message) as Error & { statusCode: number };
    normalized.statusCode = error.response?.status ?? 0;
    return Promise.reject(normalized);
  }
);

// ─── Typed API methods ────────────────────────────────────────────────────────

/** Trips */
export async function getTrips(
  params?: { status?: TripStatus; page?: number; limit?: number }
): Promise<PaginatedResponse<Trip>> {
  const res = await api.get<PaginatedResponse<Trip>>("/trips", { params });
  return res.data;
}

export async function getTrip(id: string): Promise<Trip> {
  const res = await api.get<Trip>(`/trips/${id}`);
  return res.data;
}

/** Drivers */
export async function getDrivers(
  params?: { status?: DriverStatus }
): Promise<Driver[]> {
  const res = await api.get<Driver[]>("/drivers", { params });
  return res.data;
}

export async function getDriver(id: string): Promise<Driver> {
  const res = await api.get<Driver>(`/drivers/${id}`);
  return res.data;
}

/** Assign a driver to a trip */
export async function assignDriver(
  tripId: string,
  driverId: string
): Promise<Trip> {
  const res = await api.post<Trip>(`/trips/${tripId}/assign`, { driverId });
  return res.data;
}

/** SOS Alerts */
export async function getSOSAlerts(): Promise<SOSAlert[]> {
  const res = await api.get<SOSAlert[]>("/sos/active");
  return res.data;
}

export async function acknowledgeSOSAlert(id: string): Promise<SOSAlert> {
  const res = await api.patch<SOSAlert>(`/sos/${id}/acknowledge`);
  return res.data;
}

export async function resolveSOSAlert(
  id: string,
  notes?: string
): Promise<SOSAlert> {
  const res = await api.patch<SOSAlert>(`/sos/${id}/resolve`, { notes });
  return res.data;
}

/** Dashboard */
export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<DashboardStats>("/admin/dashboard/stats");
  return res.data;
}

export default api;
