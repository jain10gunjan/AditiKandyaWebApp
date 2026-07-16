export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

async function parseErrorMessage(res, fallback) {
	let errorMessage = fallback
	let errorData = null
	try {
		errorData = await res.json()
		errorMessage = errorData.error || errorData.message || errorMessage
	} catch (_) {
		errorMessage = res.statusText || errorMessage
	}
	const error = new Error(errorMessage)
	error.response = { status: res.status, data: errorData }
	throw error
}

export async function apiGet(path, token) {
	const headers = {}
	if (token) headers['Authorization'] = `Bearer ${token}`
	const res = await fetch(`${API_BASE_URL}${path}`, { headers })
	if (!res.ok) await parseErrorMessage(res, `GET ${path} failed: ${res.status}`)
	return res.json()
}

export async function apiPost(path, body, token) {
	const headers = { 'Content-Type': 'application/json' }
	if (token) headers['Authorization'] = `Bearer ${token}`
	const res = await fetch(`${API_BASE_URL}${path}`, {
		method: 'POST',
		headers,
		body: JSON.stringify(body || {}),
	})
	if (!res.ok) await parseErrorMessage(res, `POST ${path} failed: ${res.status}`)
	return res.json()
}

export async function apiPut(path, body, token) {
	const headers = { 'Content-Type': 'application/json' }
	if (token) headers['Authorization'] = `Bearer ${token}`
	const res = await fetch(`${API_BASE_URL}${path}`, {
		method: 'PUT',
		headers,
		body: JSON.stringify(body || {}),
	})
	if (!res.ok) await parseErrorMessage(res, `PUT ${path} failed: ${res.status}`)
	return res.json()
}

export async function apiPatch(path, body, token) {
	const headers = { 'Content-Type': 'application/json' }
	if (token) headers['Authorization'] = `Bearer ${token}`
	const res = await fetch(`${API_BASE_URL}${path}`, {
		method: 'PATCH',
		headers,
		body: JSON.stringify(body || {}),
	})
	if (!res.ok) await parseErrorMessage(res, `PATCH ${path} failed: ${res.status}`)
	return res.json()
}

export async function apiDelete(path, token) {
	const headers = {}
	if (token) headers['Authorization'] = `Bearer ${token}`
	const res = await fetch(`${API_BASE_URL}${path}`, { method: 'DELETE', headers })
	if (!res.ok) await parseErrorMessage(res, `DELETE ${path} failed: ${res.status}`)
	// Some DELETE endpoints return empty bodies
	const text = await res.text()
	if (!text) return { ok: true }
	try {
		return JSON.parse(text)
	} catch (_) {
		return { ok: true }
	}
}
