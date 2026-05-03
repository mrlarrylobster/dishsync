const API_BASE = import.meta.env.VITE_API_URL || '/api'

export interface User {
  id: string
  email: string
  name: string
  coupleId: string | null
}

export interface Couple {
  id: string
  code: string
  members: { id: string; name: string }[]
}

export interface Recipe {
  id: string
  title: string
  description: string
  imageUrl: string
  prepTime: number
  cookTime: number
  servings: number
  tags: string[]
  ingredients: Ingredient[]
}

export interface Ingredient {
  name: string
  amount: string
  unit: string
  checked?: boolean
}

export interface PantryItem {
  id: string
  name: string
  quantity: string
  unit: string
  expiresAt?: string
  category: string
}

export interface Match {
  id: string
  recipeId: string
  recipe: Recipe
  date: string
  matchedBy: string[]
  cooked: boolean
}

export interface SwipeAction {
  recipeId: string
  liked: boolean
}

/* ─── Auth ─── */

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function register(email: string, password: string, name: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getMe(): Promise<User | null> {
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
  if (res.status === 401) return null
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' })
}

/* ─── Couple ─── */

export async function createCouple(): Promise<Couple> {
  const res = await fetch(`${API_BASE}/couples`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function joinCouple(code: string): Promise<Couple> {
  const res = await fetch(`${API_BASE}/couples/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getCouple(): Promise<Couple | null> {
  const res = await fetch(`${API_BASE}/couples/me`, { credentials: 'include' })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

/* ─── Swipe / Recipes ─── */

export async function getRecipeBatch(): Promise<Recipe[]> {
  const res = await fetch(`${API_BASE}/recipes/batch`, { credentials: 'include' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function submitSwipe(recipeId: string, liked: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/swipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ recipeId, liked }),
  })
  if (!res.ok) throw new Error(await res.text())
}

/* ─── Matches / Calendar ─── */

export async function getMatches(start?: string, end?: string): Promise<Match[]> {
  const qs = start && end ? `?start=${start}&end=${end}` : ''
  const res = await fetch(`${API_BASE}/matches${qs}`, { credentials: 'include' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function markCooked(matchId: string, cooked: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/matches/${matchId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ cooked }),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function unmatch(matchId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/matches/${matchId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await res.text())
}

/* ─── Pantry ─── */

export async function getPantry(): Promise<PantryItem[]> {
  const res = await fetch(`${API_BASE}/pantry`, { credentials: 'include' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function addPantryItem(item: Omit<PantryItem, 'id'>): Promise<PantryItem> {
  const res = await fetch(`${API_BASE}/pantry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(item),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updatePantryItem(id: string, item: Partial<PantryItem>): Promise<PantryItem> {
  const res = await fetch(`${API_BASE}/pantry/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(item),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function deletePantryItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/pantry/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await res.text())
}

/* ─── Grocery List ─── */

export async function getGroceryList(): Promise<Ingredient[]> {
  const res = await fetch(`${API_BASE}/groceries`, { credentials: 'include' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function addGroceryItem(item: Ingredient): Promise<Ingredient> {
  const res = await fetch(`${API_BASE}/groceries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(item),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function toggleGroceryItem(name: string, checked: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/groceries/${encodeURIComponent(name)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ checked }),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function deleteGroceryItem(name: string): Promise<void> {
  const res = await fetch(`${API_BASE}/groceries/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await res.text())
}
