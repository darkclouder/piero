import type { Board } from "@canvas/board/Board";
import { BoardMode, canResize } from "@canvas/board/controllers/BoardMode";
import type {
    MouseDownEvent,
    MouseMoveEvent,
} from "@canvas/board/controllers/objects/MouseInteractionController";
import { AnchorPoint } from "@canvas/board/objects/foundation/PositionAnchor";
import type { GeometricObject } from "@canvas/board/objects/GeometricObject";
import type { ResizeHandle } from "@canvas/board/objects/ui/selectable/ResizeHandle";
import { ResizeHandlePositioning } from "@canvas/board/objects/ui/selectable/ResizeHandle";
import { resetCursor } from "@canvas/primitives/dom";
import type { Subscription } from "@canvas/primitives/events";
import {
    EventBase,
    EventHandler,
    unsubscribeAll,
} from "@canvas/primitives/events";
import type { BoundingBox } from "@canvas/primitives/space";
import { Vector2 } from "@canvas/primitives/space";
import type { Optional } from "@canvas/primitives/types";
import type { ModifierState } from "@canvas/utils/input/ModifierState";

export class ResizeObjectEvent extends EventBase<GeometricObject> {
    constructor(
        readonly size: Vector2,
        readonly fixture: AnchorPoint,
        readonly modifiers: ModifierState,
        eventStack?: GeometricObject[],
    ) {
        super(eventStack);
    }
}

export class ResizeObjectController {
    readonly onResize = new EventHandler<ResizeObjectEvent>();

    private subscriptions: Subscription[] = [];
    private resizeSubscriptions: Subscription[] = [];
    private previousState: BoardMode;
    private resizeHandle: Optional<ResizeHandle> = undefined;

    constructor(readonly board: Board) {}

    public activate(): void {
        const mode = this.board.controller.mode;

        this.subscriptions.push(
            mode.onEnter.listen(BoardMode.Resizing, () => {
                this.enterResizing();
            }),
        );
        this.subscriptions.push(
            mode.onExit.listen(BoardMode.Resizing, () => {
                this.exitResizing();
            }),
        );
    }

    public deactivate(): void {
        unsubscribeAll(this.resizeSubscriptions);
    }

    public startResizing(e: MouseDownEvent): void {
        const mode = this.board.controller.mode;

        if (!canResize(mode.state)) {
            return;
        }

        this.resizeHandle = <ResizeHandle>e.target;

        this.previousState = mode.state;
        this.board.controller.mode.state = BoardMode.Resizing;
    }

    private enterResizing(): void {
        this.resizeHandle.showResizingCursor();

        const mouse = this.board.controller.mouse;

        this.resizeSubscriptions.push(
            mouse.onMouseUp.listen(undefined, () => {
                this.board.controller.mode.state = this.previousState;
            }),
        );
        this.resizeSubscriptions.push(
            mouse.onMouseMove.listen(undefined, e => {
                this.onResizeMove(e);
            }),
        );
    }

    private exitResizing(): void {
        this.resizeHandle = undefined;
        resetCursor();
        unsubscribeAll(this.resizeSubscriptions);
    }

    private onResizeMove(e: MouseMoveEvent): void {
        if (this.board.controller.mode.state !== BoardMode.Resizing) {
            return;
        }

        this.resizeHandle?.showResizingCursor();

        const size = this.getResiseSize(e.position);
        const fixture = this.getResizeFixture();
        const content = this.resizeHandle.frame.overlay.selectable.content;

        this.onResize.dispatch(
            new ResizeObjectEvent(size, fixture, e.modifiers, [content]),
        );
    }

    private getResizeFixture(): AnchorPoint {
        switch (this.resizeHandle.positioning) {
            case ResizeHandlePositioning.TopLeft:
            case ResizeHandlePositioning.TopCenter:
            case ResizeHandlePositioning.MiddleLeft:
                return AnchorPoint.BottomRight;
            case ResizeHandlePositioning.MiddleRight:
            case ResizeHandlePositioning.BottomRight:
            case ResizeHandlePositioning.BottomCenter:
                return AnchorPoint.TopLeft;
            case ResizeHandlePositioning.BottomLeft:
                return AnchorPoint.TopRight;
            case ResizeHandlePositioning.TopRight:
                return AnchorPoint.BottomLeft;
        }
    }

    private getResiseSize(mousePosition: Vector2): Vector2 {
        const viewport = this.board.viewport;
        const content = this.resizeHandle.frame.overlay.selectable.content;
        const contentBox = content.boundingBox(viewport);
        const topLeft = contentBox.position;
        const bottomRight = contentBox.position.plus(contentBox.size);

        mousePosition = mousePosition.rotate(
            -content.radians,
            viewport.toViewportPosition(content.rotationAround),
        );

        let width = contentBox.size.x;
        let height = contentBox.size.y;

        // Width
        switch (this.resizeHandle.positioning) {
            case ResizeHandlePositioning.TopLeft:
            case ResizeHandlePositioning.BottomLeft:
            case ResizeHandlePositioning.MiddleLeft:
                width += topLeft.x - mousePosition.x;
                break;
            case ResizeHandlePositioning.TopRight:
            case ResizeHandlePositioning.MiddleRight:
            case ResizeHandlePositioning.BottomRight:
                width += -bottomRight.x + mousePosition.x;
                break;
        }

        // Height
        switch (this.resizeHandle.positioning) {
            case ResizeHandlePositioning.TopLeft:
            case ResizeHandlePositioning.TopCenter:
            case ResizeHandlePositioning.TopRight:
                height += topLeft.y - mousePosition.y;
                break;
            case ResizeHandlePositioning.BottomRight:
            case ResizeHandlePositioning.BottomCenter:
            case ResizeHandlePositioning.BottomLeft:
                height += -bottomRight.y + mousePosition.y;
                break;
        }

        return new Vector2(width, height);
    }
}

function resizePosition(
    original: BoundingBox,
    size: Vector2,
    fixture: AnchorPoint,
): Vector2 {
    switch (fixture) {
        case AnchorPoint.TopLeft:
            return original.position;
        case AnchorPoint.TopRight:
            return new Vector2(
                original.position.x + original.size.x - size.x,
                original.position.y,
            );
        case AnchorPoint.BottomRight:
            return new Vector2(
                original.position.x + original.size.x - size.x,
                original.position.y + original.size.y - size.y,
            );
        case AnchorPoint.BottomLeft:
            return new Vector2(
                original.position.x,
                original.position.y + original.size.y - size.y,
            );
    }
}

export function worldSpaceResize(
    worldSize: Vector2,
    fixture: AnchorPoint,
    worldOriginal: BoundingBox,
    radians: number,
): [Vector2, Vector2] {
    const worldPosition = resizePosition(worldOriginal, worldSize, fixture);

    if (radians != 0) {
        // Object is rotated.
        // When resizing, the center point of the object changes.
        // To keep all unchanged corners in their original position,
        // some adjustmends need to be done.

        // Old center point
        const center = worldOriginal.center();

        // Rotated new left top point with old center point
        const topLeft = worldPosition.rotate(radians, center);

        // Rotated new bottom right point with old center point
        const bottomRight = worldPosition
            .plus(worldSize)
            .rotate(radians, center);

        // New center point is center between these new points
        const newCenter = topLeft.plus(bottomRight).scale(0.5);

        // New top-left position is what you need to plug into the rotation
        // with newCenter to get to topLeft.
        // To get this position, reverse the rotation from earlier,
        // but not around center, but around newCenter
        const newPosition = topLeft.rotate(-radians, newCenter);

        return [newPosition, worldSize];
    }

    return [worldPosition, worldSize];
}
