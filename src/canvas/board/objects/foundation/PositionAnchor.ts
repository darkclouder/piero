import type { BoundingBoxHolder } from "@canvas/board/objects/GeometricObject";
import { Vector2 } from "@canvas/primitives/space";
import type { Viewport } from "@canvas/render/Viewport";

export interface PositionHolder {
    position(viewport: Viewport): Vector2;
}

export enum AnchorPoint {
    TopLeft,
    TopRight,
    BottomRight,
    BottomLeft,
}

export class PositionAnchor {
    constructor(
        readonly anchorTo: BoundingBoxHolder,
        readonly anchorPoint: AnchorPoint = AnchorPoint.TopLeft,
        readonly offset: Vector2 = Vector2.origin,
    ) {}

    public position(viewport: Viewport): Vector2 {
        const boundingBox = this.anchorTo.boundingBox(viewport);

        const position = boundingBox.position.plus(this.offset);

        switch (this.anchorPoint) {
            case AnchorPoint.TopLeft:
                return position;
            case AnchorPoint.TopRight:
                return position.plus(new Vector2(boundingBox.size.x, 0));
            case AnchorPoint.BottomLeft:
                return position.plus(new Vector2(0, boundingBox.size.y));
            case AnchorPoint.BottomRight:
                return position.plus(
                    new Vector2(boundingBox.size.x, boundingBox.size.y),
                );
        }
    }
}
