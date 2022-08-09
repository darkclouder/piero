import type { Board } from "@canvas/board/Board";
import { BoardMode, canRotate } from "@canvas/board/controllers/BoardMode";
import type {
    MouseDownEvent,
    MouseMoveEvent,
} from "@canvas/board/controllers/objects/MouseInteractionController";
import type { GeometricObject } from "@canvas/board/objects/GeometricObject";
import type { BoardItem } from "@canvas/board/objects/items/BoardItem";
import { resetCursor, setCursor } from "@canvas/primitives/dom";
import type { Subscription } from "@canvas/primitives/events";
import {
    EventBase,
    EventHandler,
    unsubscribeAll,
} from "@canvas/primitives/events";
import type { Vector2 } from "@canvas/primitives/space";
import { Binding } from "@config/bindings";
import { rotateStepSize } from "@config/interaction";

export class RotateObjectEvent extends EventBase<GeometricObject> {
    constructor(readonly radians: number, eventStack?: GeometricObject[]) {
        super(eventStack);
    }
}

export class RotateObjectController {
    readonly onRotate = new EventHandler<RotateObjectEvent>();

    private subscriptions: Subscription[] = [];
    private rotateSubscriptions: Subscription[] = [];
    private previousState: BoardMode;
    private rotationCenter: Vector2;
    private startCursorRadians: number;
    private startObjectRadians: number;

    constructor(readonly board: Board) {}

    public activate(): void {
        const mode = this.board.controller.mode;

        this.subscriptions.push(
            mode.onEnter.listen(BoardMode.Rotating, () => {
                this.enterRotating();
            }),
        );
        this.subscriptions.push(
            mode.onExit.listen(BoardMode.Rotating, () => {
                this.exitRotating();
            }),
        );
    }

    public deactivate(): void {
        unsubscribeAll(this.rotateSubscriptions);
        unsubscribeAll(this.subscriptions);
    }

    public startRotating(e: MouseDownEvent, target: BoardItem): void {
        const mode = this.board.controller.mode;

        if (!canRotate(mode.state)) {
            return;
        }

        this.rotationCenter = target.boundingBox(this.board.viewport).center();
        this.startCursorRadians = relativeRadians(
            e.position,
            this.rotationCenter,
        );
        this.startObjectRadians = target.radians;

        this.previousState = mode.state;
        mode.state = BoardMode.Rotating;
    }

    private enterRotating(): void {
        const mode = this.board.controller.mode;
        const mouse = this.board.controller.mouse;

        this.rotateSubscriptions.push(
            mouse.onMouseUp.listen(undefined, () => {
                if (mode.state === BoardMode.Rotating) {
                    mode.state = this.previousState;
                }
            }),
        );
        this.rotateSubscriptions.push(
            mouse.onMouseMove.listen(undefined, e => {
                this.onResizeMove(e);
            }),
        );

        showRotateCursor();
    }

    private exitRotating(): void {
        unsubscribeAll(this.rotateSubscriptions);
        resetCursor();
    }

    private onResizeMove(e: MouseMoveEvent): void {
        const mode = this.board.controller.mode;

        if (mode.state !== BoardMode.Rotating) {
            return;
        }

        const newCursorRadians = relativeRadians(
            e.position,
            this.rotationCenter,
        );
        let newObjectRadians =
            newCursorRadians -
            this.startCursorRadians +
            this.startObjectRadians;

        if (Binding.RotateStep.modifiers(e)) {
            newObjectRadians =
                Math.round(newObjectRadians / rotateStepSize) * rotateStepSize;
        }

        this.board.controller.select.selectedObjects.forEach(object => {
            this.onRotate.dispatch(
                new RotateObjectEvent(newObjectRadians, [object]),
            );
        });
    }
}

function relativeRadians(cursorPosition: Vector2, center: Vector2): number {
    const v = cursorPosition.minus(center);
    return Math.atan2(v.y, v.x);
}

export function showRotateCursor(): void {
    // TODO: make this an image (disable cursor and render custom object)
    setCursor("alias");
}
