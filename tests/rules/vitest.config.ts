import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Test files share one Firestore emulator and call clearFirestore(),
    // so running them in parallel makes them interfere with each other.
    fileParallelism: false,
  },
});
