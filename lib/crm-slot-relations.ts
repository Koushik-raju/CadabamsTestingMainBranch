/**
 * CRM slot payloads encode relations as `[id, name]` tuples; some fields may be `false`.
 */

export function slotRelationNumericId(field: unknown): number | null {
  if (field == null || field === false) return null;
  if (!Array.isArray(field) || field.length === 0) return null;
  const id = field[0];
  if (typeof id === "number" && !Number.isNaN(id)) return id;
  if (typeof id === "string") {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
