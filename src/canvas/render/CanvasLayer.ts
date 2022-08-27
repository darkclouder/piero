import type { BoundingBoxHolder } from "canvas/board/objects/GeometricObject";
import type { BoundingBox } from "canvas/primitives/space";
import type { RenderObject } from "canvas/render/RenderObject";
import { DebugConfig } from "config/debug";

import { RenderContext } from "./RenderContext";
import type { Viewport } from "./Viewport";

export class CanvasLayer {
    private objects: RenderObject[] = [];

    private lastViewport: Viewport;

    constructor(
        private ctx: CanvasRenderingContext2D,
        readonly dpr: number = 1,
    ) {}

    public render(timestamp: number, viewport: Viewport): void {
        // Check if canvas size changed
        if (viewport.size != this.lastViewport?.size) {
            this.rescale(viewport);
        }

        this.lastViewport = viewport;

        // Clear before redraw
        this.clear(viewport);

        // Create render context for objects
        const renderCtx = new RenderContext(
            viewport,
            this.ctx,
            timestamp,
            this.dpr,
        );

        // Redraw all objects
        for (const object of this.objects) {
            this.ctx.save();
            object.draw(renderCtx);
            this.ctx.restore();

            if (DebugConfig.tintBoundingBoxes) {
                tintBoundingBox(object, renderCtx);
            }
        }
    }

    public get needsRendering(): boolean {
        return this.objects.some(o => o.needsRedraw);
    }

    public updateObjects(objects: RenderObject[]): void {
        this.objects = objects;
    }

    private clear(viewport: Viewport): void {
        // TODO: What happens with elements outside of viewport?
        // Clear viewport
        this.ctx.clearRect(0, 0, viewport.size.x, viewport.size.y);
    }

    private rescale(viewport: Viewport): void {
        const scaledSize = viewport.size.scale(this.dpr);
        const canvas = this.ctx.canvas;

        canvas.width = scaledSize.x;
        canvas.height = scaledSize.y;
        canvas.style.width = `${viewport.size.x}px`;
        canvas.style.height = `${viewport.size.y}px`;
        this.ctx.scale(this.dpr, this.dpr);
    }
}

export function tintBoundingBox(
    object: RenderObject,
    renderCtx: RenderContext,
    boundingBox?: BoundingBox,
): void {
    if (boundingBox === undefined && "boundingBox" in object) {
        boundingBox = (<BoundingBoxHolder>(<unknown>object)).boundingBox(
            renderCtx.viewport,
        );
    }

    if (boundingBox === undefined) {
        return;
    }

    const hash =
        object.constructor.name
            .split("")
            .map(c => c.charCodeAt(0))
            .reduce((acc, val) => (acc + acc) ^ val, 0) % 360;

    renderCtx.ctx.save();
    renderCtx.ctx.fillStyle = `hsl(${hash},100%,50%)`;
    renderCtx.ctx.lineWidth = 1;
    renderCtx.ctx.globalAlpha = 0.1;

    const bb = boundingBox.stretch(1, 1, 1, 1);
    renderCtx.ctx.fillRect(bb.position.x, bb.position.y, bb.size.x, bb.size.y);
    renderCtx.ctx.restore();
}
