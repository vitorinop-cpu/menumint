"use client";

import * as React from "react";
import type { MenuContent } from "@/lib/domain";

interface HistoryState {
  past: MenuContent[];
  present: MenuContent;
  future: MenuContent[];
  lastKey: string | null;
  lastAt: number;
  /** Increments on every content change; used to detect unsaved edits. */
  revision: number;
}

type Action =
  | { type: "apply"; update: (c: MenuContent) => MenuContent; key?: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; content: MenuContent };

const LIMIT = 100;
const COALESCE_MS = 900;

function reducer(state: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case "apply": {
      const next = action.update(state.present);
      if (next === state.present) return state;
      const now = Date.now();
      // Typing into the same field within a short window becomes one undo step.
      const coalesce = action.key && action.key === state.lastKey && now - state.lastAt < COALESCE_MS;
      return {
        past: coalesce ? state.past : [...state.past, state.present].slice(-LIMIT),
        present: next,
        future: [],
        lastKey: action.key ?? null,
        lastAt: now,
        revision: state.revision + 1,
      };
    }
    case "undo": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        lastKey: null,
        lastAt: 0,
        revision: state.revision + 1,
      };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return {
        past: [...state.past, state.present],
        present: next,
        future: rest,
        lastKey: null,
        lastAt: 0,
        revision: state.revision + 1,
      };
    }
    case "reset":
      return { past: [], present: action.content, future: [], lastKey: null, lastAt: 0, revision: 0 };
  }
}

export function useMenuHistory(initial: MenuContent) {
  const [state, dispatch] = React.useReducer(reducer, {
    past: [],
    present: initial,
    future: [],
    lastKey: null,
    lastAt: 0,
    revision: 0,
  });
  const apply = React.useCallback((update: (c: MenuContent) => MenuContent, key?: string) => dispatch({ type: "apply", update, key }), []);
  const undo = React.useCallback(() => dispatch({ type: "undo" }), []);
  const redo = React.useCallback(() => dispatch({ type: "redo" }), []);
  return {
    content: state.present,
    revision: state.revision,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    apply,
    undo,
    redo,
  };
}
