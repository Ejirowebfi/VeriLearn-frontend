"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";

// key: `${courseId}-${lessonIndex}`
interface ProgressContextValue {
  completed: Set<string>;
  markComplete: (courseId: number, lessonIndex: number) => void;
  isComplete: (courseId: number, lessonIndex: number) => boolean;
  courseProgress: (courseId: number, total: number) => number;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

function storageKey(email: string) {
  return `verilearn_progress:${email}`;
}

function readCompleted(email: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(storageKey(email));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const email = user?.email ?? null;

  const [loadedForEmail, setLoadedForEmail] = useState(email);
  const [completed, setCompleted] = useState<Set<string>>(() => (email ? readCompleted(email) : new Set()));

  // Re-hydrate whenever the signed-in identity changes (login, logout, or
  // switching accounts on the same browser) so one user never sees another's
  // lesson progress. Adjusted during render rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (email !== loadedForEmail) {
    setLoadedForEmail(email);
    setCompleted(email ? readCompleted(email) : new Set());
  }

  const markComplete = useCallback((courseId: number, lessonIndex: number) => {
    if (!email) return;
    setCompleted((prev) => {
      const next = new Set(prev).add(`${courseId}-${lessonIndex}`);
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey(email), JSON.stringify([...next]));
      }
      return next;
    });
  }, [email]);

  const isComplete = useCallback(
    (courseId: number, lessonIndex: number) => completed.has(`${courseId}-${lessonIndex}`),
    [completed]
  );

  const courseProgress = useCallback(
    (courseId: number, total: number) => {
      let done = 0;
      for (let i = 0; i < total; i++) {
        if (completed.has(`${courseId}-${i}`)) done++;
      }
      return total === 0 ? 0 : Math.round((done / total) * 100);
    },
    [completed]
  );

  return (
    <ProgressContext.Provider value={{ completed, markComplete, isComplete, courseProgress }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
