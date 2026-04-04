import { redirect } from "next/navigation";

// Root "/" → redirect to dashboard
// The (dashboard) layout with sidebar is applied via app/(dashboard)/layout.tsx
export default function RootPage() {
  redirect("/dashboard");
}
