import type { Board } from "canvas/board/Board";
import { DespawnEvent, SpawnEvent } from "canvas/board/Board";
import { GeometricObject } from "canvas/board/objects/GeometricObject";
import { BoundingBox, Vector2 } from "canvas/primitives/space";
import type { Optional } from "canvas/primitives/types";
import { tintBoundingBox } from "canvas/render/CanvasLayer";
import type { RenderContext } from "canvas/render/RenderContext";
import type { Viewport } from "canvas/render/Viewport";
import { DebugConfig } from "config/debug";

export class Group extends GeometricObject {
    protected board: Optional<Board>;

    constructor(private _children: GeometricObject[] = []) {
        super();
    }

    public get needsRedraw(): boolean {
        return this._children.some(child => child.needsRedraw);
    }

    public boundingBox(viewport: Viewport): BoundingBox {
        if (this._children.length > 0) {
            // Smallest bounding box containing all children
            const boundingBoxes = this._children.map(child =>
                child.boundingBox(viewport),
            );
            return containingBoundingBox(boundingBoxes);
        }

        return new BoundingBox(new Vector2(0, 0), new Vector2(0, 0));
    }

    public draw(renderCtx: RenderContext): void {
        for (const child of this._children) {
            // Reset to default state
            renderCtx.ctx.save();
            child.draw(renderCtx);
            renderCtx.ctx.restore();

            if (DebugConfig.tintBoundingBoxes) {
                tintBoundingBox(child, renderCtx);
            }
        }
    }

    public castRay(
        position: Vector2,
        viewport: Viewport,
    ): Optional<GeometricObject[]> {
        // Children are sorted highest to lowest
        // For raycast, top-to-bottom is needed, hence: reverse iteration

        for (const child of this._children.reversed()) {
            const stack = child.castRay(position, viewport);

            if (stack !== undefined) {
                stack.push(this);
                return stack;
            }
        }

        return undefined;
    }

    public get children(): GeometricObject[] {
        return this._children;
    }

    public set children(children: GeometricObject[]) {
        if (this.board !== undefined) {
            const oldSet = new Set(this._children);
            const newSet = new Set(children);

            // Despawn old ones not there any more
            const despawned = this._children.filter(
                child => !newSet.has(child),
            );
            const spawned = children.filter(child => !oldSet.has(child));

            despawned.forEach(child => {
                child.onDespawn(this.board);
            });

            spawned.forEach(child => {
                child.onSpawn(this.board);
            });
        }

        this._children = children;
        this.markDirty();
    }

    public onSpawn(board: Board): void {
        super.onSpawn(board);
        this._children.forEach(child => {
            child.onSpawn(board);
            board.onSpawn.dispatch(new SpawnEvent([child]));
        });

        this.board = board;
    }

    public onDespawn(board: Board): void {
        this._children.forEach(child => {
            child.onDespawn(board);
            board.onDespawn.dispatch(new DespawnEvent([child]));
        });
        super.onDespawn(board);

        this.board = undefined;
    }

    private markDirty(): void {
        if (this.board !== undefined) {
            this.board.markDirtyObject(this);
        }
    }
}

export function containingBoundingBox(
    boundingBoxes: BoundingBox[],
): BoundingBox {
    const minX = Math.min(...boundingBoxes.map(b => b.position.x));
    const minY = Math.min(...boundingBoxes.map(b => b.position.y));
    const maxX = Math.max(...boundingBoxes.map(b => b.position.x + b.size.x));
    const maxY = Math.max(...boundingBoxes.map(b => b.position.y + b.size.y));

    return new BoundingBox(
        new Vector2(minX, minY),
        new Vector2(maxX - minX, maxY - minY),
    );
}
