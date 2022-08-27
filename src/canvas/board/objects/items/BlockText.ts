import type { Font } from "canvas/board/controllers/board/FontController";
import type { ResizeObjectEvent } from "canvas/board/controllers/objects/ResizeObjectController";
import { worldSpaceResize } from "canvas/board/controllers/objects/ResizeObjectController";
import { AnchorPoint } from "canvas/board/objects/foundation/PositionAnchor";
import {
    MEASURE_FONT_SIZE,
    TextItem,
} from "canvas/board/objects/items/TextItem";
import { ResizeHandlePositioning } from "canvas/board/objects/ui/selectable/ResizeHandle";
import { SelectionOptions } from "canvas/board/objects/ui/selectable/Selectable";
import { BoundingBox, Vector2 } from "canvas/primitives/space";
import type { RenderContext } from "canvas/render/RenderContext";

export class BlockText extends TextItem {
    readonly isBlockText = true;

    readonly selectionOptions = new SelectionOptions(true, true, true, [
        ResizeHandlePositioning.MiddleLeft,
        ResizeHandlePositioning.MiddleRight,
    ]);

    private _text: string;

    constructor(
        text: string,
        textColor: string,
        fontSize: number,
        font: Font,
        position: Vector2,
        size: Vector2,
        radians = 0,
        isFixed = false,
    ) {
        super(textColor, fontSize, font, position, size, radians, isFixed);
        this.text = text;
    }

    public get text(): string {
        return this._text;
    }

    public set text(text: string) {
        this._text = text;
        this.markDirty();
    }

    public draw(renderCtx: RenderContext): void {
        this.updateForRender(renderCtx);
        super.draw(renderCtx);
    }

    public updateForRender(renderCtx: RenderContext): void {
        if (this.dirtyText || this.computeInitial) {
            this.updateWrapping(renderCtx);
            this.updateSize(renderCtx);
            this.dirtyText = false;
            this.computeInitial = false;
        }
    }

    protected onResize(e: ResizeObjectEvent): void {
        if (this.board === undefined) {
            return;
        }

        const worldSize = this.board.viewport.toWorldSize(e.size);
        const size = new Vector2(
            Math.max(this._fontSize, worldSize.x),
            this.size.y,
        );

        [this.position, this.size] = worldSpaceResize(
            size,
            e.fixture,
            new BoundingBox(this.position, this.size),
            this.radians,
        );

        this.markDirty();
    }

    protected updateTextarea(): void {
        if (this.textarea === undefined) {
            return;
        }

        const viewport = this.board.viewport;
        const bb = this.boundingBox(viewport);
        const fontSize = viewport.zoomLevel * this._fontSize;

        this.textarea.style.left = `${bb.position.x}px`;
        this.textarea.style.top = `${bb.position.y}px`;

        this.textarea.style.width = `${bb.size.x}px`;
        this.textarea.style.height = `${bb.size.y}px`;

        if (this.radians != 0) {
            this.textarea.style.transform = `rotate(${this.radians}rad)`;
            this.textarea.style.transformOrigin = `${bb.size.x / 2}px ${
                bb.size.y / 2
            }px`;
        }

        this.textarea.style.font = this.font.toCss(fontSize);
        this.textarea.style.lineHeight = `${fontSize}px`;

        this.textarea.scrollTop = 0;
    }

    private updateWrapping(renderCtx: RenderContext): void {
        const lines = this._text.split("\n");
        const width = (MEASURE_FONT_SIZE / this._fontSize) * this._size.x;

        renderCtx.ctx.save();
        renderCtx.ctx.font = this.font.toCss(MEASURE_FONT_SIZE);

        const wrappedLines = lines.map(line =>
            wrapLine(renderCtx, line, width),
        );

        renderCtx.ctx.restore();

        this.lines = (<string[]>[]).concat(...wrappedLines);
    }

    private updateSize(renderCtx: RenderContext): void {
        const height = this.lines.length * this._fontSize;
        const newSize = new Vector2(this._size.x, height);

        if (this.computeInitial) {
            this.size = newSize;
        } else {
            [this.position, this.size] = worldSpaceResize(
                newSize,
                AnchorPoint.TopLeft,
                new BoundingBox(this.position, this._size),
                this.radians,
            );
        }

        const measureFontSize = Math.min(MEASURE_FONT_SIZE, this._fontSize);

        const ascent = measureAscent(
            this.lines,
            this.font.toCss(measureFontSize),
            renderCtx,
        );
        this.ascent = (this._fontSize / measureFontSize) * ascent;
    }
}

function measureAscent(
    lines: string[],
    font: string,
    renderCtx: RenderContext,
): number {
    renderCtx.ctx.save();

    renderCtx.ctx.font = font;

    for (const line of lines) {
        const metrics = renderCtx.ctx.measureText(line);

        if (metrics.actualBoundingBoxAscent > 0) {
            return metrics.actualBoundingBoxAscent;
        }
    }

    renderCtx.ctx.restore();

    return 0;
}

function wrapLine(
    renderCtx: RenderContext,
    unwrapped: string,
    maxWidth: number,
): string[] {
    const metrics = renderCtx.ctx.measureText(unwrapped);

    if (metrics.width <= maxWidth) {
        return [unwrapped];
    }

    const wrapped: string[] = [""];

    const words = unwrapped.split(" ");

    for (const word of words) {
        const i = wrapped.length - 1;
        const pending = wrapped[i];

        // First attempt: word-wrapping
        const testLine = pending + word;
        const metrics = renderCtx.ctx.measureText(testLine);

        if (metrics.width > maxWidth) {
            const wordMetrics = renderCtx.ctx.measureText(word);

            if (wordMetrics.width > maxWidth) {
                // Even one word does not fit:
                // Fall back to character wrapping

                if (pending.length == 0) {
                    wrapped.pop();
                }

                wrapped.push(...wrapWord(renderCtx, word, maxWidth));
            } else {
                wrapped.push(word + " ");
            }
        } else {
            // Word still fits, add it to current line
            wrapped[i] = testLine + " ";
        }
    }

    return wrapped;
}

function wrapWord(
    renderCtx: RenderContext,
    unwrapped: string,
    maxWidth: number,
): string[] {
    const n = unwrapped.length;
    const wrapped: string[] = [];
    let pending = "";

    for (let i = 0; i < n; ++i) {
        const testLine = pending + unwrapped[i];
        const metrics = renderCtx.ctx.measureText(testLine);

        if (metrics.width > maxWidth) {
            wrapped.push(pending);
            pending = unwrapped[i];
        } else {
            pending = testLine;
        }
    }

    if (pending.length > 0) {
        wrapped.push(pending + " ");
    }

    return wrapped;
}
