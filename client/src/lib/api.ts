import { apiRequest, apiMultipartRequest } from "@/lib/queryClient";
import { get } from "http";

// --- Environment Variable Setup ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined. Please check your .env.local file.");
}

// --- Generic API Helpers ---
const handleResponse = <T>(res: Response): Promise<T> => res.json();

// --- Generic API Response Structure ---
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

// --- Type Definitions ---
export interface Banner {
  id_banner: string;
  image_url: string;
  is_active: boolean;
}

export type InsertBanner = {
    image: FileList;
    is_active: boolean;
};

export interface ProductCategory {
  id_category: string;
  name: string;
  icon_url: string;
}

export type InsertProductCategory = {
    name: string;
    icon?: FileList; 
};


export interface GuestBook {
  id_guest_book: string;
  id_event: string;
  date: string;
  created_on: string;
  updated_on: string;
}

export type InsertGuestBook = {
    guest_book_date: string; 
    id_event: string;
};

export interface Event {
    id_event: string;
    name: string;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
    created_on: string;
    updated_on: string;
    created_by: string;
    updated_by: string;
}

export type InsertEvent = {
    name: string;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
};

export interface Team {
    id_team: string;
    name: string;
}

export type InsertTeam = {
    name: string;
};

export interface TeamMember {
    id_user: string;
    full_name: string;
    email: string;
}

export interface User {
    id_user: string;
    email: string;
    full_name: string;
    role: string;
}

export type AssignTeamMember = {
    id_users: string[];
};

export interface HealthStatus {
    status: string;
    uptime_seconds: number;
    system: {
        platform: string;
        platform_version: string;
        architecture: string;
        cpu_usage_percent: number;
        memory: {
            total_mb: number;
            available_mb: number;
            used_percent: number;
        };
    };
}

export interface Product {
    id_product: string;
    id_team: string;
    id_category: string;
    id_event: string;
    name: string;
    description: string;
    created_on: string;
    updated_on: string;
    image_urls: string[];
}

export type InsertProduct = {
    name: string;
    description: string;
    id_team: string;
    id_category: string;
    id_event: string;
    images: FileList;
};

export interface Attendance {
    id_guest_book_attendance: string;
    id_guest_book: string;
    id_user: string;
    comment: string;
    created_on: string;
    full_name: string;
    email: string;
}

export interface FitalkParticipant {
    id_fitalk_participant: string;
    id_event: string;
    registration_id: string;
    full_name: string;
    email: string;
    home_institution: string;
    created_on: string;
}

export type InsertFitalkParticipant = {
    id_event: string;
    registration_id: string;
    full_name: string;
    email: string;
    home_institution: string;
};

export interface FitalkAttendance {
    id_fitalk_attendance: string;
    id_registration: string;
    name: string;
    email: string;
    attended_on: string;
}

export type InsertFitalkAttendance = {
    id_event: string;
    registration_id: string;
};

export interface BadgeType {
    id_badge_type: string;
    name: string;
    value: number;
    image_url: string;
}

export type InsertBadgeType = {
    name: string;
    value: number;
    image: FileList;
};

export interface UserBadge {
    id_user_event_badge: string;
    quantity: number;
    badge_type_name: string;
    badge_type_image_url: string;
}

export type AddUserBadge = {
    id_user: string;
    id_event: string;
    id_badge_type: string;
    quantity: number;
};

export interface QueryParams {
    page?: number;
    search?: string;
    [key: string]: any;
}


export interface LoginData {
  email: string;
  password?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface LeaderboardEntry {
    id_product: string;
    product_name: string;
    total_score: number;
    rating_count: number;
    last_updated_on: string;
}

export interface LeaderboardQueryParams extends QueryParams {
    category_id?: string;
}

export interface InsertBulkUser {
  full_name: string;
  email: string;
}

// --- API Endpoints ---

const createUrlWithParams = (baseUrl: string, params: QueryParams) => {
    const query = new URLSearchParams();
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) {
            query.append(key, String(params[key]));
        }
    }
    return `${baseUrl}?${query.toString()}`;
}

export const authApi = {
  login: (data: LoginData) =>
    apiRequest("POST", `${API_BASE_URL}/v1/auth/login`, data).then(handleResponse<ApiResponse<AuthResponse>>),
  getMe: () =>
    apiRequest("GET", `${API_BASE_URL}/v1/auth/me`).then(handleResponse<ApiResponse<User>>),
   bulkRegister: (data: { users: { email: string; full_name: string }[] }) =>
    apiRequest("POST", `${API_BASE_URL}/v1/auth/bulk-register`, data).then(handleResponse),
  
};

