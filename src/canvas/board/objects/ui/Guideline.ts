import type { Guide } from "canvas/board/controllers/objects/GuidelineController";
import { GeometricObject } from "canvas/board/objects/GeometricObject";
import { BoundingBox, Vector2 } from "canvas/primitives/space";
import type { RenderContext } from "canvas/render/RenderContext";

export class Guideline extends GeometricObject {
    readonly isGuideline = true;

    constructor(readonly guide: Guide) {
        super();
    }

    public boundingBox(): BoundingBox {
        return new BoundingBox(Vector2.origin, Vector2.origin);
    }

    public draw(renderCtx: RenderContext): void {
        const viewport = renderCtx.viewport;
        const ctx = renderCtx.ctx;

        const viewPosition = viewport.origin;

        const relativePos = this.guide.vertical
            ? viewPosition.x
            : viewPosition.y;
        const pos = viewport.zoomLevel * (this.guide.value - relativePos);

        ctx.beginPath();
        ctx.moveTo(
            this.guide.vertical ? pos : 0,
            this.guide.vertical ? 0 : pos,
        );
        ctx.lineTo(
            this.guide.vertical ? pos : viewport.size.x,
            this.guide.vertical ? viewport.size.y : pos,
        );
        ctx.stroke();
    }
}
