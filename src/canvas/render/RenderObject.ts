import type { RenderContext } from "./RenderContext";

export interface RenderObject {
    needsRedraw: boolean;
    draw(renderCtx: RenderContext): void;
}
