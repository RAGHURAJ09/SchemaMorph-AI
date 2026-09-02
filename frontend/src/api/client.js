import axios from 'axios'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 60000, // 60s — AI call can be slow
  headers: { 'Content-Type': 'application/json' },
})

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Auth ────────────────────────────────────────────────────────────────────

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export const register = async (email, password) => {
  const { data } = await api.post('/auth/register', { email, password })
  return data
}

// ── Schema ──────────────────────────────────────────────────────────────────

export const uploadSchemaFile = async (file) => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/upload-schema', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const uploadSchemaText = async (schemaText) => {
  const form = new FormData()
  form.append('schema_text', schemaText)
  const { data } = await api.post('/upload-schema', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// ── Queries ─────────────────────────────────────────────────────────────────

export const uploadQueries = async (sessionId, queries) => {
  const { data } = await api.post('/upload-queries', {
    session_id: sessionId,
    queries,
  })
  return data
}

// ── Analysis ─────────────────────────────────────────────────────────────────

export const runAnalysis = async (sessionId) => {
  const { data } = await api.post('/analyze', { session_id: sessionId })
  return data
}

export const getSession = async (sessionId) => {
  const { data } = await api.get(`/session/${sessionId}`)
  return data
}



export default api
