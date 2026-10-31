"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { GlassInput } from "@/components/glass/glass-input";

export const PasswordInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function PasswordInput(props, ref) {
    const [show, setShow] = React.useState(false);
    return (
      <div className="relative">
        <GlassInput ref={ref} type={show ? "text" : "password"} className="pr-11" {...props} />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-espresso-400 transition hover:bg-espresso/5 hover:text-espresso"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  },
);
