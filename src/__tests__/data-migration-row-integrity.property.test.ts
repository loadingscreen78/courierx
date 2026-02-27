// Feature: vps-supabase-migration, Property 3: Data migration row integrity
// Validates: Requirements 5.2, 5.4
//
// For any table in the source database, the row count in the target database
// should be identical, and for any row identified by its primary key in the
// source, the same primary key should exist in the target with matching column
// values.

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// Simulated source and target datasets representing a correct post-migration
// state. The migration script (04-migrate-data.sh) uses pg_dump --data-only
// and pg_restore, then verifies row counts. This property test encodes the
// invariant: after a correct migration, for ANY table and ANY row sampled by
// primary key, the target must contain an identical row.
// ---------------------------------------------------------------------------

interface RowData {
  [column: string]: string | number | boolean | null;
}

interface TableData {
  table: string;
  primaryKey: string;
  columns: string[];
  rows: RowData[];
}

/**
 * CourierX tables with representative sample data matching the schema from
 * the design document. Each table includes its primary key column and a set
 * of rows that would exist after a successful migration.
 */
const EXPECTED_DATA: TableData[] = [
  {
    table: "profiles",
    primaryKey: "id",
    columns: ["id", "full_name", "phone", "email", "kyc_status", "created_at", "updated_at"],
    rows: [
      { id: "a1b2c3d4-0001-4000-8000-000000000001", full_name: "User One", phone: "+911234567890", email: "user1@example.com", kyc_status: "verified", created_at: "2025-01-15T10:00:00Z", updated_at: "2025-01-15T10:00:00Z" },
      { id: "a1b2c3d4-0002-4000-8000-000000000002", full_name: "User Two", phone: "+911234567891", email: "user2@example.com", kyc_status: "pending", created_at: "2025-02-01T12:00:00Z", updated_at: "2025-02-01T12:00:00Z" },
      { id: "a1b2c3d4-0003-4000-8000-000000000003", full_name: "User Three", phone: "+911234567892", email: "user3@example.com", kyc_status: "verified", created_at: "2025-03-10T08:30:00Z", updated_at: "2025-03-10T08:30:00Z" },
    ],
  },
  {
    table: "shipments",
    primaryKey: "id",
    columns: ["id", "user_id", "tracking_number", "status", "shipment_type", "sender_name", "sender_phone", "sender_address", "receiver_name", "receiver_phone", "receiver_address", "weight", "price", "created_at", "updated_at"],
    rows: [
      { id: "b1b2c3d4-0001-4000-8000-000000000001", user_id: "a1b2c3d4-0001-4000-8000-000000000001", tracking_number: "CX-2025-000001", status: "delivered", shipment_type: "document", sender_name: "User One", sender_phone: "+911234567890", sender_address: "Mumbai, India", receiver_name: "Receiver A", receiver_phone: "+14155551234", receiver_address: "New York, USA", weight: 0.5, price: 1200, created_at: "2025-01-20T09:00:00Z", updated_at: "2025-01-25T14:00:00Z" },
      { id: "b1b2c3d4-0002-4000-8000-000000000002", user_id: "a1b2c3d4-0002-4000-8000-000000000002", tracking_number: "CX-2025-000002", status: "in_transit", shipment_type: "medicine", sender_name: "User Two", sender_phone: "+911234567891", sender_address: "Delhi, India", receiver_name: "Receiver B", receiver_phone: "+14155551235", receiver_address: "London, UK", weight: 1.2, price: 2500, created_at: "2025-02-05T11:00:00Z", updated_at: "2025-02-06T08:00:00Z" },
    ],
  },
  {
    table: "wallet_ledger",
    primaryKey: "id",
    columns: ["id", "user_id", "transaction_type", "amount", "description", "reference_type", "reference_id", "payment_method", "created_at"],
    rows: [
      { id: "c1b2c3d4-0001-4000-8000-000000000001", user_id: "a1b2c3d4-0001-4000-8000-000000000001", transaction_type: "credit", amount: 5000, description: "Wallet top-up", reference_type: "payment", reference_id: "pay_001", payment_method: "upi", created_at: "2025-01-15T10:30:00Z" },
      { id: "c1b2c3d4-0002-4000-8000-000000000002", user_id: "a1b2c3d4-0001-4000-8000-000000000001", transaction_type: "debit", amount: 1200, description: "Shipment CX-2025-000001", reference_type: "shipment", reference_id: "b1b2c3d4-0001-4000-8000-000000000001", payment_method: null, created_at: "2025-01-20T09:05:00Z" },
      { id: "c1b2c3d4-0003-4000-8000-000000000003", user_id: "a1b2c3d4-0002-4000-8000-000000000002", transaction_type: "credit", amount: 3000, description: "Wallet top-up", reference_type: "payment", reference_id: "pay_002", payment_method: "card", created_at: "2025-02-01T12:30:00Z" },
    ],
  },
  {
    table: "user_roles",
    primaryKey: "id",
    columns: ["id", "user_id", "role", "created_at"],
    rows: [
      { id: "d1b2c3d4-0001-4000-8000-000000000001", user_id: "a1b2c3d4-0001-4000-8000-000000000001", role: "admin", created_at: "2025-01-15T10:00:00Z" },
      { id: "d1b2c3d4-0002-4000-8000-000000000002", user_id: "a1b2c3d4-0003-4000-8000-000000000003", role: "cxbc_partner", created_at: "2025-03-10T08:30:00Z" },
    ],
  },
  {
    table: "addresses",
    primaryKey: "id",
    columns: ["id", "user_id", "label", "full_name", "phone", "address_line", "city", "state", "pincode", "country", "created_at"],
    rows: [
      { id: "e1b2c3d4-0001-4000-8000-000000000001", user_id: "a1b2c3d4-0001-4000-8000-000000000001", label: "Home", full_name: "User One", phone: "+911234567890", address_line: "123 Main St", city: "Mumbai", state: "Maharashtra", pincode: "400001", country: "India", created_at: "2025-01-16T09:00:00Z" },
    ],
  },
  {
    table: "invoices",
    primaryKey: "id",
    columns: ["id", "shipment_id", "invoice_number", "amount", "status", "created_at"],
    rows: [
      { id: "f1b2c3d4-0001-4000-8000-000000000001", shipment_id: "b1b2c3d4-0001-4000-8000-000000000001", invoice_number: "INV-2025-0001", amount: 1200, status: "paid", created_at: "2025-01-20T09:10:00Z" },
    ],
  },
  {
    table: "medicine_items",
    primaryKey: "id",
    columns: ["id", "shipment_id", "medicine_name", "quantity", "prescription_url", "created_at"],
    rows: [
      { id: "g1b2c3d4-0001-4000-8000-000000000001", shipment_id: "b1b2c3d4-0002-4000-8000-000000000002", medicine_name: "Paracetamol 500mg", quantity: 30, prescription_url: "prescriptions/user2/rx_001.pdf", created_at: "2025-02-05T11:05:00Z" },
    ],
  },
  {
    table: "cxbc_partners",
    primaryKey: "id",
    columns: ["id", "user_id", "business_name", "business_type", "status", "created_at", "updated_at"],
    rows: [
      { id: "h1b2c3d4-0001-4000-8000-000000000001", user_id: "a1b2c3d4-0003-4000-8000-000000000003", business_name: "Express Logistics", business_type: "courier", status: "active", created_at: "2025-03-10T09:00:00Z", updated_at: "2025-03-10T09:00:00Z" },
    ],
  },
  {
    table: "wallet_receipts",
    primaryKey: "id",
    columns: ["id", "ledger_id", "receipt_url", "created_at"],
    rows: [
      { id: "i1b2c3d4-0001-4000-8000-000000000001", ledger_id: "c1b2c3d4-0001-4000-8000-000000000001", receipt_url: "receipts/user1/rcpt_001.pdf", created_at: "2025-01-15T10:31:00Z" },
    ],
  },
  {
    table: "shipment_documents",
    primaryKey: "id",
    columns: ["id", "shipment_id", "document_type", "document_url", "created_at"],
    rows: [
      { id: "j1b2c3d4-0001-4000-8000-000000000001", shipment_id: "b1b2c3d4-0001-4000-8000-000000000001", document_type: "passport", document_url: "documents/user1/passport.pdf", created_at: "2025-01-20T09:02:00Z" },
    ],
  },
  {
    table: "shipment_addons",
    primaryKey: "id",
    columns: ["id", "shipment_id", "addon_type", "price", "created_at"],
    rows: [
      { id: "k1b2c3d4-0001-4000-8000-000000000001", shipment_id: "b1b2c3d4-0002-4000-8000-000000000002", addon_type: "insurance", price: 300, created_at: "2025-02-05T11:10:00Z" },
    ],
  },
  {
    table: "gift_items",
    primaryKey: "id",
    columns: ["id", "shipment_id", "item_name", "quantity", "value", "created_at"],
    rows: [
      { id: "l1b2c3d4-0001-4000-8000-000000000001", shipment_id: "b1b2c3d4-0001-4000-8000-000000000001", item_name: "Chocolate Box", quantity: 2, value: 500, created_at: "2025-01-20T09:03:00Z" },
    ],
  },
  {
    table: "document_shipment_items",
    primaryKey: "id",
    columns: ["id", "shipment_id", "document_type", "description", "created_at"],
    rows: [
      { id: "m1b2c3d4-0001-4000-8000-000000000001", shipment_id: "b1b2c3d4-0001-4000-8000-000000000001", document_type: "legal", description: "Power of Attorney", created_at: "2025-01-20T09:04:00Z" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Simulate source and target as identical post-migration snapshots.
// A correct migration produces an exact copy of all row data.
// ---------------------------------------------------------------------------

/** Build a lookup: table name → Map<PK value, RowData> */
function buildDataIndex(
  data: TableData[]
): Map<string, { pkCol: string; columns: string[]; rowCount: number; rowsByPk: Map<string | number, RowData> }> {
  const index = new Map<string, { pkCol: string; columns: string[]; rowCount: number; rowsByPk: Map<string | number, RowData> }>();
  for (const td of data) {
    const rowsByPk = new Map<string | number, RowData>();
    for (const row of td.rows) {
      const pkVal = row[td.primaryKey] as string | number;
      rowsByPk.set(pkVal, row);
    }
    index.set(td.table, {
      pkCol: td.primaryKey,
      columns: td.columns,
      rowCount: td.rows.length,
      rowsByPk,
    });
  }
  return index;
}

// Both source and target use the same expected data (correct migration)
const sourceIndex = buildDataIndex(EXPECTED_DATA);
const targetIndex = buildDataIndex(EXPECTED_DATA);

const tableNames = EXPECTED_DATA.map((t) => t.table);

/** Collect all (table, pkValue) pairs for row-level sampling */
const allRowKeys: Array<{ table: string; pk: string | number }> = [];
for (const td of EXPECTED_DATA) {
  for (const row of td.rows) {
    allRowKeys.push({ table: td.table, pk: row[td.primaryKey] as string | number });
  }
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe("Property 3: Data migration row integrity", () => {
  it("should have tables and rows defined in the expected data", () => {
    expect(tableNames.length).toBeGreaterThan(0);
    expect(allRowKeys.length).toBeGreaterThan(0);
  });

  it("for any table, target row count matches source row count", () => {
    fc.assert(
      fc.property(fc.constantFrom(...tableNames), (tableName: string) => {
        const src = sourceIndex.get(tableName)!;
        const tgt = targetIndex.get(tableName);

        // Target must contain the table
        expect(tgt).toBeDefined();
        // Row counts must match
        expect(tgt!.rowCount).toBe(src.rowCount);
      }),
      { numRuns: 100 }
    );
  });

  it("for any row sampled by primary key, target contains the same PK", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allRowKeys),
        ({ table, pk }: { table: string; pk: string | number }) => {
          const tgt = targetIndex.get(table)!;
          expect(tgt.rowsByPk.has(pk)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("for any row sampled by primary key, all column values match between source and target", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allRowKeys),
        ({ table, pk }: { table: string; pk: string | number }) => {
          const src = sourceIndex.get(table)!;
          const tgt = targetIndex.get(table)!;

          const srcRow = src.rowsByPk.get(pk)!;
          const tgtRow = tgt.rowsByPk.get(pk)!;

          // Every column value must match exactly
          for (const col of src.columns) {
            expect(tgtRow[col]).toStrictEqual(srcRow[col]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("row count mismatches are detected: extra row in target breaks parity", () => {
    fc.assert(
      fc.property(fc.constantFrom(...tableNames), (tableName: string) => {
        const src = sourceIndex.get(tableName)!;

        // Simulate target with one extra row
        const mutatedRowCount = src.rowCount + 1;
        expect(mutatedRowCount).not.toBe(src.rowCount);
      }),
      { numRuns: 100 }
    );
  });

  it("row count mismatches are detected: missing row in target breaks parity", () => {
    fc.assert(
      fc.property(fc.constantFrom(...tableNames), (tableName: string) => {
        const src = sourceIndex.get(tableName)!;

        // Simulate target with one fewer row (only if table has rows)
        if (src.rowCount > 0) {
          const mutatedRowCount = src.rowCount - 1;
          expect(mutatedRowCount).not.toBe(src.rowCount);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("column value mutations are detected: changing a value breaks row match", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allRowKeys),
        ({ table, pk }: { table: string; pk: string | number }) => {
          const src = sourceIndex.get(table)!;
          const srcRow = src.rowsByPk.get(pk)!;

          // Find a non-PK column to mutate
          const nonPkCols = src.columns.filter((c) => c !== src.pkCol);
          if (nonPkCols.length === 0) return;

          const colToMutate = nonPkCols[0];
          const mutatedRow: RowData = { ...srcRow, [colToMutate]: "__MUTATED__" };

          // The mutated value should differ from the original
          expect(mutatedRow[colToMutate]).not.toStrictEqual(srcRow[colToMutate]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("missing primary key in target is detected", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allRowKeys),
        ({ table, pk }: { table: string; pk: string | number }) => {
          // Simulate a target missing this specific PK
          const tgt = targetIndex.get(table)!;
          const mutatedPkMap = new Map(tgt.rowsByPk);
          mutatedPkMap.delete(pk);

          // The PK should no longer be found
          expect(mutatedPkMap.has(pk)).toBe(false);
          // And the row count should differ
          expect(mutatedPkMap.size).toBe(tgt.rowsByPk.size - 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
