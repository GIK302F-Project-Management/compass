// Eğer mock veriler kullanacaksan buraya mock dosyasını bağlayabilirsin,
// ya da doğrudan backend endpoint'lerine göre hazırlayabilirsin.

export type Goal = {
  id: string
  title: string
  description: string
  ownerEmail: string
}

export type GoalChanges = {
  title: string
  description: string
}

export type NewGoalInput = GoalChanges & {
  ownerEmail: string
}

// GET /goals?email=<ownerEmail> (veya benzeri endpoint)
export async function listGoals(ownerEmail: string): Promise<Goal[]> {
  // Backend bağlandığında fetch isteği buraya gelecek
  // Örn: const response = await fetch(`/goals?email=${ownerEmail}`); return response.json();
  throw new Error("Not implemented yet");
}

// GET /goals/<id>
export async function getGoal(id: string): Promise<Goal | null> {
  throw new Error("Not implemented yet");
}

// POST /goals
export async function createGoal(input: NewGoalInput): Promise<Goal> {
  throw new Error("Not implemented yet");
}

// PUT /goals/<id>
export async function updateGoal(id: string, changes: GoalChanges): Promise<Goal> {
  throw new Error("Not implemented yet");
}

// DELETE /goals/<id>
export async function deleteGoal(id: string): Promise<void> {
  throw new Error("Not implemented yet");
}