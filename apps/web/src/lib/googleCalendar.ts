import { reauthenticateWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { t } from "@/lib/i18n";

export interface CalendarListItem {
  id: string;
  summary: string;
  primary?: boolean;
}

export interface GoogleCalendarConnection {
  token: string;
  items: CalendarListItem[];
}

/**
 * OAuth popup → access token → calendar list.
 * Returns null when the user closes the popup; throws on any other failure.
 * `scopes` are short names under https://www.googleapis.com/auth/ and must
 * include one that permits calendarList.list.
 */
export async function connectGoogleCalendar(
  scopes: string[],
  minAccessRole: "reader" | "writer"
): Promise<GoogleCalendarConnection | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error(t("gcal.loginRequired"));

  const provider = new GoogleAuthProvider();
  for (const s of scopes) provider.addScope(`https://www.googleapis.com/auth/${s}`);

  let result;
  try {
    // reauthenticateWithPopup ensures the same Google account — prevents accidental account switching
    result = await reauthenticateWithPopup(currentUser, provider);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      return null;
    }
    throw e;
  }

  const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
  if (!token) throw new Error(t("gcal.noToken"));

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=${minAccessRole}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(t("gcal.listFailed"));

  const data = await res.json();
  const items: CalendarListItem[] = (data.items ?? []).map(
    (c: { id: string; summary: string; primary?: boolean }) => ({
      id: c.id, summary: c.summary, primary: c.primary,
    })
  );
  return { token, items };
}
