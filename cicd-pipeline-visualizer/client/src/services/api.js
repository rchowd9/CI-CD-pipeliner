import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          toast.error('Unauthorized. Please login again.');
          break;
        case 403:
          toast.error('Access forbidden.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          toast.error('Internal server error. Please try again later.');
          break;
        default:
          toast.error(data?.message || `Request failed with status ${status}`);
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const pipelinesAPI = {
  getAll: (params = {}) => api.get('/pipelines', { params }),
  getById: (id) => api.get(`/pipelines/${id}`),
  create: (data) => api.post('/pipelines', data),
  update: (id, data) => api.put(`/pipelines/${id}`, data),
  delete: (id) => api.delete(`/pipelines/${id}`),
};

export const metricsAPI = {
  getDashboard: (params = {}) => api.get('/metrics/dashboard', { params }),
  getDORA: (params = {}) => api.get('/metrics/dora', { params }),
};

export const githubAPI = {
  getRepositories: (params = {}) => api.get('/github/repositories', { params }),
  getWorkflows: (owner, repo) => api.get(`/github/repositories/${owner}/${repo}/workflows`),
};

// Utility functions
export const formatDuration = (seconds) => {
  if (!seconds) return 'N/A';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const getStatusColor = (status, conclusion) => {
  if (status === 'in_progress') return 'warning';
  if (status === 'queued') return 'gray';
  if (status === 'completed') {
    if (conclusion === 'success') return 'success';
    if (conclusion === 'failure') return 'danger';
    if (conclusion === 'cancelled') return 'gray';
  }
  return 'gray';
};

export default api;