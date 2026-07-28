import { Contact } from "./types";

const HUBSPOT_CONTACTS_URL =
  "https://api.hubapi.com/crm/v3/objects/contacts";

/**
 * Create a contact directly in HubSpot via the CRM v3 API.
 * Requires HUBSPOT_ACCESS_TOKEN (a Private App token with
 * crm.objects.contacts.write). Throws on a non-2xx response.
 */
export async function createHubSpotContact(contact: Contact): Promise<void> {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    throw new Error("HUBSPOT_ACCESS_TOKEN is not configured");
  }

  const properties: Record<string, string> = {
    firstname: contact.firstName,
    lastname: contact.lastName,
    company: contact.company,
    jobtitle: contact.jobTitle,
    email: contact.email,
    phone: contact.phone,
  };
  if (contact.notes) {
    // Stored as a note-style property; adjust to your HubSpot schema.
    properties.message = contact.notes;
  }

  // Drop empty values so we don't overwrite existing data with blanks.
  const cleaned = Object.fromEntries(
    Object.entries(properties).filter(([, v]) => v !== ""),
  );

  const res = await fetch(HUBSPOT_CONTACTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ properties: cleaned }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`HubSpot returned ${res.status}: ${detail}`);
  }
}
