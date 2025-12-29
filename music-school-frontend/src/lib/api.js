export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

export async function apiGet(path, token) {
	const headers = {}
	if (token) headers['Authorization'] = `Bearer ${token}`
	const res = await fetch(`${API_BASE_URL}${path}`, { headers })
	if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
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
	if (!res.ok) {
		let errorMessage = `POST ${path} failed: ${res.status}`
		let errorData = null
		try {
			errorData = await res.json()
			errorMessage = errorData.error || errorData.message || errorMessage
		} catch (e) {
			// If response is not JSON, use status text
			errorMessage = res.statusText || errorMessage
		}
		const error = new Error(errorMessage)
		error.response = { status: res.status, data: errorData }
		throw error
	}
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
	if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`)
	return res.json()
}

export async function apiDelete(path, token) {
	const headers = {}
	if (token) headers['Authorization'] = `Bearer ${token}`
	const res = await fetch(`${API_BASE_URL}${path}`, { method: 'DELETE', headers })
	if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`)
	return res.json()
}