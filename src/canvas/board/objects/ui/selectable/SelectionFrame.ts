import { GeometricObject } from "@canvas/board/objects/GeometricObject";
import type { SelectionOverlay } from "@canvas/board/objects/ui/selectable/SelectionOverlay";
import type { BoundingBox } from "@canvas/primitives/space";
import type { Optional } from "@canvas/primitives/types";
import type { RenderContext } from "@canvas/render/RenderContext";
import type { Viewport } from "@canvas/render/Viewport";
import { defaultFrameColor } from "@config/draw";

export class SelectioFrameStyle {
    constructor(
        readonly frameColor: string = defaultFrameColor,
        readonly frameWidth = 1,
    ) {}
}

export class SelectionFrame extends GeometricObject {
    constructor(
        readonly overlay: SelectionOverlay,
        readonly style: SelectioFrameStyle = new SelectioFrameStyle(),
    ) {
        super();
    }

    public boundingBox(viewport: Viewport): BoundingBox {
        const stretch = this.style.frameWidth / 2;

        return this.overlay.selectable.content
            .boundingBox(viewport)
            .stretch(stretch, stretch, stretch, stretch);
    }

    public draw(renderCtx: RenderContext): void {
        const selectionFrame = this.boundingBox(renderCtx.viewport);

        renderCtx.ctx.lineWidth = this.style.frameWidth;

        renderCtx.ctx.globalCompositeOperation = "difference";
        renderCtx.ctx.strokeStyle = "white";
        renderCtx.ctx.strokeRect(
            selectionFrame.position.x,
            selectionFrame.position.y,
            selectionFrame.size.x,
            selectionFrame.size.y,
        );

        renderCtx.ctx.globalCompositeOperation = "source-over";
        renderCtx.ctx.globalAlpha = 0.5;
        renderCtx.ctx.strokeStyle = this.style.frameColor;
        renderCtx.ctx.strokeRect(
            selectionFrame.position.x,
            selectionFrame.position.y,
            selectionFrame.size.x,
            selectionFrame.size.y,
        );
    }

    public castRay(): Optional<GeometricObject[]> {
        // Frame is not hittable
        return undefined;
    }
}
