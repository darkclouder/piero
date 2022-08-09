import type { Board } from "@canvas/board/Board";
import { GeometricObject } from "@canvas/board/objects/GeometricObject";
import type { BoardItem } from "@canvas/board/objects/items/BoardItem";
import { ResizeHandlePositioning } from "@canvas/board/objects/ui/selectable/ResizeHandle";
import { BoundingBox, Vector2 } from "@canvas/primitives/space";
import type { Viewport } from "@canvas/render/Viewport";

export class RotateCollider extends GeometricObject {
    constructor(
        private corner: ResizeHandlePositioning,
        private content: BoardItem,
        private size: Vector2,
    ) {
        super();
    }

    public boundingBox(viewport: Viewport): BoundingBox {
        const bb = this.content.boundingBox(viewport);
        const position = bb.position.plus(this.getOffset(bb));

        return new BoundingBox(position, this.size);
    }

    public onSpawn(board: Board): void {
        super.onSpawn(board);

        const mouse = board.controller.mouse;

        this.subscriptions.push(
            mouse.onMouseDown.listen(this, e => {
                this.board.controller.rotate.startRotating(e, this.content);
            }),
        );
    }

    public draw(): void {
        // Nothing
    }

    private getOffset(referenceBox: BoundingBox): Vector2 {
        switch (this.corner) {
            case ResizeHandlePositioning.TopLeft:
                return new Vector2(-this.size.x, -this.size.y);
            case ResizeHandlePositioning.TopRight:
                return new Vector2(referenceBox.size.x, -this.size.y);
            case ResizeHandlePositioning.BottomRight:
                return referenceBox.size;
            case ResizeHandlePositioning.BottomLeft:
                return new Vector2(-this.size.x, referenceBox.size.y);
        }
    }
}
