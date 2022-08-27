import { GeometricObject } from "canvas/board/objects/GeometricObject";
import { BoundingBox, Vector2 } from "canvas/primitives/space";
import type { RenderContext } from "canvas/render/RenderContext";
import type { Viewport } from "canvas/render/Viewport";
import { defaultFrameColor, defaultFrameFill } from "config/draw";

export class SelectBoxFrame extends GeometricObject {
    constructor(
        readonly frameColor: string = defaultFrameColor,
        readonly frameWidth = 1,
        readonly fillColor: string = defaultFrameFill,
        private position: Vector2 = Vector2.origin,
        private size: Vector2 = Vector2.origin,
    ) {
        super();
    }

    public boundingBox(viewport: Viewport): BoundingBox {
        const position = viewport.toViewportPosition(this.position);
        const size = viewport.toViewportSize(this.size);

        return new BoundingBox(position, size);
    }

    public draw(renderCtx: RenderContext): void {
        const viewport = renderCtx.viewport;
        const position = viewport.toViewportPosition(this.position);
        const size = viewport.toViewportSize(this.size);

        renderCtx.ctx.fillStyle = this.fillColor;
        renderCtx.ctx.fillRect(position.x, position.y, size.x, size.y);
        renderCtx.ctx.strokeStyle = this.frameColor;
        renderCtx.ctx.lineWidth = this.frameWidth;
        renderCtx.ctx.strokeRect(position.x, position.y, size.x, size.y);
    }

    public updateSize(position: Vector2, size: Vector2): void {
        this.position = position;
        this.size = size;

        if (this.board) {
            this.board.markDirtyObject(this);
        }
    }
}
