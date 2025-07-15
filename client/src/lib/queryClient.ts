import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Define the queryClient at the top so it can be used in the error handler
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
});

// This is the key function to handle the logout logic
async function handleApiError(res: Response) {
  if (!res.ok) {
    // If the error is a 401 (Unauthorized), it means the token is expired or invalid.
    if (res.status === 401) {
      // 1. Clear the React Query cache to remove all stale data.
      queryClient.clear();
      // 2. Remove the expired token from local storage.
      localStorage.removeItem("access_token");
      // 3. Redirect the user to the login page.
      window.location.href = '/login'; 
    }
    
    // For other errors, try to parse the message from the backend.
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorData.message || `${res.status}: An error occurred`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem("access_token");
  const headers: HeadersInit = {
    ...(data ? { "Content-Type": "application/json" } : {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  // Use the new error handler
  await handleApiError(res);
  return res;
}

export async function apiMultipartRequest(
  method: string,
  url: string,
  formData: FormData,
): Promise<Response> {
  const token = localStorage.getItem("access_token");
  const headers: HeadersInit = {};

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: formData,
  });

  // Use the new error handler here as well
  await handleApiError(res);
  return res;
}

// The default query function remains, but the error handling is now centralized.
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await apiRequest("GET", queryKey[0] as string);
      return await res.json();
    } catch (error: any) {
      // This logic can be simplified as the main redirect is handled above.
      if (unauthorizedBehavior === "returnNull" && error.message.startsWith('401')) {
        return null;
      }
      throw error;
    }
  };

// Update the queryClient to use the new default queryFn
queryClient.setDefaultOptions({
    queries: {
        queryFn: getQueryFn({ on401: 'throw' })
    }
});
