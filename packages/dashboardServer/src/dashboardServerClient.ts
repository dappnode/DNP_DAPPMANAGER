import {
  DashboardServerPostRequest,
  DashboardServerPostResponse
} from "./types.js";

/**
 * Posts validator indices to the dashboard server.
 *
 * @param baseUrl - The dashboard server base URL
 * @param indices - Array of validator indices to post
 * @returns Response from the dashboard server
 * @throws Error if the HTTP request fails
 */
export async function postValidatorsToDashboard(
  baseUrl: string,
  indices: number[]
): Promise<DashboardServerPostResponse> {
  const url = `${baseUrl}/validators`;

  const body: DashboardServerPostRequest = { indices };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(
      `Dashboard server POST failed with status: ${response.status}`
    );
  }

  const data = await response.json();
  return data as DashboardServerPostResponse;
}
