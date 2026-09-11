"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface EnrollmentContextValue {
  enrolled: Set<number>;
  enroll: (courseId: number) => void;
  isEnrolled: (courseId: number) => boolean;
}

const EnrollmentContext = createContext<EnrollmentContextValue | null>(null);

function storageKey(email: string) {
  return `verilearn_enrolled:${email}`;
}

function readEnrolled(email: string): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(storageKey(email));
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
  } catch {
    return new Set();
  }
}

export function EnrollmentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const email = user?.email ?? null;

  const [loadedForEmail, setLoadedForEmail] = useState(email);
  const [enrolled, setEnrolled] = useState<Set<number>>(() => (email ? readEnrolled(email) : new Set()));

  // Re-hydrate whenever the signed-in identity changes (login, logout, or
  // switching accounts on the same browser) so one user never sees another's
  // enrollment data. Adjusted during render rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (email !== loadedForEmail) {
    setLoadedForEmail(email);
    setEnrolled(email ? readEnrolled(email) : new Set());
  }

  const enroll = useCallback((courseId: number) => {
    if (!email) return;
    setEnrolled((prev) => {
      const next = new Set(prev).add(courseId);
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey(email), JSON.stringify([...next]));
      }
      return next;
    });
  }, [email]);

  const isEnrolled = useCallback((courseId: number) => enrolled.has(courseId), [enrolled]);

  return (
    <EnrollmentContext.Provider value={{ enrolled, enroll, isEnrolled }}>
      {children}
    </EnrollmentContext.Provider>
  );
}

export function useEnrollment() {
  const ctx = useContext(EnrollmentContext);
  if (!ctx) throw new Error("useEnrollment must be used inside EnrollmentProvider");
  return ctx;
}
