import { apiRequest } from "@/lib/queryClient";

// --- Environment Variable Setup ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined. Please check your .env.local file.");
}

// --- Generic API Helpers ---
const handleResponse = <T>(res: Response): Promise<T> => {
    if (!res.ok) {
        return res.json().then(errorBody => {
            throw new Error(errorBody.meta?.message || 'An unknown error occurred');
        });
    }
    return res.json();
};


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
    total_records: number;
  } | null;
}

// --- Type Definitions for New Schema ---

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
  role?: { name: string };
  deleted: boolean;
}

export interface InsertUser {
    full_name: string;
    email: string;
    password?: string;
    id_role: string;
}

export interface Gate {
    id_gate: string;
    name: string;
    description?: string;
    is_active: boolean;
}

export interface VisitorCategory {
    id_category: string;
    name: string;
    description?: string;
}

export interface DayType {
    id_day_type: string;
    name: string;
    description?: string;
}

export interface TicketPrice {
    id_ticket_price: string;
    id_gate: string;
    id_category: string;
    id_day_type: string;
    price: number;
    is_active: boolean;
    gate: Gate;
    category: VisitorCategory;
    dayType: DayType;
}

export interface InsertTicketPrice {
    id_gate: string;
    id_category: string;
    id_day_type: string;
    price: number;
    is_active?: boolean;
}

export interface Booking {
  id_booking: string;
  id_user: string;
  total_amount: number;
  status: string;
  created_on: string;
  user: User;
  bookingDetails: BookingDetail[];
  payment_gateway_token?: string;
}

export interface BookingDetail {
  id_booking_detail: string;
  id_booking: string;
  id_ticket_price: string;
  price_at_purchase: number;
  used_at?: string;
  used_by?: string;
  ticketPrice: TicketPrice;
}

export interface OnsiteBookingPayload {
    ticketOrders: {
        id_ticket_price: string;
        quantity: number;
    }[];
}

export interface LoginData {
  email: string;
  password?: string;
}

export interface AuthResponse {
  accessToken: string;
  role: string;
}

export interface QueryParams {
    page?: number;
    pageSize?: number;
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
  getMe: () =>
    apiRequest("GET", `${API_BASE_URL}/auth/me`).then(handleResponse<ApiResponse<User>>),
};

export const roleApi = {
    getRoles: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/roles`, params)).then(handleResponse<ApiResponse<Role[]>>),
};

export const userApi = {
    getUsers: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/users`, params)).then(handleResponse<ApiResponse<User[]>>),
    getUserById: (id: string) =>
        apiRequest("GET", `${API_BASE_URL}/users/${id}`).then(handleResponse<ApiResponse<User>>),
    createUser: (data: InsertUser) =>
        apiRequest("POST", `${API_BASE_URL}/users`, data).then(handleResponse<ApiResponse<User>>),
    updateUser: (id: string, data: Partial<InsertUser>) =>
        apiRequest("PUT", `${API_BASE_URL}/users/${id}`, data).then(handleResponse<ApiResponse<User>>),
    deleteUser: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/users/${id}`).then(handleResponse),
};

export const dayTypeApi = {
    getDayTypes: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/day-types`, params)).then(handleResponse<ApiResponse<DayType[]>>),
    createDayType: (data: Omit<DayType, 'id_day_type'>) =>
        apiRequest("POST", `${API_BASE_URL}/day-types`, data).then(handleResponse<ApiResponse<DayType>>),
    updateDayType: (id: string, data: Partial<Omit<DayType, 'id_day_type'>>) =>
        apiRequest("PUT", `${API_BASE_URL}/day-types/${id}`, data).then(handleResponse<ApiResponse<DayType>>),
    deleteDayType: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/day-types/${id}`).then(handleResponse),
};

export const gateApi = {
    getGates: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/gates`, params)).then(handleResponse<ApiResponse<Gate[]>>),
    createGate: (data: Omit<Gate, 'id_gate' | 'is_active'> & {is_active?: boolean}) =>
        apiRequest("POST", `${API_BASE_URL}/gates`, data).then(handleResponse<ApiResponse<Gate>>),
    updateGate: (id: string, data: Partial<Omit<Gate, 'id_gate'>>) =>
        apiRequest("PUT", `${API_BASE_URL}/gates/${id}`, data).then(handleResponse<ApiResponse<Gate>>),
    deleteGate: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/gates/${id}`).then(handleResponse),
};

export const visitorCategoryApi = {
    getVisitorCategories: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/visitor-categories`, params)).then(handleResponse<ApiResponse<VisitorCategory[]>>),
    createVisitorCategory: (data: Omit<VisitorCategory, 'id_category'>) =>
        apiRequest("POST", `${API_BASE_URL}/visitor-categories`, data).then(handleResponse<ApiResponse<VisitorCategory>>),
    updateVisitorCategory: (id: string, data: Partial<Omit<VisitorCategory, 'id_category'>>) =>
        apiRequest("PUT", `${API_BASE_URL}/visitor-categories/${id}`, data).then(handleResponse<ApiResponse<VisitorCategory>>),
    deleteVisitorCategory: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/visitor-categories/${id}`).then(handleResponse),
};

export const ticketPriceApi = {
    getTicketPrices: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/ticket-prices/all`, params)).then(handleResponse<ApiResponse<TicketPrice[]>>),
    getTicketPriceById: (id: string) =>
        apiRequest("GET", `${API_BASE_URL}/ticket-prices/${id}`).then(handleResponse<ApiResponse<TicketPrice>>),
    createTicketPrice: (data: InsertTicketPrice) =>
        apiRequest("POST", `${API_BASE_URL}/ticket-prices`, data).then(handleResponse<ApiResponse<TicketPrice>>),
    updateTicketPrice: (id: string, data: Partial<InsertTicketPrice>) =>
        apiRequest("PUT", `${API_BASE_URL}/ticket-prices/${id}`, data).then(handleResponse<ApiResponse<TicketPrice>>),
    deleteTicketPrice: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/ticket-prices/${id}`).then(handleResponse),
};

export const bookingApi = {
    getBookings: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/bookings`, params)).then(handleResponse<ApiResponse<Booking[]>>),
    getBookingById: (id: string) =>
        apiRequest("GET", `${API_BASE_URL}/bookings/${id}`).then(handleResponse<ApiResponse<Booking>>),
    getBookingDetailById: (id: string) => // New function to get ticket details
        apiRequest("GET", `${API_BASE_URL}/booking-details/${id}`).then(handleResponse<ApiResponse<BookingDetail>>),
    redeemBooking: (bookingDetailId: string) =>
        apiRequest("POST", `${API_BASE_URL}/bookings/redeem`, { bookingDetailId }).then(handleResponse),
    createOnsiteBooking: (data: OnsiteBookingPayload) => // New function for onsite sales
        apiRequest("POST", `${API_BASE_URL}/bookings/onsite`, data).then(handleResponse<ApiResponse<Booking>>),
};
