const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Helper function to get auth token
const getToken = () => {
  return localStorage.getItem("accessToken");
};

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Something went wrong");
  }

  return response.json();
};

// Authentication APIs
export const authAPI = {
  signup: (data) =>
    apiCall("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: async (credentials) => {
    const data = await apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    // Save token to localStorage
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  },

  getProfile: () => apiCall("/auth/profile"),

  updateProfile: (data) =>
    apiCall("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// Admin APIs
export const adminAPI = {
  getAll: (search = "") => apiCall(`/admins?search=${search}`),
  getById: (adminId) => apiCall(`/admins/${adminId}`),
};

// Availability APIs
export const availabilityAPI = {
  create: (data) =>
    apiCall("/availability", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAdminAvailability: (adminId) => apiCall(`/availability/admin/${adminId}`),

  getMy: () => apiCall("/availability/my"),

  update: (availabilityId, data) =>
    apiCall(`/availability/${availabilityId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (availabilityId) =>
    apiCall(`/availability/${availabilityId}`, {
      method: "DELETE",
    }),
};

// Appointment APIs
export const appointmentAPI = {
  getSlots: (adminId, date) =>
    apiCall(`/appointments/slots?adminId=${adminId}&date=${date}`),

  book: (data) =>
    apiCall("/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMy: (status = "") =>
    apiCall(`/appointments/my${status ? `?status=${status}` : ""}`),

  cancel: (appointmentId) =>
    apiCall(`/appointments/${appointmentId}/cancel`, {
      method: "PUT",
    }),

  getAdminAppointments: (status = "", date = "") => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (date) params.append("date", date);
    return apiCall(`/appointments/admin?${params}`);
  },

  updateStatus: (appointmentId, status) =>
    apiCall(`/appointments/${appointmentId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};
