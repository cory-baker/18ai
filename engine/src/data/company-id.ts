// Placeholder for slice 3. Slice 5 (`companies.ts`) narrows this to the literal
// union of Chesapeake company codes (`'B&O' | 'C&O' | 'PRR' | ...`). Kept in
// `data/` so import paths stay stable across slices.
export type CompanyId = string;
