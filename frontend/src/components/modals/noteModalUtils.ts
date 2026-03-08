/**
 * Shared markdown toolbar utilities for note modals.
 * Operations work on a focused textarea element.
 */

/** Wraps selected text with prefix+suffix (e.g. **bold**). */
export function wrapSelection(
    textarea: HTMLTextAreaElement,
    prefix: string,
    suffix: string,
    setter: (v: string) => void
) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const selected = val.substring(start, end);
    const newVal = val.substring(0, start) + prefix + selected + suffix + val.substring(end);
    setter(newVal);
    requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    });
}

/** Prepends a heading marker to each selected line, toggling on/off. */
export function toggleHeading(
    textarea: HTMLTextAreaElement,
    level: 1 | 2,
    setter: (v: string) => void
) {
    const marker = level === 1 ? '# ' : '## ';
    const otherMarker = level === 1 ? '## ' : '# ';
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const beforeSel = val.substring(0, start);
    const lineStart = beforeSel.lastIndexOf('\n') + 1;
    const afterSel = val.substring(end);
    const lineEndOffset = afterSel.indexOf('\n');
    const lineEnd = lineEndOffset === -1 ? val.length : end + lineEndOffset;

    const selectedBlock = val.substring(lineStart, lineEnd);
    const lines = selectedBlock.split('\n');
    const allMarked = lines.every(l => l.startsWith(marker));

    const toggled = lines.map(l => {
        // Strip the other heading marker if present
        const stripped = l.replace(new RegExp('^' + otherMarker.replace('#', '\\#')), '').replace(new RegExp('^' + marker.replace('#', '\\#')), '');
        return allMarked ? stripped : marker + stripped;
    }).join('\n');

    const newVal = val.substring(0, lineStart) + toggled + val.substring(lineEnd);
    setter(newVal);
    requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(lineStart, lineStart + toggled.length);
    });
}

/** Toggles bullet points on selected lines. */
export function toggleBullets(
    textarea: HTMLTextAreaElement,
    setter: (v: string) => void
) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const beforeSel = val.substring(0, start);
    const lineStart = beforeSel.lastIndexOf('\n') + 1;
    const afterSel = val.substring(end);
    const lineEndOffset = afterSel.indexOf('\n');
    const lineEnd = lineEndOffset === -1 ? val.length : end + lineEndOffset;
    const selectedBlock = val.substring(lineStart, lineEnd);
    const lines = selectedBlock.split('\n');
    const allBulleted = lines.every(l => l.startsWith('- '));
    const toggled = lines.map(l => allBulleted ? l.replace(/^- /, '') : '- ' + l).join('\n');
    const newVal = val.substring(0, lineStart) + toggled + val.substring(lineEnd);
    setter(newVal);
    requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(lineStart, lineStart + toggled.length);
    });
}

export const NOTE_COLORS = [
    { label: 'Default', value: '' },
    { label: 'Sage', value: '#2d3d2e' },
    { label: 'Forest', value: '#1e3a2f' },
    { label: 'Ocean', value: '#1a2a3d' },
    { label: 'Plum', value: '#2e1f3a' },
    { label: 'Clay', value: '#3a2017' },
    { label: 'Dusk', value: '#2d2040' },
    { label: 'Steel', value: '#1a2232' },
    { label: 'Bark', value: '#2d2417' },
];

export function formatReminderDisplay(val: string): string {
    if (!val) return '';
    try {
        const d = new Date(val);
        return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return val; }
}

export function formatDatetimeLocal(val: Date | string): string {
    try {
        const d = new Date(val as string);
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    } catch { return ''; }
}
