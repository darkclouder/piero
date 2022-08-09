import { Vector2 } from "@canvas/primitives/space";

export function mousePositionToElement(
    e: { clientX: number; clientY: number },
    element: HTMLElement,
): Vector2 {
    const clientRect = element.getBoundingClientRect();

    return new Vector2(e.clientX - clientRect.x, e.clientY - clientRect.y);
}

export function setCursor(cursor: string): void {
    document.body.style.cursor = cursor;
}

export function resetCursor(): void {
    setCursor("auto");
}
