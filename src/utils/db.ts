export type LuniiDbEntry = {
  uuid: string;
  localized_infos: { fr_FR: { description: string; title: string } };
};
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
async function request(url: string, headers?: HeadersInit): Promise<unknown> {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok)
    throw new Error(
      "Le catalogue Lunii est indisponible. Réessayez plus tard.",
    );
  return response.json();
}
export async function getLuniiStoreDb(): Promise<LuniiDbEntry[]> {
  try {
    const auth = await request(
      "https://server-auth-prod.lunii.com/guest/create",
    );
    if (
      !isRecord(auth) ||
      !isRecord(auth.response) ||
      !isRecord(auth.response.token) ||
      typeof auth.response.token.server !== "string"
    )
      throw new Error("Réponse du catalogue Lunii invalide.");
    const data = await request("https://server-data-prod.lunii.com/v2/packs", {
      "X-AUTH-TOKEN": auth.response.token.server,
    });
    if (!isRecord(data) || !isRecord(data.response))
      throw new Error("Réponse du catalogue Lunii invalide.");
    const entries: LuniiDbEntry[] = [];
    for (const value of Object.values(data.response)) {
      if (
        !isRecord(value) ||
        typeof value.uuid !== "string" ||
        !isRecord(value.localized_infos)
      )
        continue;
      const info = value.localized_infos.fr_FR;
      if (
        !isRecord(info) ||
        typeof info.title !== "string" ||
        typeof info.description !== "string"
      )
        continue;
      entries.push({
        uuid: value.uuid,
        localized_infos: {
          fr_FR: { title: info.title, description: info.description },
        },
      });
    }
    return entries;
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    )
      throw new Error(
        "Le catalogue Lunii met trop de temps à répondre. Réessayez plus tard.",
        { cause: error },
      );
    throw error;
  }
}
