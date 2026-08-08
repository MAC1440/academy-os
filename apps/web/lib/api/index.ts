// Re-exports every module so existing imports of `@web/lib/api` keep
// working unchanged. New code can also import from the specific module
// directly, e.g. `@web/lib/api/branches`.
export * from "./client";
export * from "./auth";
export * from "./academies";
export * from "./branches";
export * from "./academic-calendar";
export * from "./staff";
