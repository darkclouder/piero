import { GeometricObject } from "@canvas/board/objects/GeometricObject";
import type { Vector2 } from "@canvas/primitives/space";
import { BoundingBox } from "@canvas/primitives/space";
import type { RenderContext } from "@canvas/render/RenderContext";
import type { Viewport } from "@canvas/render/Viewport";
import { defaultStrokeColor } from "@config/draw";

const radian = Math.PI * 2.0;

export class SpinnerStyle {
    constructor(
        readonly color: string = defaultStrokeColor,
        readonly lineWidth: number = 3,
        readonly closedPortion: number = 0.75,
        readonly revolutionTime: number = 1.0,
    ) {}
}

export class Spinner extends GeometricObject {
    constructor(
        public position: Vector2,
        public size: Vector2,
        public style: SpinnerStyle = new SpinnerStyle(),
        public isFixed: boolean = false,
    ) {
        super();

        if (this.size.x != this.size.y) {
            throw new RangeError(
                `Spinner size dimensions need to be eqal, got ${this.size.toString()}`,
            );
        }
    }

    public get needsRedraw(): boolean {
        return true;
    }

    public boundingBox(viewport: Viewport): BoundingBox {
        const position = this.isFixed
            ? this.position
            : viewport.toViewportPosition(this.position);
        const size = this.isFixed
            ? this.size
            : viewport.toViewportSize(this.size);

        return new BoundingBox(position, size);
    }

    public draw(renderCtx: RenderContext): void {
        const viewport = renderCtx.viewport;

        const position = this.isFixed
            ? this.position
            : viewport.toViewportPosition(this.position);
        const size = this.isFixed
            ? this.size
            : viewport.toViewportSize(this.size);

        const lineWidth =
            this.style.lineWidth *
            (this.isFixed ? 1.0 : renderCtx.viewport.zoomLevel);
        const radius = 0.5 * size.x - 0.5 * lineWidth;

        renderCtx.ctx.lineWidth = lineWidth;
        renderCtx.ctx.strokeStyle = this.style.color;

        const startAngle =
            ((renderCtx.timestamp / 1000) % this.style.revolutionTime) * radian;
        const endAngle =
            (startAngle + this.style.closedPortion * radian) % radian;

        renderCtx.ctx.beginPath();
        renderCtx.ctx.arc(
            position.x + 0.5 * size.x,
            position.y + 0.5 * size.y,
            radius,
            startAngle,
            endAngle,
        );
        renderCtx.ctx.stroke();
    }
}
