import type { Board } from "canvas/board/Board";
import type { GeometricObject } from "canvas/board/objects/GeometricObject";
import { mousePositionToElement } from "canvas/primitives/dom";
import type { Subscription } from "canvas/primitives/events";
import {
    createDomEventListener,
    EventBase,
    EventHandler,
    getTargetOfEventStack,
    unsubscribeAll,
} from "canvas/primitives/events";
import type { Vector2 } from "canvas/primitives/space";
import type { Optional } from "canvas/primitives/types";
import { ModifierState } from "canvas/utils/input/ModifierState";
import { MouseButton } from "canvas/utils/input/MouseButton";

export class MouseEventBase extends EventBase<GeometricObject> {
    constructor(
        readonly position: Vector2,
        readonly modifiers: ModifierState,
        readonly eventStack?: GeometricObject[],
    ) {
        super(eventStack);
    }
}

export class MousePressEventBase extends MouseEventBase {
    constructor(
        position: Vector2,
        modifiers: ModifierState,
        readonly button: MouseButton,
        readonly clicks: number,
        readonly eventStack?: GeometricObject[],
    ) {
        super(position, modifiers, eventStack);
    }
}

export class MouseDownEvent extends MousePressEventBase {}
export class MouseUpEvent extends MousePressEventBase {}
export class MouseClickEvent extends MousePressEventBase {}
export class MouseMoveEvent extends MouseEventBase {}
export class MouseOverEvent extends MouseEventBase {}
export class MouseOutEvent extends MouseEventBase {}

export class MouseInteractionController {
    readonly onMouseClick = new EventHandler<MouseClickEvent>();
    readonly onMouseDown = new EventHandler<MouseDownEvent>();
    readonly onMouseUp = new EventHandler<MouseUpEvent>();
    readonly onMouseMove = new EventHandler<MouseMoveEvent>();
    readonly onMouseOver = new EventHandler<MouseOverEvent>();
    readonly onMouseOut = new EventHandler<MouseOutEvent>();

    private subscriptions: Subscription[] = [];
    private pendingMouseClickEvent: Optional<MouseClickEvent>;
    private pendingMouseOverStack: Optional<GeometricObject[]>;

    constructor(private board: Board) {}

    public activate(): void {
        this.subscriptions.push(
            createDomEventListener(this.board.boardElement, "mousedown", e => {
                this.onBoardMouseDown(e);
            }),
        );
        this.subscriptions.push(
            createDomEventListener(this.board.boardElement, "mouseup", e => {
                this.onBoardMouseUp(e);
            }),
        );
        this.subscriptions.push(
            createDomEventListener(this.board.boardElement, "mousemove", e => {
                this.onBoardMouseMove(e);
            }),
        );
    }

    public deactivate(): void {
        unsubscribeAll(this.subscriptions);
    }

    private onBoardMouseDown(e: MouseEvent): void {
        e.preventDefault();
        e.stopPropagation();

        const modifierState = ModifierState.fromDomEvent(e);
        const mousePosition = mousePositionToElement(
            e,
            this.board.boardElement,
        );
        const rayCastStack = this.getRayCastStack(mousePosition);

        this.pendingMouseClickEvent = new MouseClickEvent(
            mousePosition,
            modifierState,
            e.buttons,
            e.detail,
            rayCastStack,
        );

        const event = new MouseDownEvent(
            mousePosition,
            modifierState,
            e.buttons,
            e.detail,
            rayCastStack,
        );

        this.onMouseDown.dispatch(event);

        if (event.defaultPrevented) {
            this.pendingMouseClickEvent = undefined;
        }
    }

    private onBoardMouseUp(e: MouseEvent): void {
        if (e.buttons == MouseButton.None) {
            e.preventDefault();

            const modifierState = ModifierState.fromDomEvent(e);
            const mousePosition = mousePositionToElement(
                e,
                this.board.boardElement,
            );
            const rayCastStack = this.getRayCastStack(mousePosition);

            const event = new MouseUpEvent(
                mousePosition,
                modifierState,
                e.buttons,
                e.detail,
                rayCastStack,
            );

            this.onMouseUp.dispatch(event);

            if (event.defaultPrevented) {
                this.pendingMouseClickEvent = undefined;
            }

            if (this.pendingMouseClickEvent !== undefined) {
                const pendingTarget = getTargetOfEventStack(
                    this.pendingMouseClickEvent.eventStack,
                );

                if (pendingTarget === getTargetOfEventStack(rayCastStack)) {
                    this.onMouseClick.dispatch(this.pendingMouseClickEvent);
                }
            }
        }

        this.pendingMouseClickEvent = undefined;
    }

    private onBoardMouseMove(e: MouseEvent): void {
        const modifierState = ModifierState.fromDomEvent(e);
        const mousePosition = mousePositionToElement(
            e,
            this.board.boardElement,
        );
        const rayCastStack = this.getRayCastStack(mousePosition);
        const target = getTargetOfEventStack(rayCastStack);

        this.onMouseMove.dispatch(
            new MouseMoveEvent(mousePosition, modifierState, rayCastStack),
        );

        const pendingTarget =
            this.pendingMouseOverStack === undefined
                ? undefined
                : getTargetOfEventStack(this.pendingMouseOverStack);

        if (target !== pendingTarget) {
            if (pendingTarget !== undefined) {
                this.onMouseOut.dispatch(
                    new MouseOutEvent(
                        mousePosition,
                        modifierState,
                        this.pendingMouseOverStack,
                    ),
                );
            }

            if (target !== undefined) {
                this.onMouseOver.dispatch(
                    new MouseOverEvent(
                        mousePosition,
                        modifierState,
                        rayCastStack,
                    ),
                );
            }
        }

        this.pendingMouseOverStack = rayCastStack;
    }

    private getRayCastStack(position: Vector2): Optional<GeometricObject[]> {
        const viewport = this.board.viewport;

        for (const object of this.board.objects.reversed()) {
            const stack = object.castRay(position, viewport);

            if (stack !== undefined) {
                return stack;
            }
        }

        return undefined;
    }
}
