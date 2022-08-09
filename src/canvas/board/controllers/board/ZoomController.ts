import type { Board } from "@canvas/board/Board";
import { canZoom } from "@canvas/board/controllers/BoardMode";
import { mousePositionToElement } from "@canvas/primitives/dom";
import type { Subscription } from "@canvas/primitives/events";
import {
    createDomEventListener,
    unsubscribeAll,
} from "@canvas/primitives/events";
import type { Vector2 } from "@canvas/primitives/space";
import type { Optional } from "@canvas/primitives/types";
import type { Viewport } from "@canvas/render/Viewport";
import { Binding } from "@config/bindings";

import type { PinchZoomEvent } from "./PinchZoomController";
import { PinchZoomController } from "./PinchZoomController";
import type { WheelZoomEvent } from "./WheelZoomController";
import { WheelZoomController } from "./WheelZoomController";

export class ZoomController {
    private subscriptions: Subscription[] = [];

    private wheelZoomCtrl: WheelZoomController;
    private pinchZoomCtrl: PinchZoomController;

    private lastCursorPosition: Optional<Vector2>;
    private initialZoom = 1.0;

    constructor(
        private board: Board,
        readonly minZoom: number = 0.1,
        readonly maxZoom: number = 20.0,
    ) {
        this.wheelZoomCtrl = new WheelZoomController(this.board);
        this.pinchZoomCtrl = new PinchZoomController(this.board);
    }

    public activate(): void {
        this.wheelZoomCtrl.activate();
        this.pinchZoomCtrl.activate();

        this.subscriptions.push(
            this.wheelZoomCtrl.onWheelZoom.listen(this.board, e => {
                this.onWheelZoom(e);
            }),
        );
        this.subscriptions.push(
            this.pinchZoomCtrl.onPinchStart.listen(this.board, () => {
                this.onPinchStart();
            }),
        );
        this.subscriptions.push(
            this.pinchZoomCtrl.onPinchZoom.listen(this.board, e => {
                this.onPinchZoom(e);
            }),
        );
        this.subscriptions.push(
            createDomEventListener(this.board.window, "keydown", e => {
                this.onKeyDown(e);
            }),
        );
        this.subscriptions.push(
            createDomEventListener(this.board.boardElement, "mousemove", e => {
                this.onMouseMove(e);
            }),
        );
    }

    public deactivate(): void {
        unsubscribeAll(this.subscriptions);

        this.wheelZoomCtrl.deactivate();
        this.pinchZoomCtrl.deactivate();
    }

    public setZoom(zoomLevel: number, focus?: Vector2): void {
        const oldViewport = this.board.viewport;

        if (focus === undefined) {
            // Focus in center
            focus = oldViewport.size.scale(0.5);
        }

        const newZoomLevel = minMax(zoomLevel, this.minZoom, this.maxZoom);

        if (newZoomLevel !== oldViewport.zoomLevel) {
            this.board.viewport = oldViewport.modified(
                undefined,
                newZoomLevel,
                this.computeViewportOrigin(focus, oldViewport, newZoomLevel),
            );
        }
    }

    private onMouseMove(e: MouseEvent): void {
        this.lastCursorPosition = mousePositionToElement(
            e,
            this.board.boardElement,
        );
    }

    private onKeyDown(e: KeyboardEvent): void {
        if (Binding.ResetZoom.keyboard(e)) {
            e.preventDefault();
            this.setZoom(1.0, this.lastCursorPosition);
        } else if (Binding.ZoomIn.keyboard(e)) {
            e.preventDefault();
            this.setZoom(
                this.board.viewport.zoomLevel * 1.2,
                this.lastCursorPosition,
            );
        } else if (Binding.ZoomOut.keyboard(e)) {
            e.preventDefault();
            this.setZoom(
                this.board.viewport.zoomLevel / 1.2,
                this.lastCursorPosition,
            );
        }
    }

    private onPinchStart(): void {
        this.initialZoom = this.board.viewport.zoomLevel;
    }

    private onPinchZoom(e: PinchZoomEvent): void {
        if (!canZoom(this.board.controller.mode.state)) {
            return;
        }

        this.setZoom(this.initialZoom * e.scale * e.scale, e.cursorPosition);
    }

    private onWheelZoom(e: WheelZoomEvent): void {
        if (!canZoom(this.board.controller.mode.state)) {
            return;
        }

        const oldViewport = this.board.viewport;

        this.setZoom(oldViewport.zoomLevel * e.zoomDelta, e.cursorPosition);
    }

    private computeViewportOrigin(
        cursorPos: Vector2,
        oldViewport: Viewport,
        newZoomLevel: number,
    ): Vector2 {
        const cursorPosWorldSpace = oldViewport.origin.plus(
            cursorPos.scale(1.0 / oldViewport.zoomLevel),
        );
        const cursorOffsetNewZoomLevel = cursorPos.scale(1.0 / newZoomLevel);

        return cursorPosWorldSpace.minus(cursorOffsetNewZoomLevel);
    }
}

function minMax(value: number, min: number, max: number): number {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}
