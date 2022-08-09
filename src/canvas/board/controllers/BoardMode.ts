export enum BoardMode {
    Select,
    Moving,
    Resizing,
    Rotating,
    TextEditing,
}

export function canSelect(mode: BoardMode): boolean {
    return mode === BoardMode.Select;
}

export function canMove(mode: BoardMode): boolean {
    return mode === BoardMode.Select;
}

export function canResize(mode: BoardMode): boolean {
    return mode === BoardMode.Select;
}

export function canRotate(mode: BoardMode): boolean {
    return mode === BoardMode.Select;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canPan(mode: BoardMode): boolean {
    return true;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canZoom(mode: BoardMode): boolean {
    return true;
}

export function canManipulate(mode: BoardMode): boolean {
    return mode !== BoardMode.TextEditing;
}
