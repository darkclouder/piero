import { BoardItem } from "canvas/board/objects/items/BoardItem";
import type { Vector2 } from "canvas/primitives/space";
import type { RenderContext } from "canvas/render/RenderContext";
import { defaultFillColor } from "config/draw";

export class Rectangle extends BoardItem {
    constructor(
        public fillColor: string = defaultFillColor,
        position: Vector2,
        size: Vector2,
        radians = 0,
        isFixed = false,
    ) {
        super(position, size, radians, isFixed);
    }

    public draw(renderCtx: RenderContext): void {
        const viewport = renderCtx.viewport;
        const position = this.positionInViewport(viewport);
        const size = this.sizeInViewport(viewport);

        renderCtx.ctx.fillStyle = this.fillColor;
        renderCtx.ctx.fillRect(position.x, position.y, size.x, size.y);
    }
}
