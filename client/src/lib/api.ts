import { apiMultipartRequest, apiRequest } from "@/lib/queryClient";

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
    image_url?: string; 
    location?: string;   
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

export interface BookingItem {
    id_ticket_price: string;
    quantity: number;
    price: number;
    gate_name: string;
    category_name: string;
    day_type_name: string;
}

export interface Booking {
    id_booking: string;
    id_user: string;
    source: 'online' | 'offline';
    leader_name: string;
    leader_gender?: string;
    leader_nationality?: string;
    leader_id_type?: string;
    leader_id_number?: string;
    leader_phone: string;
    visit_date: string;
    items: BookingItem[];
    total_amount: number;
    status: 'Pending' | 'Success' | 'Used' | 'Expired' | 'Canceled' | 'Denied';
    computed_status?: 'Valid' | 'Expired' | 'Used' | 'Pending';
    payment_gateway_token?: string | null;
    paid_at?: string | null;
    qr_code?: string;
    used_at?: string | null;
    expired_at?: string;
    created_on: string;
    updated_on?: string;
    user?: {
        full_name: string;
        email: string;
    };
}

export interface OnsiteBookingPayload {
    leader?: {
        name?: string;
        nationality?: string;
        id_number?: string;
        visit_date?: string;
    };
    ticketOrders: {
        id_ticket_price: string;
        quantity: number;
    }[];
}

export interface BookingAnalytics {
    total_bookings: number;
    total_revenue: number;
    by_status: Record<string, number>;
    by_source: {
        online: number;
        offline: number;
    };
    recent_bookings: Array<{
        id_booking: string;
        leader_name: string;
        total_amount: number;
        status: string;
        computed_status: string;
        created_on: string;
        user: {
            full_name: string;
            email: string;
        };
    }>;
}

