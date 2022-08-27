import type { Board } from "canvas/board/Board";
import type { Subscription } from "canvas/primitives/events";
import { unsubscribeAll } from "canvas/primitives/events";
import type { BoundingBox, Vector2 } from "canvas/primitives/space";
import { rayInBoundingBox } from "canvas/primitives/space";
import type { Optional } from "canvas/primitives/types";
import type { RenderContext } from "canvas/render/RenderContext";
import type { RenderObject } from "canvas/render/RenderObject";
import type { Viewport } from "canvas/render/Viewport";

export interface BoundingBoxHolder {
    boundingBox(viewport: Viewport): BoundingBox;
}

export abstract class GeometricObject
    implements RenderObject, BoundingBoxHolder {
    protected board: Optional<Board>;
    protected subscriptions: Subscription[] = [];

    public get needsRedraw(): boolean {
        return false;
    }

    public onSpawn(board: Board): void {
        if (this.board !== undefined) {
            throw "Object already spawned";
        }

        this.board = board;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onDespawn(board: Board): void {
        if (this.board === undefined) {
            throw "Object not spawned";
        }

        unsubscribeAll(this.subscriptions);
        this.board = undefined;
    }

    public castRay(
        position: Vector2,
        viewport: Viewport,
    ): Optional<GeometricObject[]> {
        if (rayInBoundingBox(position, this.boundingBox(viewport))) {
            return [this];
        }

        return undefined;
    }

    public abstract boundingBox(viewport: Viewport): BoundingBox;
    public abstract draw(renderCtx: RenderContext): void;
}
