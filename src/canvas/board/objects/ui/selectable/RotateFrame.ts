import type { Board } from "canvas/board/Board";
import { canRotate } from "canvas/board/controllers/BoardMode";
import { showRotateCursor } from "canvas/board/controllers/objects/RotateObjectController";
import { Group } from "canvas/board/objects/foundation/Group";
import { ResizeHandlePositioning } from "canvas/board/objects/ui/selectable/ResizeHandle";
import { RotateCollider } from "canvas/board/objects/ui/selectable/RotateCollider";
import type { SelectionOverlay } from "canvas/board/objects/ui/selectable/SelectionOverlay";
import { resetCursor } from "canvas/primitives/dom";
import { Vector2 } from "canvas/primitives/space";

export class RotateFrame extends Group {
    constructor(
        readonly overlay: SelectionOverlay,
        readonly rotationOffset: number = 25,
    ) {
        super();

        const content = this.overlay.selectable.content;
        const size = new Vector2(rotationOffset, rotationOffset);

        this.children = [
            new RotateCollider(ResizeHandlePositioning.TopLeft, content, size),
            new RotateCollider(ResizeHandlePositioning.TopRight, content, size),
            new RotateCollider(
                ResizeHandlePositioning.BottomRight,
                content,
                size,
            ),
            new RotateCollider(
                ResizeHandlePositioning.BottomLeft,
                content,
                size,
            ),
        ];
    }

    public onSpawn(board: Board): void {
        super.onSpawn(board);

        const mouse = board.controller.mouse;

        this.subscriptions.push(
            mouse.onMouseOver.listen(this, () => {
                this.onMouseOver();
            }),
        );
        this.subscriptions.push(
            mouse.onMouseOut.listen(this, () => {
                this.onMouseOut();
            }),
        );
    }

    private onMouseOver(): void {
        if (canRotate(this.board.controller.mode.state)) {
            showRotateCursor();
        }
    }

    private onMouseOut(): void {
        if (canRotate(this.board.controller.mode.state)) {
            resetCursor();
        }
    }
}
