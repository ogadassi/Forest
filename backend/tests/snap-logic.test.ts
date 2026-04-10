/**
 * Tests for the grid snapping logic extracted from CategoryGrid.tsx.
 *
 * The rules are:
 *   COL_WIDTH = 60
 *   MARGIN    = 16
 *   UNIT      = COL_WIDTH + MARGIN  (= 76)
 *
 *   currentCols   = Math.max(4, Math.floor((containerWidth + MARGIN) / UNIT))
 *   exactGridWidth = currentCols * UNIT - MARGIN
 *
 * exactGridWidth ensures react-grid-layout never changes the unit width,
 * effectively "snapping" every note to a multiple of (COL_WIDTH + MARGIN).
 */

// ── Pure helpers (mirroring CategoryGrid.tsx exactly) ─────────────────────────
const COL_WIDTH = 60;
const MARGIN    = 16;
const UNIT      = COL_WIDTH + MARGIN; // 76

function currentCols(containerWidth: number): number {
    return Math.max(4, Math.floor((containerWidth + MARGIN) / UNIT));
}

function exactGridWidth(containerWidth: number): number {
    return currentCols(containerWidth) * UNIT - MARGIN;
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('Grid snapping — column count', () => {

    it('enforces a minimum of 4 columns regardless of narrow container', () => {
        expect(currentCols(0)).toBe(4);
        expect(currentCols(100)).toBe(4);
        expect(currentCols(200)).toBe(4);
    });

    it('computes correct column count for standard widths', () => {
        // (containerWidth + 16) / 76  →  floor
        // 320 + 16 = 336 / 76 ≈ 4.42  → 4  (but max(4, …) = 4)
        expect(currentCols(320)).toBe(4);

        // 684 + 16 = 700 / 76 ≈ 9.21  → 9
        expect(currentCols(684)).toBe(9);

        // 1200 + 16 = 1216 / 76 = 16
        expect(currentCols(1200)).toBe(16);
    });

    it('increments column count as the container grows by one UNIT', () => {
        const base = currentCols(500);
        // Adding exactly one full unit should bump the column count by 1
        const wider = currentCols(500 + UNIT);
        expect(wider).toBe(base + 1);
    });
});

describe('Grid snapping — exactGridWidth', () => {

    it('is always a multiple of UNIT minus MARGIN', () => {
        for (const w of [300, 500, 700, 900, 1200, 1440]) {
            const gw = exactGridWidth(w);
            // (gw + MARGIN) must be exactly divisible by UNIT
            expect((gw + MARGIN) % UNIT).toBe(0);
        }
    });

    it('is never wider than the container', () => {
        for (const w of [300, 500, 700, 900, 1200, 1440]) {
            expect(exactGridWidth(w)).toBeLessThanOrEqual(w);
        }
    });

    it('differs from the container width by less than one full UNIT', () => {
        for (const w of [300, 500, 700, 900, 1200, 1440]) {
            const diff = w - exactGridWidth(w);
            expect(diff).toBeGreaterThanOrEqual(0);
            expect(diff).toBeLessThan(UNIT);
        }
    });

    it('produces the minimal 4-column grid for very small containers', () => {
        // 4 cols: 4 * 76 - 16 = 288
        expect(exactGridWidth(0)).toBe(4 * UNIT - MARGIN);
        expect(exactGridWidth(200)).toBe(4 * UNIT - MARGIN);
    });
});

describe('Grid snapping — snap alignment', () => {

    it('a note 4 cols wide snaps to exactly COL_WIDTH * 4 + MARGIN * 3 pixels', () => {
        // react-grid-layout renders a note of w=4 as:
        //   4 * COL_WIDTH + 3 * MARGIN = 4*60 + 3*16 = 240 + 48 = 288
        const noteWidth = 4 * COL_WIDTH + 3 * MARGIN;
        expect(noteWidth).toBe(288);
    });

    it('UNIT constant equals COL_WIDTH + MARGIN', () => {
        expect(UNIT).toBe(COL_WIDTH + MARGIN);
    });
});
