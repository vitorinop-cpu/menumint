import type { Metadata } from "next";
import { Users } from "lucide-react";
import { OptionalModule } from "@/components/dashboard/optional-module";

export const metadata: Metadata = { title: "Customers (optional)" };

export default function CustomersPage() {
  return (
    <OptionalModule
      title="Customers"
      icon={<Users />}
      summary="Opt-in guest profiles and loyalty."
      planned={["Opt-in guest list (consent-based)", "Favourite dishes and visit history", "Loyalty rewards"]}
    />
  );
}