export interface BookingSearchParams extends QueryParams {
    searchField?: 'leader_name' | 'leader_phone' | 'id_booking';
    searchValue?: string;
    status?: string;
    source?: 'online' | 'offline';
    startDate?: string;
    endDate?: string;
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

export interface News {
  id_news: string;
  title: string;
  content: string;
  image_url: string;
  status: string;
  published_at?: string;
  author_name: string;
  created_on: string;
  updated_on: string;
}

export interface Event {
  id_event: string;
  title: string;
  content: string;
  image_url: string;
  event_date: string;
  location: string;
  status: string;
  published_at?: string;
  author_name: string;
  created_on: string;
  updated_on: string;
}

export interface Destination {
  id_destination: string;
  id_gate: string;
  name: string;
  slug: string;
  description?: string;
  image_url: string;
  features?: string;
  facilities?: string;
  created_on: string;
  updated_on: string;
  gate?: { // Untuk menampilkan nama gate di tabel
      id_gate: string;
      name: string;
  }
}

// --- Dashboard Specific Types ---
export interface DashboardStatistics {
    cards: {
        total_bookings: {
            value: number;
            trend: number;
        };
        total_revenue: {
            value: number;
            label: string;
        };
        revenue_current_month: {
            value: number;
            label: string;
        };
        bookings_today: {
            value: number;
            label: string;
        };
    };
    monthly_revenue: {
        month: string;
        online: number;
        offline: number;
        total: number;
        chart: Array<{
            date: string;
            online: number;
            offline: number;
        }>;
        filter: {
            month: number;
            year: number;
        } | null;
    };
    tickets: {
        by_category: {
            lokal: number;
            mancanegara: number;
        };
        by_day_type: {
            weekday: number;
            weekend: number;
        };
        total: number;
    };
    bookings_by_gate: Array<{
        gate: string;
        count: number;
        revenue: number;
    }>;
    booking_status: Record<string, number>;
    recent_bookings: Array<{
        id_booking: string;
        leader_name: string;
        total_amount: number;
        status: string;
        source: string;
        created_on: string;
    }>;
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
    apiRequest("POST", `${API_BASE_URL}/public/auth/login`, data).then(handleResponse<ApiResponse<AuthResponse>>),
  getMe: () =>
    apiRequest("GET", `${API_BASE_URL}/public/auth/me`).then(handleResponse<ApiResponse<User>>),
};

export const roleApi = {
    getRoles: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/admin/roles`, params)).then(handleResponse<ApiResponse<Role[]>>),
};

export const userApi = {
    getUsers: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/admin/users`, params)).then(handleResponse<ApiResponse<User[]>>),
    getUserById: (id: string) =>
        apiRequest("GET", `${API_BASE_URL}/admin/users/${id}`).then(handleResponse<ApiResponse<User>>),
    createUser: (data: InsertUser) =>
        apiRequest("POST", `${API_BASE_URL}/admin/users`, data).then(handleResponse<ApiResponse<User>>),
    updateUser: (id: string, data: Partial<InsertUser>) =>
        apiRequest("PUT", `${API_BASE_URL}/admin/users/${id}`, data).then(handleResponse<ApiResponse<User>>),
    deleteUser: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/admin/users/${id}`).then(handleResponse),
};

export const dayTypeApi = {
    getDayTypes: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/admin/day-types`, params)).then(handleResponse<ApiResponse<DayType[]>>),
    createDayType: (data: Omit<DayType, 'id_day_type'>) =>
        apiRequest("POST", `${API_BASE_URL}/admin/day-types`, data).then(handleResponse<ApiResponse<DayType>>),
    updateDayType: (id: string, data: Partial<Omit<DayType, 'id_day_type'>>) =>
        apiRequest("PUT", `${API_BASE_URL}/admin/day-types/${id}`, data).then(handleResponse<ApiResponse<DayType>>),
    deleteDayType: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/admin/day-types/${id}`).then(handleResponse),
};

export const gateApi = {
    getGates: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/admin/gates`, params)).then(handleResponse<ApiResponse<Gate[]>>),
    createGate: (data: FormData) =>
        apiMultipartRequest("POST", `${API_BASE_URL}/admin/gates`, data).then(handleResponse<ApiResponse<Gate>>),
    updateGate: (id: string, data: FormData) =>
        apiMultipartRequest("PUT", `${API_BASE_URL}/admin/gates/${id}`, data).then(handleResponse<ApiResponse<Gate>>),
    deleteGate: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/admin/gates/${id}`).then(handleResponse),
};

export const visitorCategoryApi = {
    getVisitorCategories: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/admin/visitor-categories`, params)).then(handleResponse<ApiResponse<VisitorCategory[]>>),
    createVisitorCategory: (data: Omit<VisitorCategory, 'id_category'>) =>
        apiRequest("POST", `${API_BASE_URL}/admin/visitor-categories`, data).then(handleResponse<ApiResponse<VisitorCategory>>),
    updateVisitorCategory: (id: string, data: Partial<Omit<VisitorCategory, 'id_category'>>) =>
        apiRequest("PUT", `${API_BASE_URL}/admin/visitor-categories/${id}`, data).then(handleResponse<ApiResponse<VisitorCategory>>),
    deleteVisitorCategory: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/admin/visitor-categories/${id}`).then(handleResponse),
};

export const ticketPriceApi = {
    getTicketPrices: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/admin/ticket/`, params)).then(handleResponse<ApiResponse<TicketPrice[]>>),
    getTicketPriceById: (id: string) =>
        apiRequest("GET", `${API_BASE_URL}/admin/ticket/${id}`).then(handleResponse<ApiResponse<TicketPrice>>),
    createTicketPrice: (data: InsertTicketPrice) =>
        apiRequest("POST", `${API_BASE_URL}/admin/ticket`, data).then(handleResponse<ApiResponse<TicketPrice>>),
    updateTicketPrice: (id: string, data: Partial<InsertTicketPrice>) =>
        apiRequest("PUT", `${API_BASE_URL}/admin/ticket/${id}`, data).then(handleResponse<ApiResponse<TicketPrice>>),
    deleteTicketPrice: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/admin/ticket/${id}`).then(handleResponse),
};

export const bookingApi = {
    // Get all bookings with pagination and optional status filter
    getBookings: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/admin/booking`, params)).then(handleResponse<ApiResponse<Booking[]>>),
    
    // Get booking by ID
    getBookingById: (id: string) =>
        apiRequest("GET", `${API_BASE_URL}/admin/booking/${id}`).then(handleResponse<ApiResponse<Booking>>),
    
    // Get booking analytics
    getAnalytics: () =>
        apiRequest("GET", `${API_BASE_URL}/admin/booking/analytics`).then(handleResponse<ApiResponse<BookingAnalytics>>),
    
    // Search bookings with filters
    searchBookings: (params: BookingSearchParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/admin/booking/search`, params)).then(handleResponse<ApiResponse<Booking[]>>),
    
    // Create on-site booking
    createOnsiteBooking: (data: OnsiteBookingPayload) =>
        apiRequest("POST", `${API_BASE_URL}/admin/booking/onsite`, data).then(handleResponse<ApiResponse<Booking>>),
    
    // Redeem booking by scanning QR code
    redeemBooking: (id_booking: string) =>
        apiRequest("POST", `${API_BASE_URL}/admin/booking/redeem`, { id_booking }).then(handleResponse<ApiResponse<Booking>>),
};

export const dashboardApi = {
    getStatistics: (params?: { month?: number; year?: number; gate?: string }) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/admin/dashboard/statistics`, params || {})).then(handleResponse<ApiResponse<DashboardStatistics>>),
};

