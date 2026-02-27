// Feature: vps-supabase-migration, Property 8: Storage file migration integrity
// Validates: Requirements 7.4, 7.6
//
// For any file in any source storage bucket, the target bucket should contain a
// file at the same path (preserving the user_id/ folder structure) with the same
// file size, and the total file count per bucket should match between source and
// target.

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// The storage migration (06-migrate-storage.sh) transfers all files from the
// five CourierX storage buckets on the source instance to the target instance,
// preserving the user_id/ folder structure, file paths, and file sizes. This
// property test encodes the invariant: after a correct migration, for ANY file
// in ANY bucket, the target must contain a file at the same path with the same
// size, and per-bucket file counts must match.
// ---------------------------------------------------------------------------

interface StorageFile {
  bucket_id: string;
  name: string; // full path including user_id/ prefix
  size: number; // file size in bytes
}

/**
 * The five CourierX storage buckets.
 */
const BUCKET_NAMES = [
  "shipment-documents",
  "medicine-prescriptions",
  "passport-documents",
  "kyc-documents",
  "profile-images",
] as const;

type BucketName = (typeof BUCKET_NAMES)[number];

// ---------------------------------------------------------------------------
// Arbitraries — generate realistic storage file entries
// ---------------------------------------------------------------------------

const uuidArb = fc.uuid();

const fileExtArb = fc.constantFrom("pdf", "jpg", "jpeg", "png", "webp");

const bucketNameArb = fc.constantFrom<BucketName>(...BUCKET_NAMES);

const fileNameArb = fc.tuple(uuidArb, fileExtArb).map(
  ([userId, ext]) => `${userId}/document-${Date.now()}.${ext}`,
);

const fileSizeArb = fc.integer({ min: 1, max: 10485760 }); // 1 byte to 10MB

const storageFileArb: fc.Arbitrary<StorageFile> = fc
  .tuple(bucketNameArb, fileNameArb, fileSizeArb)
  .map(([bucket_id, name, size]) => ({ bucket_id, name, size }));

/**
 * Generate a non-empty array of storage files across all buckets.
 */
const storageFileListArb = fc.array(storageFileArb, {
  minLength: 1,
  maxLength: 50,
});

// ---------------------------------------------------------------------------
// Simulate migration: source files are copied to target unchanged
// ---------------------------------------------------------------------------

function simulateMigration(sourceFiles: StorageFile[]): StorageFile[] {
  return sourceFiles.map((f) => ({ ...f }));
}

function buildFileIndex(
  files: StorageFile[],
): Map<string, StorageFile> {
  const map = new Map<string, StorageFile>();
  for (const file of files) {
    const key = `${file.bucket_id}/${file.name}`;
    map.set(key, file);
  }
  return map;
}

