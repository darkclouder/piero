import type { Board } from "canvas/board/Board";
import type { Font } from "canvas/board/controllers/board/FontController";
import { Vector2 } from "canvas/primitives/space";
import type { Optional } from "canvas/primitives/types";
import type { RenderContext } from "canvas/render/RenderContext";
import type { Viewport } from "canvas/render/Viewport";

import type { GeometricObject } from "../GeometricObject";
import { BlockText } from "./BlockText";
import { BoardItem } from "./BoardItem";

export class StickyNote extends BoardItem {
    readonly isStickyNote = true;
    readonly blockText: BlockText;

    constructor(
        text: string,
        textColor: string,
        private bgColor: string,
        fontSize: number,
        font: Font,
        position: Vector2,
        size: Vector2,
        radians = 0,
        isFixed = false,
        private padding = 10,
    ) {
        super(position, size, radians, isFixed);

        this.blockText = new BlockText(
            text,
            textColor,
            fontSize,
            font,
            this.getBlockTextPosition(position),
            this.getBlockTextSize(size),
            radians,
            isFixed,
        );
    }

    public get position(): Vector2 {
        return super.position;
    }

    public set position(position: Vector2) {
        super.position = position;
        this.blockText.position = this.getBlockTextPosition(position);
        this.blockText.markDirty();
    }

    public get size(): Vector2 {
        return super.size;
    }

    public set size(size: Vector2) {
        const bound = 2 * this.padding;
        const boundSize = new Vector2(
            size.x <= bound ? bound : size.x,
            size.y <= bound ? bound : size.y,
        );

        super.size = boundSize;
        this.blockText.size = this.getBlockTextSize(boundSize);
        this.blockText.markDirty();
    }

    public draw(renderCtx: RenderContext): void {
        // Make sure sticky note is not smaller than contained text
        this.blockText.updateForRender(renderCtx);

        const blockTextSize = this.blockText.size;
        this._size = new Vector2(
            Math.max(this._size.x, blockTextSize.x + 2 * this.padding),
            Math.max(this._size.y, blockTextSize.y + 2 * this.padding),
        );

        // Draw background
        const viewport = renderCtx.viewport;
        const position = this.positionInViewport(viewport);
        const size = this.sizeInViewport(viewport);

        renderCtx.ctx.fillStyle = this.bgColor;
        renderCtx.ctx.fillRect(position.x, position.y, size.x, size.y);

        // Draw text
        this.blockText.draw(renderCtx);
    }

    public onSpawn(board: Board): void {
        super.onSpawn(board);
        this.blockText.onSpawn(board);
        this.subscriptions.push(
            this.board.onDirty.listen(this.blockText, () => {
                this.board.markDirtyObject(this);
            }),
        );
    }

    public onDespawn(board: Board): void {
        this.blockText.onDespawn(board);
        super.onDespawn(board);
    }

    public castRay(
        position: Vector2,
        viewport: Viewport,
    ): Optional<GeometricObject[]> {
        const stack = super.castRay(position, viewport);

        if (stack !== undefined) {
            stack.unshift(this.blockText);
        }

        return stack;
    }

    private getBlockTextPosition(position: Vector2): Vector2 {
        return position.plus(new Vector2(this.padding, this.padding));
    }

    private getBlockTextSize(size: Vector2): Vector2 {
        return size.minus(new Vector2(2 * this.padding, 2 * this.padding));
    }
}
