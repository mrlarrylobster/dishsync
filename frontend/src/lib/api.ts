const API_BASE = '/api'

function getToken() {
  return localStorage.getItem('dishsync_token')
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/* ─── Auth ─── */

export async function register(email: string, password: string, display_name: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, display_name }),
  })
  if (!res.ok) throw new Error('Registration failed')
  const data = await res.json()
  localStorage.setItem('dishsync_token', data.token)
  return data
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Login failed')
  const data = await res.json()
  localStorage.setItem('dishsync_token', data.token)
  return data
}

/* ─── Couple ─── */

export async function createCouple(time_budget = 60) {
  const res = await fetch(`${API_BASE}/couples`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ time_budget_minutes: time_budget }),
  })
  if (!res.ok) throw new Error('Failed to create couple')
  return res.json()
}

export async function joinCouple(invite_code: string) {
  const res = await fetch(`${API_BASE}/couples/join`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ invite_code }),
  })
  if (!res.ok) throw new Error('Failed to join couple')
  return res.json()
}

export async function getCouple() {
  const res = await fetch(`${API_BASE}/couples/me`, {
    headers: authHeaders(),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to get couple')
  return res.json()
}

/* ─── Recipes ─── */

export async function getRecipeFeed(limit = 20) {
  const res = await fetch(`${API_BASE}/recipes/feed?limit=${limit}`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch recipes')
  return res.json()
}

/* ─── Swipes ─── */

export async function swipeRecipe(recipe_id: string, direction: 'left' | 'right') {
  const res = await fetch(`${API_BASE}/swipes`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipe_id, direction }),
  })
  if (!res.ok) throw new Error('Swipe failed')
  return res.json()
}

/* ─── Matches ─── */

export async function getMatches() {
  const res = await fetch(`${API_BASE}/matches`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to get matches')
  return res.json()
}

export async function updateMatchStatus(match_id: string, status: string) {
  const res = await fetch(`${API_BASE}/matches/${match_id}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update match')
  return res.json()
}

/* ─── Calendar ─── */

export async function getCalendar() {
  const res = await fetch(`${API_BASE}/calendar/current`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to get calendar')
  return res.json()
}

export async function scheduleMatch(match_id: string, day: string) {
  const res = await fetch(`${API_BASE}/matches/${match_id}/schedule`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ match_id, day }),
  })
  if (!res.ok) throw new Error('Failed to schedule')
  return res.json()
}

export async function autoSchedule() {
  const res = await fetch(`${API_BASE}/calendar/auto-schedule`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Auto-schedule failed')
  return res.json()
}

/* ─── Pantry ─── */

export async function getPantry() {
  const res = await fetch(`${API_BASE}/pantry`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to get pantry')
  return res.json()
}

export async function addPantryItem(item: any) {
  const res = await fetch(`${API_BASE}/pantry`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  if (!res.ok) throw new Error('Failed to add pantry item')
  return res.json()
}

/* ─── Grocery ─── */

export async function getGroceryList() {
  const res = await fetch(`${API_BASE}/grocery/current`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to get grocery list')
  return res.json()
}

export async function checkGroceryItem(item_id: string, is_checked: boolean) {
  const res = await fetch(`${API_BASE}/grocery/check`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ item_id, is_checked }),
  })
  if (!res.ok) throw new Error('Failed to update item')
  return res.json()
}

export async function exportGroceryList() {
  const res = await fetch(`${API_BASE}/grocery/export`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to export grocery list')
  return res.json()
}

/* ─── Recipe Image ─── */

export async function getRecipeImageUrl(recipe_id: string) {
  const res = await fetch(`${API_BASE}/recipes/${recipe_id}/image`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to get image')
  const data = await res.json()
  return data.image_url
}

/* ─── Veto ─── */

export async function requestVeto(day: string) {
  const res = await fetch(`${API_BASE}/calendar/${day}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to request veto')
  return res.json()
}

export async function resolveVeto(veto_id: string, approve: boolean) {
  const res = await fetch(`${API_BASE}/vetos/${veto_id}/resolve`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ approve }),
  })
  if (!res.ok) throw new Error('Failed to resolve veto')
  return res.json()
}

/* ─── Calendar ─── */

export async function clearCalendar() {
  const res = await fetch(`${API_BASE}/calendar/clear`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to clear calendar')
  return res.json()
}

/* ─── Couple Settings ─── */

export async function updateCouple(updates: { time_budget_minutes?: number; dietary_restrictions?: string[]; disliked_ingredients?: string[] }) {
  const res = await fetch(`${API_BASE}/couples/me`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update couple')
  return res.json()
}

/* ─── Pantry Decay ─── */

export async function triggerPantryDecay() {
  const res = await fetch(`${API_BASE}/pantry/decay`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to trigger decay')
  return res.json()
}
