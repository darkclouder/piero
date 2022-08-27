import type { Board } from "canvas/board/Board";
import { canResize } from "canvas/board/controllers/BoardMode";
import { GeometricObject } from "canvas/board/objects/GeometricObject";
import type { ResizeFrame } from "canvas/board/objects/ui/selectable/ResizeFrame";
import { resetCursor, setCursor } from "canvas/primitives/dom";
import type { Subscription } from "canvas/primitives/events";
import { unsubscribeAll } from "canvas/primitives/events";
import { BoundingBox, Vector2 } from "canvas/primitives/space";
import type { Optional } from "canvas/primitives/types";
import type { RenderContext } from "canvas/render/RenderContext";
import type { Viewport } from "canvas/render/Viewport";
import { inverseStrokeColor } from "config/draw";

export enum ResizeHandlePositioning {
    TopLeft,
    TopCenter,
    TopRight,
    MiddleRight,
    BottomRight,
    BottomCenter,
    BottomLeft,
    MiddleLeft,
}

export class ResizeHandleStyle {
    constructor(
        readonly size = 14,
        readonly outlineColor = inverseStrokeColor,
        readonly outlineWidth = 2,
        readonly fillColor = "#1060B0",
        readonly glowColor: Optional<string> = "#75AAEE",
        readonly changeCursor = true,
    ) {}
}

const positioningCursorStyle = {
    [ResizeHandlePositioning.TopLeft]: "nwse-resize",
    [ResizeHandlePositioning.TopCenter]: "ns-resize",
    [ResizeHandlePositioning.TopRight]: "nesw-resize",
    [ResizeHandlePositioning.MiddleRight]: "ew-resize",
    [ResizeHandlePositioning.BottomRight]: "nwse-resize",
    [ResizeHandlePositioning.BottomCenter]: "ns-resize",
    [ResizeHandlePositioning.BottomLeft]: "nesw-resize",
    [ResizeHandlePositioning.MiddleLeft]: "ew-resize",
};

export class ResizeHandle extends GeometricObject {
    private resizingSubscriptions: Subscription[] = [];

    constructor(
        readonly frame: ResizeFrame,
        readonly positioning: ResizeHandlePositioning,
        readonly style: ResizeHandleStyle = new ResizeHandleStyle(),
    ) {
        super();
    }

    public boundingBox(viewport: Viewport): BoundingBox {
        const size = new Vector2(this.style.size, this.style.size);
        const centerOffset = this.style.size / 2;
        const position = this.relativePosition(viewport).minus(
            new Vector2(centerOffset, centerOffset),
        );

        return new BoundingBox(position, size);
    }

    public draw(renderCtx: RenderContext): void {
        const size = this.style.size;
        const centerPosition = this.relativePosition(renderCtx.viewport);
        // Outline width is centered on circle outline, so only half or
        // the outline is an additional width, means an additional width of
        // 2 * 1/2 * outlineWidth = outlineWidth
        const innerSize = size - this.style.outlineWidth;

        // Shadow
        renderCtx.ctx.shadowColor = this.style.fillColor;
        renderCtx.ctx.shadowBlur = this.style.size / 8;

        // Circle
        renderCtx.ctx.beginPath();
        renderCtx.ctx.arc(
            centerPosition.x,
            centerPosition.y,
            innerSize / 2,
            0,
            2 * Math.PI,
        );

        // Fill
        if (this.style.glowColor !== undefined) {
            const gradient = renderCtx.ctx.createRadialGradient(
                centerPosition.x - innerSize / 8,
                centerPosition.y - innerSize / 4,
                0,
                centerPosition.x,
                centerPosition.y,
                size + 1,
            );

            gradient.addColorStop(0, this.style.glowColor);
            gradient.addColorStop(1, this.style.fillColor);

            renderCtx.ctx.fillStyle = gradient;
        } else {
            renderCtx.ctx.fillStyle = this.style.fillColor;
        }
        renderCtx.ctx.fill();

        // Outline
        renderCtx.ctx.strokeStyle = this.style.outlineColor;
        renderCtx.ctx.lineWidth = this.style.outlineWidth;
        renderCtx.ctx.stroke();
    }

    public onSpawn(board: Board): void {
        super.onSpawn(board);

        const mouse = board.controller.mouse;

        this.subscriptions.push(
            mouse.onMouseDown.listen(this, e => {
                this.board.controller.resize.startResizing(e);
            }),
        );

        if (this.style.changeCursor) {
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
    }

    public onDespawn(board: Board): void {
        unsubscribeAll(this.resizingSubscriptions);
        super.onDespawn(board);
    }

    public showResizingCursor(): void {
        showResizingCursor(this.positioning);
    }

    private onMouseOver(): void {
        if (canResize(this.board.controller.mode.state)) {
            this.showResizingCursor();
        }
    }

    private onMouseOut(): void {
        if (canResize(this.board.controller.mode.state)) {
            resetCursor();
        }
    }

    private relativePosition(viewport: Viewport): Vector2 {
        const contentBox = this.frame.overlay.selectionFrame.boundingBox(
            viewport,
        );

        switch (this.positioning) {
            case ResizeHandlePositioning.TopLeft:
                return new Vector2(
                    contentBox.position.x,
                    contentBox.position.y,
                );
            case ResizeHandlePositioning.TopCenter:
                return new Vector2(
                    contentBox.position.x + contentBox.size.x / 2,
                    contentBox.position.y,
                );
            case ResizeHandlePositioning.TopRight:
                return new Vector2(
                    contentBox.position.x + contentBox.size.x,
                    contentBox.position.y,
                );
            case ResizeHandlePositioning.MiddleRight:
                return new Vector2(
                    contentBox.position.x + contentBox.size.x,
                    contentBox.position.y + contentBox.size.y / 2,
                );
            case ResizeHandlePositioning.BottomRight:
                return new Vector2(
                    contentBox.position.x + contentBox.size.x,
                    contentBox.position.y + contentBox.size.y,
                );
            case ResizeHandlePositioning.BottomCenter:
                return new Vector2(
                    contentBox.position.x + contentBox.size.x / 2,
                    contentBox.position.y + contentBox.size.y,
                );
            case ResizeHandlePositioning.BottomLeft:
                return new Vector2(
                    contentBox.position.x,
                    contentBox.position.y + contentBox.size.y,
                );
            case ResizeHandlePositioning.MiddleLeft:
                return new Vector2(
                    contentBox.position.x,
                    contentBox.position.y + contentBox.size.y / 2,
                );
        }
    }
}

function showResizingCursor(positioning: ResizeHandlePositioning): void {
    setCursor(positioningCursorStyle[positioning]);
}
