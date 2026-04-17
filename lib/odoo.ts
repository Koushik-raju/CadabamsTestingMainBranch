/**
 * FILE: lib/odoo.ts
 *
 * PURPOSE:
 *   Utility helpers for working with Odoo many2one tuple fields returned by the
 *   backend SDK. Odoo encodes relation fields as [id, display_name] tuples, or
 *   `false` when the relation is not set.
 *
 * LOGIC OVERVIEW:
 *   - odooTuple(field, index) safely reads index 0 (id) or 1 (display name) from
 *     a many2one field that may be a tuple, false, null, or undefined.
 *   - Returns undefined when the field is not a tuple so callers can use ?? for
 *     fallback values.
 *
 * KEY VARIABLES / PROPS / EXPORTS:
 *   odooTuple   — reads a specific index from an Odoo many2one tuple field safely
 *
 * DEPENDENCIES:
 *   None
 *
 * LAST UPDATED: 2026-04-17 — initial creation for SDK v2 migration (many2one types narrowed from Array<unknown> to [id, name] | false)
 */

type OdooMany2One = [number | string, number | string] | false | null | undefined;

/**
 * Safely reads index 0 (id) or 1 (display name) from an Odoo many2one field.
 * Returns undefined when the field is false, null, or undefined.
 */
export function odooTuple(field: OdooMany2One, index: 0 | 1): number | string | undefined {
  return Array.isArray(field) ? field[index] : undefined;
}
