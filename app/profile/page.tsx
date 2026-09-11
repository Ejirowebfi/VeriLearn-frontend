"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useEnrollment } from "../context/EnrollmentContext";
import { useProgress } from "../context/ProgressContext";
import { courses } from "../lib/courses";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { enrolled } = useEnrollment();
  const { courseProgress } = useProgress();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login?from=/profile");
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex flex-1 items-center justify-center text-zinc-400">Loading…</div>;
  }

  const enrolledCourses = courses.filter((c) => enrolled.has(c.id));
  const totalDone = enrolledCourses.reduce((sum, c) =>
    sum + Math.round((courseProgress(c.id, c.lessons.length) / 100) * c.lessons.length), 0);
  const certificates = enrolledCourses.filter((c) => courseProgress(c.id, c.lessons.length) === 100).length;
  const initials = user.name.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">Profile</h1>

      {/* Avatar + info */}
      <div className="flex items-center gap-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-6 mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
          {initials}
        </div>
        <div>
          <div className="text-lg font-semibold text-zinc-900 dark:text-white">{user.name}</div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: "Enrolled", value: enrolledCourses.length },
          { label: "Lessons done", value: totalDone },
          { label: "Certificates", value: certificates },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-4 text-center">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</div>
            <div className="mt-1 text-xs text-zinc-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Enrolled courses */}
      <h2 className="mb-4 font-semibold text-zinc-900 dark:text-white">Enrolled Courses</h2>
      {enrolledCourses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 p-10 text-center">
          <p className="text-sm text-zinc-500">You haven&apos;t enrolled in any courses yet.</p>
          <Link href="/courses" className="mt-3 inline-block text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Browse courses →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {enrolledCourses.map((c) => {
            const progress = courseProgress(c.id, c.lessons.length);
            return (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{c.title}</span>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{progress}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
