// src/services/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://filpulse.onrender.com/api',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach access token
api.interceptors.request.use(
  (config) => {
    // Get token from Zustand persisted state
    const stored = localStorage.getItem('finpulse-auth')
    if (stored) {
      const { state } = JSON.parse(stored)
      if (state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`
      }
    }
    return config
  },
  (err) => Promise.reject(err)
)

// Response interceptor: handle 401 / token refresh
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch(Promise.reject)
      }

      originalRequest._retry = true
      isRefreshing = true

      const stored = localStorage.getItem('finpulse-auth')
      const refreshToken = stored ? JSON.parse(stored).state?.refreshToken : null

      if (!refreshToken) {
        isRefreshing = false
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post('https://filpulse.onrender.com/api/auth/refresh', { refreshToken })
        const newToken = data.data.accessToken

        // Update stored token
        const parsedStored = JSON.parse(stored)
        parsedStored.state.accessToken = newToken
        parsedStored.state.refreshToken = data.data.refreshToken
        localStorage.setItem('finpulse-auth', JSON.stringify(parsedStored))

        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        originalRequest.headers.Authorization = `Bearer ${newToken}`

        processQueue(null, newToken)
        return api(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        localStorage.removeItem('finpulse-auth')
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
