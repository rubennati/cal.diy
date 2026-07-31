const quotePath = (file) => `"${file.replace(/"/g, '\\"')}"`;

export default {
  // --no-errors-on-unmatched: this glob matches paths that biome.json hard-ignores
  // (`**/*.d.ts`, `packages/prisma/zod`, `dist`, `build`, `coverage`, …). Without the flag
  // Biome exits non-zero with "No files were processed", so staging only such files failed
  // the pre-commit hook outright.
  "(apps|packages|companion)/**/*.{js,ts,jsx,tsx}": (files) =>
    `biome lint --reporter summary --no-errors-on-unmatched --config-path=biome-staged.json ${files
      .map(quotePath)
      .join(" ")}`,
  "packages/prisma/schema.prisma": ["prisma format"],
};
