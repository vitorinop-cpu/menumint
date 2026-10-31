import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { OptionalModule } from "@/components/dashboard/optional-module";

export const metadata: Metadata = { title: "Orders (optional)" };

export default function OrdersPage() {
  return (
    <OptionalModule
      title="Orders"
      icon={<ShoppingBag />}
      summary="Table and pickup ordering from your digital menu."
      planned={["Order from the menu at the table or for pickup", "Live order queue for the kitchen", "Stripe payments with tips"]}
    />
  );
}
