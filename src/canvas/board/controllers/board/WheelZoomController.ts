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
import { ModifierState } from "canvas/utils/input/ModifierState";
import { getWheelBoost } from "canvas/utils/input/Wheel";
import { Binding } from "config/bindings";

export class WheelZoomEvent extends EventBase<Board> {
    constructor(
        readonly cursorPosition: Vector2,
        readonly zoomDelta: number,
        eventStack?: Board[],
    ) {
        super(eventStack);
    }
}

export class WheelZoomController {
    readonly onWheelZoom = new EventHandler<WheelZoomEvent>();

    private subscriptions: Subscription[] = [];

    constructor(private board: Board) {}

    public activate(): void {
        // Firefox, Chrome, (Safari)
        this.subscriptions.push(
            createDomEventListener(
                this.board.boardElement,
                "wheel",
                (e: WheelEvent) => {
                    this.onWheel(e);
                },
            ),
        );
    }

    public deactivate(): void {
        unsubscribeAll(this.subscriptions);
    }

    private onWheel(e: WheelEvent) {
        const modifiersHolder = { modifiers: ModifierState.fromDomEvent(e) };

        if (Binding.WheelZoom.modifiers(modifiersHolder)) {
            e.stopPropagation();
            e.preventDefault();

            const delta = e.deltaY * getWheelBoost(e);

            // Logistic function between -1 and 1
            // and then 2^Logistic to map it between 0.5 and 2.0
            const relativeZoom = Math.pow(
                2.0,
                2.0 / (1.0 + Math.pow(Math.E, 0.05 * delta)) - 1.0,
            );

            const event = new WheelZoomEvent(
                mousePositionToElement(e, this.board.boardElement),
                relativeZoom,
                [this.board],
            );

            this.onWheelZoom.dispatch(event);
        }
    }
}
