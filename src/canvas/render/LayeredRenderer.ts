import type { RenderObject } from "@canvas/render/RenderObject";
import { ZBuffer } from "@canvas/render/ZBuffer";

import { CanvasLayer } from "./CanvasLayer";
import type { ViewportHolder } from "./Viewport";

export class LayeredRenderer {
    readonly dpr: number;

    private buffer: ZBuffer<RenderObject> = new ZBuffer();

    private canvasLayers: CanvasLayer[] = [];
    private isRendering = false;
    private renderingRequested = false;
    private forceFullRendering = false;

    constructor(
        private window: Window,
        private targetElement: HTMLElement,
        private contextHolder: ViewportHolder,
    ) {
        this.dpr = window.devicePixelRatio || 1;
        this.addCanvasLayer();
    }

    public requestFullRender(): void {
        this.forceFullRendering = true;

        if (!this.renderingRequested) {
            this.requestAnimationFrame();
        }
    }

    public addObjects(objects: RenderObject[], z?: number): void {
        this.buffer.addMany(objects, z);
        this.updateCanvasLayers();
        this.markDirtyObjects(objects);
    }

    public addObjectsAbove(
        objects: RenderObject[],
        lastBelow: RenderObject,
    ): void {
        this.addObjects(objects, this.buffer.getIndex(lastBelow) + 1);
    }

    public addObjectsBelow(
        objects: RenderObject[],
        firstOnTop: RenderObject,
    ): void {
        this.addObjects(objects, this.buffer.getIndex(firstOnTop));
    }

    public removeObjects(objects: RenderObject[]): void {
        this.buffer.removeMany(objects);
        this.updateCanvasLayers();
        this.markDirtyObjects(objects);
    }

    public moveObjectsTo(objects: RenderObject[], z?: number): void {
        this.buffer.moveManyTo(objects, z);
        this.updateCanvasLayers();
        this.markDirtyObjects(objects);
    }

    /**
     * Move objects (while maintaining their relative ordering to each other)
     * on top of another existing object.
     */
    public moveObjectsAbove(
        objects: RenderObject[],
        lastBelow: RenderObject,
    ): void {
        this.moveObjectsTo(objects, this.buffer.getIndex(lastBelow) + 1);
    }

    public moveObjectsBelow(
        objects: RenderObject[],
        firstOnTop: RenderObject,
    ): void {
        this.moveObjectsTo(objects, this.buffer.getIndex(firstOnTop));
    }

    public reorderManyAbove(
        sortedObjects: RenderObject[],
        lastBelow: RenderObject,
    ): void {
        this.buffer.reorderManyTo(
            sortedObjects,
            this.buffer.getIndex(lastBelow) + 1,
        );
        this.updateCanvasLayers();
        this.markDirtyObjects(sortedObjects);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public markDirtyObjects(objects: RenderObject[]): void {
        // Ignore objects for now, dirty objects cause a complete redraw.
        // TODO: In future implementations, only specific layers or regions
        // could be redrawn.

        this.requestFullRender();
    }

    public get objects(): RenderObject[] {
        return this.buffer.sorted();
    }

    private requestAnimationFrame(): void {
        if (!this.renderingRequested) {
            this.renderingRequested = true;

            this.window.requestAnimationFrame((timestamp: number) => {
                this.renderingRequested = false;
                this.render(timestamp);
            });
        }
    }

    private render(timestamp: number): void {
        if (this.isRendering) {
            console.error("Rendering invoked during rendering.");
        }

        /* *** Start of rendering *** */
        this.isRendering = true;

        for (const layer of this.canvasLayers) {
            if (this.forceFullRendering || layer.needsRendering) {
                layer.render(timestamp, this.contextHolder.viewport);
            }
        }

        // Reset force full rendering
        this.forceFullRendering = false;

        this.isRendering = false;
        /* *** End of rendering *** */

        // Request next animation frame if a layer needs re-rendering
        if (this.canvasLayers.some(l => l.needsRendering)) {
            this.requestAnimationFrame();
        }
    }

    private addCanvasLayer() {
        const canvasElement = document.createElement("canvas");
        this.targetElement.appendChild(canvasElement);

        const ctx = canvasElement.getContext("2d");
        this.canvasLayers.push(new CanvasLayer(ctx, this.dpr));
    }

    private updateCanvasLayers() {
        this.canvasLayers[0].updateObjects(this.objects);
    }
}