export const newsApi = {
    getAllNews: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/admin/news`, params)).then(handleResponse<ApiResponse<News[]>>),
    getNewsById: (id: string) =>
        apiRequest("GET", `${API_BASE_URL}/admin/news/${id}`).then(handleResponse<ApiResponse<News>>),
    createNews: (data: FormData) =>
        apiMultipartRequest("POST", `${API_BASE_URL}/admin/news`, data).then(handleResponse<ApiResponse<News>>),
    updateNews: (id: string, data: FormData) =>
        apiMultipartRequest("PUT", `${API_BASE_URL}/admin/news/${id}`, data).then(handleResponse<ApiResponse<News>>),
    deleteNews: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/admin/news/${id}`).then(handleResponse),
};

export const eventApi = {
    getAllEvents: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/admin/events`, params)).then(handleResponse<ApiResponse<Event[]>>),
    getEventById: (id: string) =>
        apiRequest("GET", `${API_BASE_URL}/admin/events/${id}`).then(handleResponse<ApiResponse<Event>>),
    createEvent: (data: FormData) =>
        apiMultipartRequest("POST", `${API_BASE_URL}/admin/events`, data).then(handleResponse<ApiResponse<Event>>),
    updateEvent: (id: string, data: FormData) =>
        apiMultipartRequest("PUT", `${API_BASE_URL}/admin/events/${id}`, data).then(handleResponse<ApiResponse<Event>>),
    deleteEvent: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/admin/events/${id}`).then(handleResponse),
};

export const destinationApi = {
    getAllDestinations: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/admin/destinations`, params)).then(handleResponse<ApiResponse<Destination[]>>),
    getDestinationById: (id: string) =>
        apiRequest("GET", `${API_BASE_URL}/admin/destinations/${id}`).then(handleResponse<ApiResponse<Destination>>),
    createDestination: (data: FormData) =>
        apiMultipartRequest("POST", `${API_BASE_URL}/admin/destinations`, data).then(handleResponse<ApiResponse<Destination>>),
    updateDestination: (id: string, data: FormData) =>
        apiMultipartRequest("PUT", `${API_BASE_URL}/admin/destinations/${id}`, data).then(handleResponse<ApiResponse<Destination>>),
    deleteDestination: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/admin/destinations/${id}`).then(handleResponse),
};
export
 interface SKMSurvey {
    id_survey: string;
    survey_date: string;
    survey_time: string;
    access_location: string;
    is_disabled: boolean;
    disability_type: string | null;
    gender: string;
    age: number;
    education: string;
    occupation: string;
    service_type: string;
    service_received_date: string;
    service_received_time: string;
    q1_requirement_match: number;
    q2_procedure_ease: number;
    q3_time_match: number;
    q4_cost_match: number;
    q5_product_match: number;
    q6a_app_speed: number;
    q6b_staff_competence: number;
    q7a_app_ease: number;
    q7b_staff_behavior: number;
    q8_complaint_channel: number;
    q9a_app_content: number;
    q9b_facilities: number;
    q10_feedback: string;
    created_on: string;
}

export interface SKMStatistics {
    total_responses: number;
    ikm_score: number;
    ikm_category: string;
    best_dimension: {
        key: string;
        label: string;
        score: number;
    };
    lowest_dimension: {
        key: string;
        label: string;
        score: number;
    };
    average_scores: {
        q1_requirement_match: number;
        q2_procedure_ease: number;
        q3_time_match: number;
        q4_cost_match: number;
        q5_product_match: number;
        q6a_app_speed: number;
        q6b_staff_competence: number;
        q7a_app_ease: number;
        q7b_staff_behavior: number;
        q8_complaint_channel: number;
        q9a_app_content: number;
        q9b_facilities: number;
    };
    demographics: {
        by_gender: Record<string, number>;
        by_education: Record<string, number>;
        by_service_type: Record<string, number>;
        disabled_count: number;
    };
}