export const productCategoryApi = {
  getProductCategories: (params: QueryParams = {}) => 
    apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/v1/product-categories/`, params)).then(handleResponse<ApiResponse<ProductCategory[]>>),
  createProductCategory: (data: FormData) => 
    apiMultipartRequest("POST", `${API_BASE_URL}/v1/product-categories/`, data).then(handleResponse<ApiResponse<ProductCategory>>),
  updateProductCategory: (id: string, data: FormData) => 
    apiMultipartRequest("PUT", `${API_BASE_URL}/v1/product-categories/${id}`, data).then(handleResponse<ApiResponse<ProductCategory>>),
  deleteProductCategory: (id: string) => 
    apiRequest("DELETE", `${API_BASE_URL}/v1/product-categories/${id}`).then(handleResponse),
};

export const bannerApi = {
  getBanners: (params: QueryParams = {}) => 
    apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/v1/banners/`, params)).then(handleResponse<ApiResponse<Banner[]>>), 
  createBanner: (data: FormData) => 
    apiMultipartRequest("POST", `${API_BASE_URL}/v1/banners/`, data).then(handleResponse<ApiResponse<Banner>>),
  updateBanner: (id: string, data: FormData) => 
    apiMultipartRequest("PUT", `${API_BASE_URL}/v1/banners/${id}`, data).then(handleResponse<ApiResponse<Banner>>),
  deleteBanner: (id: string) => 
    apiRequest("DELETE", `${API_BASE_URL}/v1/banners/${id}`).then(handleResponse),
  activateBanner: (id: string) => 
    apiRequest("PUT", `${API_BASE_URL}/v1/banners/activate/${id}`).then(handleResponse),
  deactivateBanner: (id: string) => 
    apiRequest("PUT", `${API_BASE_URL}/v1/banners/deactivate/${id}`).then(handleResponse),
};

export const guestBookApi = {
  getGuestBooks: (params: QueryParams = {}) =>
    apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/v1/guest-books/`, params)).then(handleResponse<ApiResponse<GuestBook[]>>),
  getGuestBooksByEvent: (id_event: string, params: QueryParams = {}) =>
    apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/v1/guest-books/event/${id_event}`, params)).then(handleResponse<ApiResponse<GuestBook[]>>),
  createGuestBook: (data: InsertGuestBook) =>
    apiRequest("POST", `${API_BASE_URL}/v1/guest-books/`, data).then(handleResponse<ApiResponse<GuestBook>>),
  deleteGuestBook: (id_guest_book: string) =>
    apiRequest("DELETE", `${API_BASE_URL}/v1/guest-books/${id_guest_book}`).then(handleResponse),
  getTodaysGuestBook: () =>
    apiRequest("GET", `${API_BASE_URL}/v1/guest-books/today`).then(handleResponse<ApiResponse<GuestBook>>),
  getAttendancesByGuestBook: (id_guest_book: string, params: QueryParams = {}) =>
    apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/v1/guest-books/${id_guest_book}/attendances`, params)).then(handleResponse<ApiResponse<Attendance[]>>),
  getAttendancesByEvent: (id_event: string, params: QueryParams = {}) =>
    apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/v1/guest-books/event/${id_event}/attendances`, params)).then(handleResponse<ApiResponse<Attendance[]>>),
};

export const eventApi = {
    getEvents: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/v1/events/`, params)).then(handleResponse<ApiResponse<Event[]>>),
    getEventById: (id: string) =>
        apiRequest("GET", `${API_BASE_URL}/v1/events/${id}`).then(handleResponse<ApiResponse<Event[]>>),
    createEvent: (data: InsertEvent) =>
        apiRequest("POST", `${API_BASE_URL}/v1/events/`, data).then(handleResponse<ApiResponse<Event>>),
    updateEvent: (id: string, data: Partial<InsertEvent>) =>
        apiRequest("PUT", `${API_BASE_URL}/v1/events/${id}`, data).then(handleResponse<ApiResponse<Event>>),
    deleteEvent: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/v1/events/${id}`).then(handleResponse),
};

