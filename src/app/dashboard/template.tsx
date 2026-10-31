"use client";

import { motion } from "motion/react";

/** Page transition for dashboard routes. */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 32, mass: 0.8 }}
    >
      {children}
    </motion.div>
  );
}
