import type { Board } from "canvas/board/Board";
import { mousePositionToElement } from "canvas/primitives/dom";
import type { Subscription } from "canvas/primitives/events";
import {
    createDomEventListener,
    EventBase,
    EventHandler,
    unsubscribeAll,
} from "canvas/primitives/events";
import type { Vector2 } from "canvas/primitives/space";

interface GestureEvent extends UIEvent {
    scale: number;
    clientX: number;
    clientY: number;
}

export class PinchStartEvent extends EventBase<Board> {}

export class PinchZoomEvent extends EventBase<Board> {
    constructor(
        readonly cursorPosition: Vector2,
        readonly scale: number,
        eventStack?: Board[],
    ) {
        super(eventStack);
    }
}

export class PinchZoomController {
    readonly onPinchStart = new EventHandler<PinchStartEvent>();
    readonly onPinchZoom = new EventHandler<PinchZoomEvent>();

    private subscriptions: Subscription[] = [];

    constructor(private board: Board) {}

    public activate(): void {
        // Safari
        this.subscriptions.push(
            createDomEventListener(
                this.board.boardElement,
                "gesturestart",
                (e: GestureEvent) => {
                    this.onGestureStart(e);
                },
            ),
        );
        this.subscriptions.push(
            createDomEventListener(
                this.board.boardElement,
                "gesturechange",
                (e: GestureEvent) => {
                    this.onGestureChange(e);
                },
            ),
        );
    }

    public deactivate(): void {
        unsubscribeAll(this.subscriptions);
    }

    private onGestureStart(e: GestureEvent): void {
        e.preventDefault();

        this.onPinchStart.dispatch(new PinchStartEvent([this.board]));
    }

    private onGestureChange(e: GestureEvent): void {
        e.stopPropagation();
        e.preventDefault();

        const event = new PinchZoomEvent(
            mousePositionToElement(e, this.board.boardElement),
            e.scale,
            [this.board],
        );

        this.onPinchZoom.dispatch(event);
    }
}
