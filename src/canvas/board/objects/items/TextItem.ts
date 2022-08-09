import type { Board } from "@canvas/board/Board";
import type { Font } from "@canvas/board/controllers/board/FontController";
import { getFontIdentifier } from "@canvas/board/controllers/board/FontController";
import { BoardMode } from "@canvas/board/controllers/BoardMode";
import { BoardItem } from "@canvas/board/objects/items/BoardItem";
import { resetCursor } from "@canvas/primitives/dom";
import type { Subscription } from "@canvas/primitives/events";
import { unsubscribeAll } from "@canvas/primitives/events";
import type { Vector2 } from "@canvas/primitives/space";
import type { Optional } from "@canvas/primitives/types";
import type { RenderContext } from "@canvas/render/RenderContext";

export const MEASURE_FONT_SIZE = 20;

export abstract class TextItem extends BoardItem {
    protected lines: string[];

    protected computeInitial = true;
    protected dirtyText = false;
    protected ascent = 0;

    // Edit mode
    protected isEditing = false;
    protected textarea: Optional<HTMLTextAreaElement>;
    protected editSubscriptions: Subscription[] = [];
    protected previousState: BoardMode;

    public abstract text: string;

    constructor(
        readonly textColor: string,
        protected _fontSize: number,
        readonly font: Font,
        position: Vector2,
        size: Vector2,
        radians = 0,
        isFixed = false,
    ) {
        super(position, size, radians, isFixed);
    }

    public get fontSize(): number {
        return this._fontSize;
    }

    public draw(renderCtx: RenderContext): void {
        if (this.isEditing) {
            // Don't draw text during text edit to avoid offset artifacts
            return;
        }

        const viewport = renderCtx.viewport;
        const position = this.positionInViewport(viewport);

        renderCtx.ctx.fillStyle = this.textColor;
        renderCtx.ctx.font = this.font.toCss(
            viewport.zoomLevel * this._fontSize,
        );

        const lines = this.lines;
        const lineOffset = this.ascent;

        for (let i = 0; i < lines.length; ++i) {
            const line = lines[i];

            renderCtx.ctx.fillText(
                line,
                position.x,
                position.y +
                    viewport.zoomLevel * (lineOffset + i * this._fontSize),
            );
        }
    }

    public onSpawn(board: Board): void {
        super.onSpawn(board);

        if (!this.board.config.viewOnlyMode) {
            this.subscriptions.push(
                board.controller.mouse.onMouseClick.listen(this, e => {
                    if (e.clicks == 2) {
                        e.stopPropagation();
                        this.startEdit();
                    }
                }),
            );
        }

        this.subscriptions.push(
            board.controller.font.onFontLoad.listen(
                getFontIdentifier(this.font.fontFamily),
                () => {
                    this.markDirty();
                },
            ),
        );
    }

    public markDirty(): void {
        this.dirtyText = true;
        this.board?.markDirtyObject(this);
    }

    private startEdit(): void {
        if (this.board === undefined) {
            return;
        }

        resetCursor();

        const mode = this.board.controller.mode;

        this.previousState = mode.state;
        mode.state = BoardMode.TextEditing;
        this.isEditing = true;

        const parent = this.board.boardElement;
        const textarea = document.createElement("textarea");
        this.textarea = textarea;

        textarea.className = "styled-text-edit";
        textarea.innerHTML = this.text;
        textarea.style.color = this.textColor;

        parent.appendChild(textarea);

        // needs to be called after append, otherwise line-height does not work.
        this.updateTextarea();

        // Make sure clicks in textarea don't trigger board mouse interactions
        textarea.addEventListener("mousedown", e => {
            e.stopPropagation();
        });

        // Change events
        ["cut", "copy", "paste", "keyup", "mouseup"].forEach(eventType => {
            textarea.addEventListener(eventType, () => {
                this.text = this.textarea.value;
                this.updateTextarea();
            });
        });

        this.editSubscriptions.push(
            this.board.controller.mouse.onMouseDown.listen(undefined, () => {
                this.stopEdit();
            }),
        );

        // Listen to viewport changes to move texarea
        this.board.onChangeViewport.listen(undefined, () => {
            this.updateTextarea();
        });

        this.board.markDirtyObject(this);
    }

    private stopEdit(): void {
        const mode = this.board.controller.mode;

        if (mode.state === BoardMode.TextEditing) {
            mode.state = this.previousState;
        }

        this.isEditing = false;

        if (this.textarea !== undefined) {
            const parent = this.board.boardElement;

            parent.removeChild(this.textarea);
            this.textarea = undefined;
        }

        unsubscribeAll(this.editSubscriptions);
    }

    protected abstract updateTextarea(): void;
}
