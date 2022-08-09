import type { Board } from "@canvas/board/Board";
import { GeometricObject } from "@canvas/board/objects/GeometricObject";
import type { BoardPositionable } from "@canvas/board/objects/items/BoardItem";
import { BoundingBox, Vector2 } from "@canvas/primitives/space";
import type { Optional } from "@canvas/primitives/types";
import { tintBoundingBox } from "@canvas/render/CanvasLayer";
import type { RenderContext } from "@canvas/render/RenderContext";
import type { Viewport } from "@canvas/render/Viewport";
import { DebugConfig } from "@config/debug";

export class RotateContainer<
    T extends GeometricObject
> extends GeometricObject {
    constructor(readonly content: T, readonly positionable: BoardPositionable) {
        super();
    }

    public boundingBox(viewport: Viewport): BoundingBox {
        return rotateBoundingBox(
            this.content.boundingBox(viewport),
            this.positionable.radians,
            this.getRotationCenter(viewport),
        );
    }

    public draw(renderCtx: RenderContext): void {
        const radians = this.positionable.radians;

        setRenderContextRotation(
            renderCtx,
            radians,
            this.getRotationCenter(renderCtx.viewport),
        );

        if (DebugConfig.tintBoundingBoxes) {
            tintBoundingBox(this.content, renderCtx);
        }

        this.content.draw(renderCtx);
    }

    public castRay(
        position: Vector2,
        viewport: Viewport,
    ): Optional<GeometricObject[]> {
        const radians = this.positionable.radians;

        // Counter-rotate ray position, not content bounding box
        position = position.rotate(-radians, this.getRotationCenter(viewport));

        const stack = this.content.castRay(position, viewport);

        if (stack !== undefined) {
            stack.push(this);
        }

        return stack;
    }

    public onSpawn(board: Board): void {
        super.onSpawn(board);
        this.content.onSpawn(board);
    }

    public onDespawn(board: Board): void {
        this.content.onDespawn(board);
        super.onDespawn(board);
    }

    private getRotationCenter(viewport: Viewport): Vector2 {
        return viewport.toViewportPosition(this.positionable.rotationAround);
    }
}

export function rotateBoundingBox(
    boundingBox: BoundingBox,
    radians: number,
    around: Vector2 = boundingBox.center(),
): BoundingBox {
    if (radians == 0) {
        return boundingBox;
    }

    const corners = boundingBoxCorners(boundingBox).map(point =>
        point.rotate(radians, around),
    );

    return boundingBoxOfPoints(corners);
}

function setRenderContextRotation(
    renderCtx: RenderContext,
    radians: number,
    around: Vector2,
): void {
    if (radians != 0) {
        renderCtx.ctx.translate(around.x, around.y);
        // Canvas rotation is clock-wise, hence needs to me inverted
        renderCtx.ctx.rotate(radians);
        renderCtx.ctx.translate(-around.x, -around.y);
    }
}

function boundingBoxCorners(boundingBox: BoundingBox): Vector2[] {
    return [
        // Top left
        boundingBox.position,
        // Top right
        new Vector2(
            boundingBox.position.x + boundingBox.size.x,
            boundingBox.position.y,
        ),
        // Bottom right
        new Vector2(
            boundingBox.position.x + boundingBox.size.x,
            boundingBox.position.y + boundingBox.size.y,
        ),
        // Bottom left
        new Vector2(
            boundingBox.position.x,
            boundingBox.position.y + boundingBox.size.y,
        ),
    ];
}

function boundingBoxOfPoints(points: Vector2[]): BoundingBox {
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const point of points) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
    }

    return new BoundingBox(
        new Vector2(minX, minY),
        new Vector2(maxX - minX, maxY - minY),
    );
}
