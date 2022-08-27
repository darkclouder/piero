import type { Board } from "canvas/board/Board";
import type { MoveObjectEvent } from "canvas/board/controllers/objects/MoveObjectController";
import type { ResizeObjectEvent } from "canvas/board/controllers/objects/ResizeObjectController";
import { worldSpaceResize } from "canvas/board/controllers/objects/ResizeObjectController";
import type { RotateObjectEvent } from "canvas/board/controllers/objects/RotateObjectController";
import { GeometricObject } from "canvas/board/objects/GeometricObject";
import { SelectionOptions } from "canvas/board/objects/ui/selectable/Selectable";
import { BoundingBox, Vector2 } from "canvas/primitives/space";
import type { Optional } from "canvas/primitives/types";
import type { Viewport } from "canvas/render/Viewport";

export interface BoardPositionable {
    position: Vector2;
    size: Vector2;

    /**
     * Clockwise rotation in radians
     */
    radians: number;
    rotationAround: Vector2;
}

export abstract class BoardItem
    extends GeometricObject
    implements BoardPositionable {
    readonly isBoardItem = true;

    readonly selectionOptions: Optional<
        SelectionOptions
    > = new SelectionOptions(true, true, true);

    constructor(
        private _position: Vector2,
        protected _size: Vector2,
        private _radians: number = 0,
        readonly isFixed: boolean = false,
    ) {
        super();
    }

    public get position(): Vector2 {
        return this._position;
    }

    public set position(position: Vector2) {
        this._position = position;
        this.board?.markDirtyObject(this);
    }

    public get size(): Vector2 {
        return this._size;
    }

    public set size(size: Vector2) {
        this._size = size;
        this.board?.markDirtyObject(this);
    }

    public get radians(): number {
        return this._radians;
    }

    public set radians(radians: number) {
        this._radians = radians;
        this.board?.markDirtyObject(this);
    }

    public get rotationAround(): Vector2 {
        return new BoundingBox(this.position, this.size).center();
    }

    public boundingBox(viewport: Viewport): BoundingBox {
        const position = this.positionInViewport(viewport);
        const size = this.sizeInViewport(viewport);

        return new BoundingBox(position, size);
    }

    public onSpawn(board: Board): void {
        super.onSpawn(board);

        this.subscriptions.push(
            board.controller.move.onMove.listen(this, e => {
                this.onMove(e);
            }),
        );
        this.subscriptions.push(
            board.controller.resize.onResize.listen(this, e => {
                this.onResize(e);
            }),
        );
        this.subscriptions.push(
            board.controller.rotate.onRotate.listen(this, e => {
                this.onRotate(e);
            }),
        );
    }

    protected positionInViewport(viewport: Viewport): Vector2 {
        return this.isFixed
            ? this._position
            : viewport.toViewportPosition(this._position);
    }

    protected sizeInViewport(viewport: Viewport): Vector2 {
        return this.isFixed ? this._size : viewport.toViewportSize(this._size);
    }

    protected onResize(e: ResizeObjectEvent): void {
        if (this.board === undefined) {
            return;
        }

        const worldSize = this.board.viewport.toWorldSize(e.size);
        const size = new Vector2(
            Math.max(1, worldSize.x),
            Math.max(1, worldSize.y),
        );

        [this.position, this.size] = worldSpaceResize(
            size,
            e.fixture,
            new BoundingBox(this.position, this.size),
            this.radians,
        );
    }

    private onMove(e: MoveObjectEvent): void {
        const delta = this.isFixed
            ? e.positionDelta
            : this.board.viewport.toWorldSize(e.positionDelta);
        this.position = this.position.plus(delta);
    }

    private onRotate(e: RotateObjectEvent): void {
        if (this.board === undefined) {
            return;
        }

        this.radians = e.radians;
    }
}