export const skmApi = {
    getSurveys: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/admin/skm`, params)).then(handleResponse<ApiResponse<SKMSurvey[]>>),
    searchSurveys: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/admin/skm/search`, params)).then(handleResponse<ApiResponse<SKMSurvey[]>>),
    getStatistics: () =>
        apiRequest("GET", `${API_BASE_URL}/admin/skm/statistics`).then(handleResponse<ApiResponse<SKMStatistics>>),
    getSurveyById: (id: string) =>
        apiRequest("GET", `${API_BASE_URL}/admin/skm/${id}`).then(handleResponse<ApiResponse<SKMSurvey>>),
    deleteSurvey: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/admin/skm/${id}`).then(handleResponse),
    exportSurveys: (params: QueryParams = {}) => {
        const url = createUrlWithParams(`${API_BASE_URL}/admin/skm/export`, params);
        return apiRequest("GET", url).then(res => res.blob());
    },
};

export interface Pelaporan {
    id_pelaporan: string;
    id_user: string;
    full_name: string;
    email: string;
    phone: string;
    gender: string;
    status: string;
    complaint_type: string;
    description: string;
    priority: string;
    complaint_status: string;
    response: string | null;
    created_on: string;
    updated_on?: string;
    user?: {
        full_name: string;
        email: string;
    };
}

export interface PelaporanAnalytics {
    total_reports: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    by_complaint_type: Record<string, number>;
    by_gender: Record<string, number>;
    by_user_status: Record<string, number>;
    recent_reports: Array<{
        id_pelaporan: string;
        full_name: string;
        complaint_type: string;
        complaint_status: string;
        priority: string;
        created_on: string;
    }>;
}

export const pelaporanApi = {
    getReports: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/admin/pelaporan`, params)).then(handleResponse<ApiResponse<Pelaporan[]>>),
    getAnalytics: () =>
        apiRequest("GET", `${API_BASE_URL}/admin/pelaporan/analytics`).then(handleResponse<ApiResponse<PelaporanAnalytics>>),
    getReportById: (id: string) =>
        apiRequest("GET", `${API_BASE_URL}/admin/pelaporan/${id}`).then(handleResponse<ApiResponse<Pelaporan>>),
    updateStatus: (id: string, data: { status: string; response: string }) =>
        apiRequest("PATCH", `${API_BASE_URL}/admin/pelaporan/${id}/status`, data).then(handleResponse<ApiResponse<Pelaporan>>),
    deleteReport: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/admin/pelaporan/${id}`).then(handleResponse),
};

export interface Whistleblowing {
    id_wbs: string;
    email: string;
    phone: string;
    gender: string;
    what: string;
    where: string;
    when: string;
    who: string;
    how: string;
    evidence: string;
    description: string;
    priority: string;
    files: string[];
    status: string;
    internal_notes: string | null;
    handled_by: string | null;
    handled_at: string | null;
    created_on: string;
    updated_on?: string;
}

export interface WhistleblowingAnalytics {
    total_reports: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    by_gender: Record<string, number>;
    recent_reports: Array<{
        id_wbs: string;
        gender: string;
        priority: string;
        status: string;
        created_on: string;
    }>;
}

export const whistleblowingApi = {
    getReports: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/admin/whistleblowing`, params)).then(handleResponse<ApiResponse<Whistleblowing[]>>),
    getAnalytics: () =>
        apiRequest("GET", `${API_BASE_URL}/admin/whistleblowing/analytics`).then(handleResponse<ApiResponse<WhistleblowingAnalytics>>),
    getReportById: (id: string) =>
        apiRequest("GET", `${API_BASE_URL}/admin/whistleblowing/${id}`).then(handleResponse<ApiResponse<Whistleblowing>>),
    updateStatus: (id: string, data: { status: string; internal_notes: string }) =>
        apiRequest("PATCH", `${API_BASE_URL}/admin/whistleblowing/${id}/status`, data).then(handleResponse<ApiResponse<Whistleblowing>>),
    deleteReport: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/admin/whistleblowing/${id}`).then(handleResponse),
};
