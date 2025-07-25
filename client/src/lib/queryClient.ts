import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();

export const apiRequest = async <T>(
  method: string,
  url: string,
  data?: T,
  headers: HeadersInit = {}
): Promise<Response> => {
  const token = localStorage.getItem("access_token");
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    (defaultHeaders as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: defaultHeaders,
    body: data ? JSON.stringify(data) : undefined,
  });

  // FIX: The check for response.ok is removed from here.
  // This allows the handleResponse function in api.ts to process
  // both successful and error responses with JSON bodies.
  return response;
};

export const apiMultipartRequest = async (
    method: string,
    url: string,
    data: FormData,
    headers: HeadersInit = {}
  ): Promise<Response> => {
    const token = localStorage.getItem("access_token");
    const defaultHeaders: HeadersInit = {
      ...headers,
    };
  
    if (token) {
      (defaultHeaders as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  
    const response = await fetch(url, {
      method,
      headers: defaultHeaders,
      body: data,
    });
  
    return response;
  };
