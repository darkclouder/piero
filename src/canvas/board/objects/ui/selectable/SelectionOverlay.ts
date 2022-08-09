import type { Board } from "@canvas/board/Board";
import {
    BoardMode,
    canManipulate,
    canMove,
    canSelect,
} from "@canvas/board/controllers/BoardMode";
import { showCanMoveCursor } from "@canvas/board/controllers/objects/MoveObjectController";
import type { GeometricObject } from "@canvas/board/objects//GeometricObject";
import { Group } from "@canvas/board/objects/foundation/Group";
import { ResizeFrame } from "@canvas/board/objects/ui/selectable/ResizeFrame";
import { RotateFrame } from "@canvas/board/objects/ui/selectable/RotateFrame";
import type {
    Selectable,
    SelectionOptions,
} from "@canvas/board/objects/ui/selectable/Selectable";
import { SelectionFrame } from "@canvas/board/objects/ui/selectable/SelectionFrame";
import { resetCursor } from "@canvas/primitives/dom";
import type { Optional } from "@canvas/primitives/types";

export class SelectionOverlay extends Group {
    readonly selectionFrame: SelectionFrame;
    readonly resizeFrame: Optional<ResizeFrame>;
    readonly rotateFrame: Optional<RotateFrame>;

    private _isSelected = false;

    constructor(
        readonly selectable: Selectable,
        readonly options: SelectionOptions,
    ) {
        super();

        this.selectionFrame = new SelectionFrame(this);

        if (this.options.canResize) {
            this.resizeFrame = new ResizeFrame(
                this,
                this.options.resizeHandles,
            );
        }

        if (this.options.canRotate) {
            this.rotateFrame = new RotateFrame(this);
        }

        this.updateChildren();
    }

    public get isSelected(): boolean {
        return this._isSelected;
    }

    public set isSelected(isSelected: boolean) {
        this._isSelected = isSelected;
        this.updateChildren();
    }

    public onSpawn(board: Board): void {
        super.onSpawn(board);

        const ctrl = this.board.controller;
        const mouse = ctrl.mouse;

        this.subscriptions.push(
            mouse.onMouseMove.listen(this.selectable, () => {
                if (
                    this.options.canMove &&
                    canMove(ctrl.mode.state) &&
                    this.isSelected
                ) {
                    showCanMoveCursor();
                }
            }),
        );
        this.subscriptions.push(
            mouse.onMouseOut.listen(this.selectable, () => {
                if (canSelect(ctrl.mode.state)) {
                    resetCursor();
                }
            }),
        );
        // TODO: make this general for all canManipulate modes
        this.subscriptions.push(
            ctrl.mode.onEnter.listen(BoardMode.TextEditing, () => {
                this.updateChildren();
            }),
        );
        this.subscriptions.push(
            ctrl.mode.onExit.listen(BoardMode.TextEditing, () => {
                this.updateChildren();
            }),
        );
    }

    public onDespawn(board: Board): void {
        resetCursor();
        super.onDespawn(board);
    }

    private updateChildren(): void {
        if (this.board === undefined) {
            return;
        }

        const children: GeometricObject[] = [];

        if (this._isSelected) {
            children.push(this.selectionFrame);

            const manipulatable =
                // Only selected
                this.board.controller.select.selectedObjects.size == 1 &&
                canManipulate(this.board.controller.mode.state);

            if (this.options.canRotate && manipulatable) {
                children.push(this.rotateFrame);
            }

            if (this.options.canResize && manipulatable) {
                children.push(this.resizeFrame);
            }
        }

        this.children = children;
    }
}
