export async function getUser() {
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  try {
    const response = await fetch(baseURL + "/profiles/", {
      method: "GET",
      credentials: "include", // send cookies
    })

    if (!response.ok) return null

    return await response.json() // { username: ..., email: ... }
  } catch (error) {
    console.error("User fetch failed:", error)
    return null
  }
}
