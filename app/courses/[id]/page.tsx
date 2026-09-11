"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import { courses, tagColors } from "../../lib/courses";
import { useEnrollment } from "../../context/EnrollmentContext";
import { useProgress } from "../../context/ProgressContext";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const course = courses.find((c) => c.id === Number(id));
  if (!course) notFound();

  // After notFound() the component won't continue, but TS doesn't know that.
  // We cast once here to avoid repeating the non-null assertion throughout.
  const c = course as NonNullable<typeof course>;

  const { isEnrolled, enroll } = useEnrollment();
  const { isComplete, courseProgress } = useProgress();
  const { user, loading } = useAuth();
  const router = useRouter();

  const enrolled = isEnrolled(c.id);
  const progress = courseProgress(c.id, c.lessons.length);

  function handleEnroll() {
    if (loading) return;
    if (!user) { router.push(`/login?from=/courses/${c.id}`); return; }
    enroll(c.id);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link href="/courses" className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
        ← Back to courses
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tagColors[c.tag]}`}>{c.tag}</span>
        <span className="text-xs text-zinc-400">{c.duration}</span>
        <span className="text-xs text-zinc-400">{c.lessons.length} lessons</span>
      </div>

      <h1 className="mt-3 text-3xl font-bold text-zinc-900 dark:text-white">{c.title}</h1>
      <p className="mt-3 text-zinc-500 dark:text-zinc-400">{c.description}</p>

      {enrolled && (
        <div className="mt-6">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>Your progress</span><span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-4 font-semibold text-zinc-900 dark:text-white">Lessons ({c.lessons.length})</h2>
        <ol className="space-y-2">
          {c.lessons.map((lesson, i) => {
            const done = isComplete(c.id, i);
            return (
              <li key={i} className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-sm">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${done ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400" : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"}`}>
                  {done ? "✓" : i + 1}
                </span>
                <span className="flex-1 text-zinc-700 dark:text-zinc-300">{lesson.title}</span>
                <span className="text-xs text-zinc-400">{lesson.duration}</span>
                {enrolled && (
                  <Link href={`/courses/${c.id}/lessons/${i}`} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    {done ? "Review" : "Start"}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-8">
        {enrolled ? (
          <Link href={`/courses/${c.id}/lessons/0`} className="inline-block rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
            Continue learning →
          </Link>
        ) : (
          <button onClick={handleEnroll} disabled={loading} className="rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-60">
            {loading ? "Loading…" : "Enroll for free"}
          </button>
        )}
      </div>
    </div>
  );
}
