import { redirect } from "next/navigation";

// The admin panel opens on Events.
export default function AdminIndex() {
  redirect("/admin/events");
}
