import type { Board } from "@canvas/board/Board";
import { canPan } from "@canvas/board/controllers/BoardMode";
import type { Subscription } from "@canvas/primitives/events";
import {
    createDomEventListener,
    unsubscribeAll,
} from "@canvas/primitives/events";
import { Vector2 } from "@canvas/primitives/space";
import { ModifierState } from "@canvas/utils/input/ModifierState";
import { getWheelBoost } from "@canvas/utils/input/Wheel";
import { Binding } from "@config/bindings";

export class PanController {
    private subscriptions: Subscription[] = [];

    constructor(private board: Board) {}

    public activate(): void {
        this.subscriptions.push(
            createDomEventListener(this.board.boardElement, "wheel", e => {
                this.onWheel(e);
            }),
        );
    }

    public deactivate(): void {
        unsubscribeAll(this.subscriptions);
    }

    private onWheel(e: WheelEvent): void {
        if (!canPan(this.board.controller.mode.state)) {
            return;
        }

        const modifiersHolder = { modifiers: ModifierState.fromDomEvent(e) };

        const inverse = Binding.WheelPanInverse.modifiers(modifiersHolder);

        if (Binding.WheelPan.modifiers(modifiersHolder) || inverse) {
            e.preventDefault();
            e.stopPropagation();

            let delta = new Vector2(e.deltaX, e.deltaY);

            delta = delta.scale(getWheelBoost(e));

            if (inverse) {
                delta = delta.rotate(-0.5 * Math.PI);
            }

            const oldViewport = this.board.viewport;

            this.board.viewport = oldViewport.modified(
                undefined,
                undefined,
                oldViewport.origin.plus(
                    delta.scale(1.0 / oldViewport.zoomLevel),
                ),
            );
        }
    }
}
