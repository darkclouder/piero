import type { Viewport } from "./Viewport";

export class RenderContext {
    constructor(
        readonly viewport: Viewport,
        readonly ctx: CanvasRenderingContext2D,
        readonly timestamp: number,
        readonly dpr: number,
    ) {}
}
