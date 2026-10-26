import type { Metadata } from "next";
import { PlatformAdminPage } from "@/components/admin/platform-admin-page";

export const metadata: Metadata = {
  title: "Админка",
  robots: { index: false, follow: false },
};


export default function AdminPage() {
  return <PlatformAdminPage nextPath="/admin" />;
}
