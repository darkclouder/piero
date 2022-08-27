import { GeometricObject } from "canvas/board/objects/GeometricObject";
import { BoundingBox, Vector2 } from "canvas/primitives/space";
import type { Optional } from "canvas/primitives/types";

const boundingBox = new BoundingBox(Vector2.origin, Vector2.origin);

export class LayerMarker extends GeometricObject {
    public boundingBox(): BoundingBox {
        return boundingBox;
    }

    public draw(): void {
        // Do nothing
    }

    public castRay(): Optional<GeometricObject[]> {
        return undefined;
    }
}
