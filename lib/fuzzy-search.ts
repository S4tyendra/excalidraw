export function fuzzySearch(query: string, text: string): boolean {
  if (!query) return true

  const queryLower = query.toLowerCase()
  const textLower = text.toLowerCase()

  // Simple fuzzy search - check if all characters in query appear in order in text
  let queryIndex = 0

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++
    }
  }

  return queryIndex === queryLower.length
}

export function searchProjects(projects: any[], query: string) {
  if (!query.trim()) return projects

  return projects.filter((project) => fuzzySearch(query, project.name) || fuzzySearch(query, project.description || ""))
}