export const teamApi = {
    getTeams: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/v1/teams/`, params)).then(handleResponse<ApiResponse<Team[]>>),
    getTeamById: (id: string) =>
        apiRequest("GET", `${API_BASE_URL}/v1/teams/${id}`).then(handleResponse<ApiResponse<Team>>),
    createTeam: (data: InsertTeam) =>
        apiRequest("POST", `${API_BASE_URL}/v1/teams/`, data).then(handleResponse<ApiResponse<Team>>),
    updateTeam: (id: string, data: Partial<InsertTeam>) =>
        apiRequest("PUT", `${API_BASE_URL}/v1/teams/${id}`, data).then(handleResponse<ApiResponse<Team>>),
    deleteTeam: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/v1/teams/${id}`).then(handleResponse),
};

export const teamMemberApi = {
    getTeamMembers: (id_team: string, params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/v1/teams/${id_team}/members`, params)).then(handleResponse<ApiResponse<TeamMember[]>>),
    assignTeamMember: (id_team: string, data: AssignTeamMember) =>
        apiRequest("POST", `${API_BASE_URL}/v1/teams/${id_team}/members`, data).then(handleResponse<ApiResponse<TeamMember>>),
    removeTeamMember: (id_team: string, id_user: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/v1/teams/${id_team}/members/${id_user}`).then(handleResponse),
};

export const userApi = {
    getUsers: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/v1/users/`, params)).then(handleResponse<ApiResponse<User[]>>),
    getUserById: (id_user: string) =>
        apiRequest("GET", `${API_BASE_URL}/v1/users/${id_user}`).then(handleResponse<ApiResponse<User>>),
};

export const healthApi = {
    getHealth: () =>
        apiRequest("GET", `${API_BASE_URL}/health`).then(handleResponse<HealthStatus>),
};

export const productApi = {
    getProducts: (params: QueryParams) => {
        return apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/v1/products/`, params)).then(handleResponse<ApiResponse<Product[]>>);
    },
    createProduct: (data: FormData) =>
        apiMultipartRequest("POST", `${API_BASE_URL}/v1/products/`, data).then(handleResponse<ApiResponse<Product>>),
    updateProduct: (id: string, data: FormData) =>
        apiMultipartRequest("PUT", `${API_BASE_URL}/v1/products/${id}`, data).then(handleResponse<ApiResponse<Product>>),
    deleteProduct: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/v1/products/${id}`).then(handleResponse),
};

export const fitalkApi = {
 getParticipants: (params: QueryParams) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/v1/fitalk/participants`, params)).then(handleResponse<ApiResponse<FitalkParticipant[]>>),
    addParticipant: (data: InsertFitalkParticipant) =>
        apiRequest("POST", `${API_BASE_URL}/v1/fitalk/participants`, data).then(handleResponse<ApiResponse<FitalkParticipant>>),
    getAttendances: (id_event: string, page: number) =>
        apiRequest("GET", `${API_BASE_URL}/v1/fitalk/attendances?id_event=${id_event}&page=${page}`).then(handleResponse<ApiResponse<FitalkAttendance>>),
    addAttendance: (data: InsertFitalkAttendance) =>
        apiRequest("POST", `${API_BASE_URL}/v1/fitalk/attend`, data).then(handleResponse<ApiResponse<FitalkAttendance>>),
};

export const badgeApi = {
    getBadges: (params: QueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/v1/badge-types/`, params)).then(handleResponse<ApiResponse<BadgeType[]>>),
    createBadge: (data: FormData) =>
        apiMultipartRequest("POST", `${API_BASE_URL}/v1/badge-types/`, data).then(handleResponse<ApiResponse<BadgeType>>),
    updateBadge: (id: string, data: FormData) =>
        apiMultipartRequest("PUT", `${API_BASE_URL}/v1/badge-types/${id}`, data).then(handleResponse<ApiResponse<BadgeType>>),
    deleteBadge: (id: string) =>
        apiRequest("DELETE", `${API_BASE_URL}/v1/badge-types/${id}`).then(handleResponse),
    getUserBadges: (id_user: string) =>
        apiRequest("GET", `${API_BASE_URL}/v1/badges/user/${id_user}`).then(handleResponse<ApiResponse<UserBadge[]>>),
    assignBadge: (data: AddUserBadge) =>
        apiRequest("POST", `${API_BASE_URL}/v1/badges/assign`, data).then(handleResponse<ApiResponse<UserBadge>>),
};

export const leaderboardApi = {
    getLeaderboard: (id_event: string, params: LeaderboardQueryParams = {}) =>
        apiRequest("GET", createUrlWithParams(`${API_BASE_URL}/v1/leaderboard/${id_event}`, params)).then(handleResponse<ApiResponse<LeaderboardEntry[]>>),
};
