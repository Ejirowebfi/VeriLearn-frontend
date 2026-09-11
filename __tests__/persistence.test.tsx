import { render, act, waitFor } from "@testing-library/react";
import { AuthProvider } from "../app/context/AuthContext";
import { EnrollmentProvider, useEnrollment } from "../app/context/EnrollmentContext";
import { ProgressProvider, useProgress } from "../app/context/ProgressContext";

const TEST_EMAIL = "test@example.com";

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: 3, name: "Test User", email: TEST_EMAIL }),
  });
});

afterEach(() => jest.restoreAllMocks());

// --- EnrollmentContext ---
// Enrollment/progress are scoped to the signed-in user, so every test here
// renders through AuthProvider (with /api/auth/me mocked) rather than the
// bare providers.

function EnrollmentHarness({ onMount }: { onMount: (ctx: ReturnType<typeof useEnrollment>) => void }) {
  const ctx = useEnrollment();
  onMount(ctx);
  return null;
}

test("enroll() writes to localStorage under the signed-in user", async () => {
  let ctx!: ReturnType<typeof useEnrollment>;
  render(
    <AuthProvider>
      <EnrollmentProvider>
        <EnrollmentHarness onMount={(c) => { ctx = c; }} />
      </EnrollmentProvider>
    </AuthProvider>
  );

  // enroll() no-ops until AuthContext finishes hydrating the user; retry
  // until that async hydration lands.
  await waitFor(() => {
    act(() => ctx.enroll(42));
    expect(localStorage.getItem(`verilearn_enrolled:${TEST_EMAIL}`)).not.toBeNull();
  });

  const stored = JSON.parse(localStorage.getItem(`verilearn_enrolled:${TEST_EMAIL}`)!);
  expect(stored).toContain(42);
});

test("EnrollmentProvider re-hydrates from localStorage for the signed-in user", async () => {
  localStorage.setItem(`verilearn_enrolled:${TEST_EMAIL}`, JSON.stringify([7, 8]));

  let ctx!: ReturnType<typeof useEnrollment>;
  render(
    <AuthProvider>
      <EnrollmentProvider>
        <EnrollmentHarness onMount={(c) => { ctx = c; }} />
      </EnrollmentProvider>
    </AuthProvider>
  );

  await waitFor(() => expect(ctx.isEnrolled(7)).toBe(true));
  expect(ctx.isEnrolled(8)).toBe(true);
  expect(ctx.isEnrolled(1)).toBe(false);
});

test("EnrollmentProvider clears state when there is no signed-in user", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => null });
  localStorage.setItem(`verilearn_enrolled:${TEST_EMAIL}`, JSON.stringify([7]));

  let ctx!: ReturnType<typeof useEnrollment>;
  render(
    <AuthProvider>
      <EnrollmentProvider>
        <EnrollmentHarness onMount={(c) => { ctx = c; }} />
      </EnrollmentProvider>
    </AuthProvider>
  );

  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  expect(ctx.isEnrolled(7)).toBe(false);
});

// --- ProgressContext ---

function ProgressHarness({ onMount }: { onMount: (ctx: ReturnType<typeof useProgress>) => void }) {
  const ctx = useProgress();
  onMount(ctx);
  return null;
}

test("markComplete() writes to localStorage under the signed-in user", async () => {
  let ctx!: ReturnType<typeof useProgress>;
  render(
    <AuthProvider>
      <ProgressProvider>
        <ProgressHarness onMount={(c) => { ctx = c; }} />
      </ProgressProvider>
    </AuthProvider>
  );

  await waitFor(() => {
    act(() => ctx.markComplete(3, 0));
    expect(localStorage.getItem(`verilearn_progress:${TEST_EMAIL}`)).not.toBeNull();
  });

  const stored = JSON.parse(localStorage.getItem(`verilearn_progress:${TEST_EMAIL}`)!);
  expect(stored).toContain("3-0");
});

test("ProgressProvider re-hydrates from localStorage for the signed-in user", async () => {
  localStorage.setItem(`verilearn_progress:${TEST_EMAIL}`, JSON.stringify(["5-0", "5-1"]));

  let ctx!: ReturnType<typeof useProgress>;
  render(
    <AuthProvider>
      <ProgressProvider>
        <ProgressHarness onMount={(c) => { ctx = c; }} />
      </ProgressProvider>
    </AuthProvider>
  );

  await waitFor(() => expect(ctx.isComplete(5, 0)).toBe(true));
  expect(ctx.isComplete(5, 1)).toBe(true);
  expect(ctx.isComplete(5, 2)).toBe(false);
});