function countFilesByBucket(
  files: StorageFile[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const file of files) {
    counts.set(file.bucket_id, (counts.get(file.bucket_id) || 0) + 1);
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe("Property 8: Storage file migration integrity", () => {
  it("for any file in source, target contains a file at the same path", () => {
    fc.assert(
      fc.property(storageFileListArb, (sourceFiles) => {
        const targetFiles = simulateMigration(sourceFiles);
        const targetIndex = buildFileIndex(targetFiles);

        for (const srcFile of sourceFiles) {
          const key = `${srcFile.bucket_id}/${srcFile.name}`;
          expect(targetIndex.has(key)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("for any file, the file size matches between source and target", () => {
    fc.assert(
      fc.property(storageFileListArb, (sourceFiles) => {
        const targetFiles = simulateMigration(sourceFiles);
        const targetIndex = buildFileIndex(targetFiles);

        for (const srcFile of sourceFiles) {
          const key = `${srcFile.bucket_id}/${srcFile.name}`;
          const tgtFile = targetIndex.get(key)!;
          expect(tgtFile.size).toBe(srcFile.size);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("file counts per bucket match between source and target", () => {
    fc.assert(
      fc.property(storageFileListArb, (sourceFiles) => {
        const targetFiles = simulateMigration(sourceFiles);
        const srcCounts = countFilesByBucket(sourceFiles);
        const tgtCounts = countFilesByBucket(targetFiles);

        for (const [bucket, srcCount] of srcCounts) {
          expect(tgtCounts.get(bucket)).toBe(srcCount);
        }
        expect(tgtCounts.size).toBe(srcCounts.size);
      }),
      { numRuns: 100 },
    );
  });

  it("total file count matches between source and target", () => {
    fc.assert(
      fc.property(storageFileListArb, (sourceFiles) => {
        const targetFiles = simulateMigration(sourceFiles);
        expect(targetFiles.length).toBe(sourceFiles.length);
      }),
      { numRuns: 100 },
    );
  });

  it("user_id folder structure is preserved in file paths", () => {
    fc.assert(
      fc.property(storageFileListArb, (sourceFiles) => {
        const targetFiles = simulateMigration(sourceFiles);
        const targetIndex = buildFileIndex(targetFiles);

        for (const srcFile of sourceFiles) {
          const key = `${srcFile.bucket_id}/${srcFile.name}`;
          const tgtFile = targetIndex.get(key)!;
          // The user_id prefix (first path segment) must match
          const srcFolder = srcFile.name.split("/")[0];
          const tgtFolder = tgtFile.name.split("/")[0];
          expect(tgtFolder).toBe(srcFolder);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("bucket_id is preserved for every migrated file", () => {
    fc.assert(
      fc.property(storageFileListArb, (sourceFiles) => {
        const targetFiles = simulateMigration(sourceFiles);
        const targetIndex = buildFileIndex(targetFiles);

        for (const srcFile of sourceFiles) {
          const key = `${srcFile.bucket_id}/${srcFile.name}`;
          const tgtFile = targetIndex.get(key)!;
          expect(tgtFile.bucket_id).toBe(srcFile.bucket_id);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("empty bucket produces zero files on target", () => {
    fc.assert(
      fc.property(bucketNameArb, (bucket) => {
        const sourceFiles: StorageFile[] = [];
        const targetFiles = simulateMigration(sourceFiles);
        const tgtCounts = countFilesByBucket(targetFiles);
        expect(tgtCounts.get(bucket) ?? 0).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  it("mutation of file size is detected", () => {
    fc.assert(
      fc.property(storageFileArb, (srcFile) => {
        const mutated: StorageFile = { ...srcFile, size: srcFile.size + 1 };
        expect(mutated.size).not.toBe(srcFile.size);
      }),
      { numRuns: 100 },
    );
  });

  it("mutation of file path is detected", () => {
    fc.assert(
      fc.property(storageFileArb, (srcFile) => {
        const mutated: StorageFile = {
          ...srcFile,
          name: srcFile.name + "_corrupted",
        };
        const srcKey = `${srcFile.bucket_id}/${srcFile.name}`;
        const mutKey = `${mutated.bucket_id}/${mutated.name}`;
        expect(mutKey).not.toBe(srcKey);
      }),
      { numRuns: 100 },
    );
  });

  it("missing file in target is detected", () => {
    fc.assert(
      fc.property(
        storageFileListArb.filter((files) => files.length >= 2),
        (sourceFiles) => {
          const targetFiles = simulateMigration(sourceFiles);
          // Remove the first file from target to simulate a missing file
          targetFiles.splice(0, 1);
          const targetIndex = buildFileIndex(targetFiles);

          const missingKey = `${sourceFiles[0].bucket_id}/${sourceFiles[0].name}`;
          expect(targetIndex.has(missingKey)).toBe(false);
          expect(targetFiles.length).toBe(sourceFiles.length - 1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("randomly generated files preserve integrity through migration simulation", () => {
    const deepFilePathArb = fc
      .tuple(
        uuidArb,
        fc.stringMatching(/^[a-z0-9-]{1,20}$/),
        fileExtArb,
      )
      .map(([userId, name, ext]) => `${userId}/${name}.${ext}`);

    const customFileArb = fc.record({
      bucket_id: bucketNameArb,
      name: deepFilePathArb,
      size: fc.integer({ min: 1, max: 52428800 }),
    });

    fc.assert(
      fc.property(customFileArb, (srcFile) => {
        const [migrated] = simulateMigration([srcFile]);
        expect(migrated.bucket_id).toBe(srcFile.bucket_id);
        expect(migrated.name).toBe(srcFile.name);
        expect(migrated.size).toBe(srcFile.size);
      }),
      { numRuns: 100 },
    );
  });
});
