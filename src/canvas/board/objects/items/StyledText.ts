import type { Font } from "canvas/board/controllers/board/FontController";
import type { ResizeObjectEvent } from "canvas/board/controllers/objects/ResizeObjectController";
import { worldSpaceResize } from "canvas/board/controllers/objects/ResizeObjectController";
import { AnchorPoint } from "canvas/board/objects/foundation/PositionAnchor";
import {
    MEASURE_FONT_SIZE,
    TextItem,
} from "canvas/board/objects/items/TextItem";
import { BoundingBox, Vector2 } from "canvas/primitives/space";
import type { Optional } from "canvas/primitives/types";
import type { RenderContext } from "canvas/render/RenderContext";
import { maxFontSize, minFontSize } from "config/draw";

export class StyledText extends TextItem {
    readonly isStyledText = true;

    constructor(
        text: string,
        textColor: string,
        fontSize: number,
        font: Font,
        position: Vector2,
        radians = 0,
        isFixed = false,
    ) {
        super(
            textColor,
            fontSize,
            font,
            position,
            Vector2.origin,
            radians,
            isFixed,
        );
        this.text = text;
    }

    public get text(): string {
        return this.lines.join("\n");
    }

    public set text(text: string) {
        this.lines = text.split("\n");
        this.markDirty();
    }

    public draw(renderCtx: RenderContext): void {
        if (this.dirtyText || this.computeInitial) {
            this.updateSize(renderCtx);
            this.dirtyText = false;
            this.computeInitial = false;
        }

        super.draw(renderCtx);
    }

    protected onResize(e: ResizeObjectEvent): void {
        if (this.board === undefined) {
            return;
        }

        const worldSize = this.board.viewport.toWorldSize(e.size);

        const fontSize = this.fontSizeFromBoxSize(worldSize);
        const sizeRatio = fontSize / this._fontSize;
        const newSize = this.size.scale(sizeRatio);

        this._fontSize = fontSize;
        this.ascent *= sizeRatio;

        [this.position, this.size] = worldSpaceResize(
            newSize,
            e.fixture,
            new BoundingBox(this.position, this.size),
            this.radians,
        );
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

        // Make textarea larger than current text to prevent new-lines
        // Before size is updated again
        this.textarea.style.width = `${bb.size.x + 5 * fontSize}px`;
        this.textarea.style.height = `${bb.size.y + 2 * fontSize}px`;

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

    private fontSizeFromBoxSize(size: Vector2): Optional<number> {
        const widthRatio = Math.max(1, size.x) / Math.max(1, this._size.x);
        const heightRatio = Math.max(1, size.y) / Math.max(1, this._size.y);
        const ratio = (widthRatio + heightRatio) / 2;

        // Note: Max font size with min zoom does not work in Firefox
        return Math.min(
            maxFontSize,
            Math.max(minFontSize, this._fontSize * ratio),
        );
    }

    private updateSize(renderCtx: RenderContext): void {
        const measureFontSize = Math.min(MEASURE_FONT_SIZE, this._fontSize);
        const fontSizeRatio = this._fontSize / measureFontSize;

        const metrics = measureText(
            this.lines,
            this.font.toCss(measureFontSize),
            renderCtx,
        );

        const maxWidth = Math.max(...metrics.map(m => m.width));

        const width = maxWidth * fontSizeRatio;
        const height = metrics.length * this._fontSize;

        const firstNonZeroAscent = metrics
            .map(m => m.actualBoundingBoxAscent)
            .reduce((a, b) => a || b, 0);

        this.ascent = firstNonZeroAscent * fontSizeRatio;

        const newSize = new Vector2(width, height);

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
    }
}

function measureText(
    lines: string[],
    font: string,
    renderCtx: RenderContext,
): TextMetrics[] {
    renderCtx.ctx.save();

    renderCtx.ctx.font = font;
    const metrics = lines.map(line => renderCtx.ctx.measureText(line));

    renderCtx.ctx.restore();

    return metrics;
}
