import { GeometricObject } from "@canvas/board/objects/GeometricObject";
import { BoundingBox, Vector2 } from "@canvas/primitives/space";
import type { RenderContext } from "@canvas/render/RenderContext";

export class WorldBorder extends GeometricObject {
    constructor(
        readonly horizontal: boolean,
        readonly fillColor: string = "#555555",
        readonly borderColor: string = "#000000",
        readonly borderWidth: number = 1.0,
    ) {
        super();
    }

    public boundingBox(): BoundingBox {
        return new BoundingBox(Vector2.origin, Vector2.origin);
    }

    public draw(renderCtx: RenderContext): void {
        const viewport = renderCtx.viewport;
        const ctx = renderCtx.ctx;

        const width = this.horizontal
            ? viewport.size.x
            : -viewport.origin.x * viewport.zoomLevel;
        const height = this.horizontal
            ? -viewport.origin.y * viewport.zoomLevel
            : viewport.size.y;

        if (width > 0 && height > 0) {
            // Invalid area background
            ctx.fillStyle = this.fillColor;
            ctx.fillRect(0, 0, width, height);

            // Border
            ctx.beginPath();
            ctx.lineWidth = this.borderWidth;
            ctx.strokeStyle = this.borderColor;
            ctx.moveTo(
                -viewport.origin.x * viewport.zoomLevel,
                -viewport.origin.y * viewport.zoomLevel,
            );
            ctx.lineTo(width, height);
            ctx.stroke();
        }
    }
}
