import type { Board } from "@canvas/board/Board";
import { BoardMode, canMove } from "@canvas/board/controllers/BoardMode";
import type {
    MouseDownEvent,
    MouseMoveEvent,
    MouseUpEvent,
} from "@canvas/board/controllers/objects/MouseInteractionController";
import { containingBoundingBox } from "@canvas/board/objects/foundation/Group";
import { rotateBoundingBox } from "@canvas/board/objects/foundation/RotateContainer";
import type { GeometricObject } from "@canvas/board/objects/GeometricObject";
import { getTopSelectableOnEventStack } from "@canvas/board/objects/ui/selectable/Selectable";
import { resetCursor, setCursor } from "@canvas/primitives/dom";
import type { Subscription } from "@canvas/primitives/events";
import {
    EventBase,
    EventHandler,
    unsubscribeAll,
} from "@canvas/primitives/events";
import type { BoundingBox } from "@canvas/primitives/space";
import { Vector2 } from "@canvas/primitives/space";
import type { Optional } from "@canvas/primitives/types";
import { Viewport } from "@canvas/render/Viewport";
import { Binding } from "@config/bindings";
import { canMoveCursor, moveCursor } from "@config/draw";
import { moveThreshold } from "@config/interaction";

export class MoveObjectEvent extends EventBase<GeometricObject> {
    constructor(
        readonly positionDelta: Vector2,
        eventStack?: GeometricObject[],
    ) {
        super(eventStack);
    }
}

export class MoveObjectController {
    readonly onMove = new EventHandler<MoveObjectEvent>();

    private subscriptions: Subscription[] = [];

    // For moving state
    private isMouseDown = false;
    private previousState: BoardMode;
    private lastPosition: Optional<Vector2>;
    private moveTarget: Optional<GeometricObject>;
    private moveSubscriptions: Subscription[] = [];

    constructor(private board: Board) {}

    public activate(): void {
        const mouse = this.board.controller.mouse;

        this.subscriptions.push(
            mouse.onMouseDown.listen(undefined, e => {
                this.onMouseDown(e);
            }),
        );
        this.subscriptions.push(
            mouse.onMouseUp.listen(undefined, e => {
                this.onMouseUp(e);
            }),
        );

        const mode = this.board.controller.mode;

        this.subscriptions.push(
            mode.onEnter.listen(BoardMode.Moving, () => {
                showMoveCursor();
            }),
        );
        this.subscriptions.push(
            mode.onExit.listen(BoardMode.Moving, () => {
                resetCursor();
            }),
        );
    }

    public deactivate(): void {
        unsubscribeAll(this.subscriptions);
    }

    private onMouseDown(e: MouseDownEvent): void {
        if (!canMove(this.board.controller.mode.state)) {
            return;
        }

        if (!Binding.Move.mousePress(e)) {
            return;
        }

        const selectable = getTopSelectableOnEventStack(e.eventStack);

        if (selectable === undefined) {
            return;
        }

        const select = this.board.controller.select;

        if (
            select.selectedObjects.has(selectable.content) &&
            selectable.options.canMove
        ) {
            this.isMouseDown = true;
            this.moveTarget = e.target;
            this.lastPosition = e.position;

            this.moveSubscriptions.push(
                this.board.controller.mouse.onMouseMove.listen(undefined, e => {
                    this.onMouseMove(e);
                }),
            );
        }
    }

    private onMouseUp(e: MouseUpEvent): void {
        if (!this.isMouseDown) {
            return;
        }

        this.isMouseDown = false;

        if (this.board.controller.mode.state === BoardMode.Moving) {
            // Prevent click on release when multiple objects are moved
            // Otherwise, the object on cursor focus during movement
            // would be solely selected.
            e.stopPropagation();
            e.preventDefault();

            this.board.controller.mode.state = this.previousState;
            this.board.controller.guideline.clear();
        }

        if (e.eventStack && e.eventStack.indexOf(this.moveTarget) >= 0) {
            // Mouse up inside element
            showCanMoveCursor();
        }

        unsubscribeAll(this.moveSubscriptions);
    }

    private onMouseMove(e: MouseMoveEvent): void {
        if (!this.isMouseDown) {
            return;
        }

        const rawPosition = e.position;
        const rawDelta = rawPosition.minus(this.lastPosition);

        const mode = this.board.controller.mode;

        if (canMove(mode.state) && rawDelta.euclideanNorm >= moveThreshold) {
            this.previousState = mode.state;
            mode.state = BoardMode.Moving;
        }

        if (mode.state === BoardMode.Moving) {
            const toggleSnap = Binding.ToggleGuidelineSnap.modifiers(e);
            const snapGuideline =
                this.board.config.enableGuidelineSnap !== toggleSnap;

            let positionDelta: Vector2;

            if (snapGuideline) {
                const snapDelta = this.updateGuidelines(rawDelta);
                positionDelta = snapDelta || rawDelta;
            } else {
                this.board.controller.guideline.clear();
                positionDelta = rawDelta;
            }

            this.lastPosition = this.lastPosition.plus(positionDelta);

            const select = this.board.controller.select;
            const movableObjects = [...select.selectedObjects].filter(
                object => select.getOptions(object).canMove,
            );

            movableObjects.forEach(object => {
                this.onMove.dispatch(
                    new MoveObjectEvent(positionDelta, [object]),
                );
            });
        }
    }

    private updateGuidelines(rawDelta: Vector2): Optional<Vector2> {
        const viewport = this.board.viewport;

        const selection = this.board.controller.select.selectedObjects;
        const guideline = this.board.controller.guideline;

        const worldDelta = viewport.toWorldSize(rawDelta);

        const bb: BoundingBox = containingBoundingBox(
            [...selection].map(boardItem =>
                rotateBoundingBox(
                    boardItem.boundingBox(Viewport.world),
                    boardItem.radians,
                ),
            ),
        );

        const boundaries = [
            bb.position,
            bb.position.plus(bb.size),
            bb.position.plus(bb.size.scale(0.5)),
        ];

        guideline.clear();

        const delta = new Vector2(
            this.getSnapDelta(boundaries, true, worldDelta),
            this.getSnapDelta(boundaries, false, worldDelta),
        );

        return viewport.toViewportSize(delta);
    }

    private getSnapDelta(
        boundaries: Vector2[],
        vertical: boolean,
        worldDelta: Vector2,
    ): number {
        const guidelineCtrl = this.board.controller.guideline;

        for (const position of boundaries) {
            const newPosition = position.plus(worldDelta);
            const guide = guidelineCtrl.getSnapGuide(newPosition, vertical);

            if (guide !== undefined) {
                guidelineCtrl.showGuides([guide]);

                const pos = vertical ? position.x : position.y;

                return guide.value - pos;
            }
        }

        return vertical ? worldDelta.x : worldDelta.y;
    }
}

export function showMoveCursor(): void {
    setCursor(moveCursor);
}

export function showCanMoveCursor(): void {
    setCursor(canMoveCursor);
}
