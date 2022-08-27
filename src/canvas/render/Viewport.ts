import { Vector2 } from "canvas/primitives/space";

export class Viewport {
    static readonly world = new Viewport(Vector2.origin, 1.0, Vector2.origin);

    constructor(
        readonly size: Vector2 = Vector2.origin,
        readonly zoomLevel: number = 1.0,
        readonly origin: Vector2 = Vector2.origin,
    ) {}

    public modified(
        size: Vector2 = this.size,
        zoomLevel: number = this.zoomLevel,
        origin: Vector2 = this.origin,
    ): Viewport {
        return new Viewport(size, zoomLevel, origin);
    }

    public toViewportPosition(worldPosition: Vector2): Vector2 {
        return new Vector2(
            this.zoomLevel * (worldPosition.x - this.origin.x),
            this.zoomLevel * (worldPosition.y - this.origin.y),
        );
    }

    public toViewportSize(worldSize: Vector2): Vector2 {
        return worldSize.scale(this.zoomLevel);
    }

    public toWorldPosition(viewportPosition: Vector2): Vector2 {
        return new Vector2(
            viewportPosition.x / this.zoomLevel + this.origin.x,
            viewportPosition.y / this.zoomLevel + this.origin.y,
        );
    }

    public toWorldSize(viewportSize: Vector2): Vector2 {
        return viewportSize.scale(1 / this.zoomLevel);
    }
}

export class TopLeftClippedViewport extends Viewport {
    constructor(
        private viewportClipOffset: Vector2,
        size?: Vector2,
        zoomLevel?: number,
        origin?: Vector2,
    ) {
        super(size, zoomLevel, origin);
    }

    public modified(
        size: Vector2 = this.size,
        zoomLevel: number = this.zoomLevel,
        origin: Vector2 = this.origin,
    ): TopLeftClippedViewport {
        const clippedOrigin = new Vector2(
            Math.max(
                Math.min(this.viewportClipOffset.x, -0.5 * this.size.x) /
                    this.zoomLevel,
                origin.x,
            ),
            Math.max(
                Math.min(this.viewportClipOffset.y, -0.5 * this.size.y) /
                    this.zoomLevel,
                origin.y,
            ),
        );

        return new TopLeftClippedViewport(
            this.viewportClipOffset,
            size,
            zoomLevel,
            clippedOrigin,
        );
    }
}

export interface ViewportHolder {
    viewport: Viewport;
}
