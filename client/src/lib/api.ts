import { apiRequest, apiMultipartRequest } from "@/lib/queryClient";

// --- Environment Variable Setup ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined. Please check your .env.local file.");
}

// --- Generic API Helpers ---
const handleResponse = <T>(res: Response): Promise<T> => res.json();

// --- API Response Structure ---
export interface ApiResponse<T> {
  data: T;
  meta: {
    success: boolean;
    message: string;
    error_code?: string | null;
  };
  pagination?: {
    page: number;
    page_size: number;
    total_pages: number;
  } | null;
}

// --- Type Definitions for Ticketing App ---

export interface Role {
  id_role: string;
  name: string;
  description?: string;
}

export interface User {
  id_user: string;
  full_name: string;
  email: string;
  id_role: string;
  role?: Role; // Role might not always be populated
  deleted: boolean;
}

export interface Ticket {
  id_ticket: string;
  name: string;
  description?: string;
  price: number;
  is_active: boolean;
}

export interface Booking {
  id_booking: string;
  id_user: string;
  total_amount: number;
  status: string;
  payment_gateway_token?: string;
  paid_at?: string;
  created_on: string;
  user: User; // User who made the booking
  bookingDetails: BookingDetail[];
}

export interface BookingDetail {
  id_booking_detail: string;
  id_booking: string;
  id_ticket: string;
  quantity: number;
  price_per_ticket: number;
  used_at?: string;
  used_by?: string;
  ticket: Ticket;
}

export interface LoginData {
  email: string;
  password?: string;
}

export interface AuthResponse {
  accessToken: string; // Updated to match your API response
  role: string;
}

export interface InsertBulkUser {
  full_name: string;
  email: string;
}

export interface QueryParams {
    page?: number;
    page_size?: number;
    search?: string;
    [key: string]: any;
}


// --- API Endpoints ---

const createUrlWithParams = (baseUrl: string, params: QueryParams) => {
    const query = new URLSearchParams();
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) {
            query.append(key, String(params[key]));
        }
    }
    const queryString = query.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export const authApi = {
  login: (data: LoginData) =>
    apiRequest("POST", `${API_BASE_URL}/auth/login`, data).then(handleResponse<ApiResponse<AuthResponse>>),
  register: (data: InsertBulkUser) =>
    apiRequest("POST", `${API_BASE_URL}/auth/register`, data).then(handleResponse),
  getMe: () =>
    apiRequest("GET", `${API_BASE_URL}/auth/me`).then(handleResponse<ApiResponse<User>>),
};

export const userApi = {
    getUsers: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/users`, params)).then(handleResponse<ApiResponse<User[]>>),
};

export const ticketApi = {
    getTickets: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/tickets`, params)).then(handleResponse<ApiResponse<Ticket[]>>),
    createTicket: (data: Omit<Ticket, 'id_ticket'>) =>
        apiRequest("POST", `${API_BASE_URL}/tickets`, data).then(handleResponse<ApiResponse<Ticket>>),
    updateTicket: (id: string, data: Partial<Omit<Ticket, 'id_ticket'>>) =>
        apiRequest("PUT", `${API_BASE_URL}/tickets/${id}`, data).then(handleResponse<ApiResponse<Ticket>>),
    deleteTicket: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/tickets/${id}`).then(handleResponse),
};

export const bookingApi = {
    getBookings: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/bookings`, params)).then(handleResponse<ApiResponse<Booking[]>>),
    getBookingById: (id: string) =>
        apiRequest("GET", `${API_BASE_URL}/bookings/${id}`).then(handleResponse<ApiResponse<Booking>>),
    redeemTicket: (bookingDetailId: string) =>
        apiRequest("POST", `${API_BASE_URL}/bookings/redeem`, { bookingDetailId }).then(handleResponse),
};
