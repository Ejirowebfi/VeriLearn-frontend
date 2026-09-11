export interface Lesson {
  title: string;
  duration: string;
  content: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  tag: string;
  topic: string;
  duration: string;
  lessons: Lesson[];
}

export const courses: Course[] = [
  {
    id: 1,
    title: "Intro to TypeScript",
    description: "Master types, interfaces, generics, and the TypeScript compiler from the ground up.",
    tag: "Beginner",
    topic: "TypeScript",
    duration: "4h 30m",
    lessons: [
      { title: "What is TypeScript?", duration: "12 min", content: "TypeScript is a typed superset of JavaScript that compiles to plain JS. It adds optional static typing, classes, and modules." },
      { title: "Types & Interfaces", duration: "18 min", content: "Learn how to define types and interfaces to describe the shape of objects and function signatures." },
      { title: "Generics", duration: "20 min", content: "Generics allow you to write reusable, type-safe functions and classes that work with a variety of types." },
      { title: "Utility Types", duration: "15 min", content: "TypeScript ships with built-in utility types like Partial, Required, Pick, Omit, and Record." },
      { title: "TypeScript with React", duration: "25 min", content: "Typing React components, props, hooks, and events using TypeScript." },
    ],
  },
  {
    id: 2,
    title: "Next.js App Router",
    description: "Build full-stack apps with server components, layouts, and streaming in Next.js.",
    tag: "Intermediate",
    topic: "Next.js",
    duration: "5h 15m",
    lessons: [
      { title: "App Router fundamentals", duration: "20 min", content: "The App Router uses a file-system based router built on top of React Server Components." },
      { title: "Layouts & pages", duration: "18 min", content: "Layouts wrap multiple pages and persist across navigation. Pages are unique to each route." },
      { title: "Server vs Client components", duration: "22 min", content: "By default all components are server components. Use 'use client' to opt into the client bundle." },
      { title: "Data fetching", duration: "25 min", content: "Fetch data directly in server components using async/await. Use Route Handlers for API endpoints." },
      { title: "Error & loading states", duration: "15 min", content: "Use error.tsx and loading.tsx special files to handle errors and streaming loading states." },
    ],
  },
  {
    id: 3,
    title: "Tailwind CSS Fundamentals",
    description: "Design beautiful UIs fast with utility-first CSS.",
    tag: "Beginner",
    topic: "CSS",
    duration: "2h 45m",
    lessons: [
      { title: "Utility-first basics", duration: "15 min", content: "Instead of writing custom CSS, Tailwind provides thousands of utility classes to build designs directly in your markup." },
      { title: "Responsive design", duration: "18 min", content: "Use breakpoint prefixes like sm:, md:, lg: to apply styles at specific screen sizes." },
      { title: "Dark mode", duration: "12 min", content: "Enable dark mode with the dark: variant. Tailwind supports both media and class strategies." },
      { title: "Custom themes", duration: "20 min", content: "Extend or override Tailwind's default theme using the @theme directive in your CSS." },
      { title: "Component patterns", duration: "15 min", content: "Build reusable UI patterns by composing utility classes into React components." },
    ],
  },
  {
    id: 4,
    title: "React Server Components",
    description: "Understand the React 19 rendering model and server/client boundaries.",
    tag: "Advanced",
    topic: "React",
    duration: "3h 50m",
    lessons: [
      { title: "RSC mental model", duration: "20 min", content: "Server components render on the server and send HTML. They have zero JS bundle cost on the client." },
      { title: "Serialization constraints", duration: "18 min", content: "Server components cannot use hooks, browser APIs, or pass non-serializable props to client components." },
      { title: "Context & RSC", duration: "15 min", content: "Context providers must be client components. Pass context values as props from server to client boundaries." },
      { title: "Streaming & Suspense", duration: "22 min", content: "Wrap async server components in Suspense to stream content progressively to the browser." },
      { title: "Client islands", duration: "15 min", content: "Interactivity is added through isolated client component islands embedded in a server-rendered page." },
    ],
  },
  {
    id: 5,
    title: "CI/CD with GitHub Actions",
    description: "Automate builds, tests, and deployments from first principles.",
    tag: "Intermediate",
    topic: "CI/CD",
    duration: "3h 20m",
    lessons: [
      { title: "Workflow basics", duration: "15 min", content: "Workflows are YAML files in .github/workflows/ that define automated processes triggered by events." },
      { title: "Secrets & env vars", duration: "12 min", content: "Store sensitive values as GitHub Secrets and reference them with ${{ secrets.NAME }} in workflows." },
      { title: "Build & test jobs", duration: "18 min", content: "Define jobs that install dependencies, run builds, and execute your test suite on every push." },
      { title: "Deploy on push", duration: "20 min", content: "Trigger deployments automatically when commits land on main using workflow dispatch or push events." },
      { title: "Caching dependencies", duration: "15 min", content: "Use actions/cache to cache node_modules across runs and dramatically speed up your pipelines." },
    ],
  },
  {
    id: 6,
    title: "Load Testing with k6",
    description: "Write performance scenarios, set thresholds, and read Grafana dashboards.",
    tag: "Intermediate",
    topic: "Performance",
    duration: "2h 30m",
    lessons: [
      { title: "k6 quickstart", duration: "15 min", content: "k6 is a developer-centric load testing tool. Write scripts in JavaScript and run them from the CLI." },
      { title: "Scenarios & executors", duration: "18 min", content: "Scenarios define how virtual users behave. Executors control the load pattern: constant VUs, ramping, etc." },
      { title: "Custom metrics", duration: "12 min", content: "Define Trend, Counter, and Rate metrics to track application-specific performance data." },
      { title: "Thresholds", duration: "10 min", content: "Thresholds define pass/fail criteria. The test fails if p(95) latency exceeds your threshold." },
      { title: "Grafana integration", duration: "15 min", content: "Stream k6 results to InfluxDB and visualise them in real-time with pre-built Grafana dashboards." },
    ],
  },
];

export const tagColors: Record<string, string> = {
  Beginner: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  Intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  Advanced: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};
