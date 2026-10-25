// Photon Spectrum project API. Server-only: uses the project secret.

export interface PhotonUser {
  id: string;
  /** The shared Lately line this person texts. */
  assignedPhoneNumber: string;
}

/**
 * Registers a phone number as a user of the Photon project (idempotent: re-registering returns the same user).
 * Shared-line plans only talk to registered users, and the user has to send the first message.
 */
export async function registerUser(phoneNumber: string): Promise<PhotonUser> {
  const id = process.env.PHOTON_PROJECT_ID;
  const secret = process.env.PHOTON_PROJECT_SECRET;
  if (!id || !secret) throw new Error("Missing PHOTON_PROJECT_ID or PHOTON_PROJECT_SECRET (set them in .env.local)");

  const res = await fetch(`https://spectrum.photon.codes/projects/${id}/users/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "shared", phoneNumber }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Photon registration failed: ${res.status} ${(await res.text()).slice(0, 300)}`);

  const { data } = (await res.json()) as { data: PhotonUser };
  return { id: data.id, assignedPhoneNumber: data.assignedPhoneNumber };
}
