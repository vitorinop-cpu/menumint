"use client";

import * as React from "react";
import { motion } from "motion/react";

const tags = {
  div: motion.div,
  li: motion.li,
  article: motion.article,
  figure: motion.figure,
} as const;

/** Fades and lifts its children into view once, with a soft spring. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 22,
  as = "div",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: keyof typeof tags;
  id?: string;
}) {
  const Tag = tags[as];
  return (
    <Tag
      id={id}
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 110, damping: 20, mass: 0.9, delay }}
    >
      {children}
    </Tag>
  );
}
