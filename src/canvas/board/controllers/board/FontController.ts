import type { Board } from "@canvas/board/Board";
import type { Subscription } from "@canvas/primitives/events";
import {
    createDomEventListener,
    EventBase,
    EventHandler,
    unsubscribeAll,
} from "@canvas/primitives/events";
import type { Optional } from "@canvas/primitives/types";

export class Font {
    constructor(
        readonly fontFamily: string,
        readonly fontStyle: Optional<string> = undefined,
        readonly fontWeight: Optional<string> = undefined,
    ) {}

    public toCss(fontSize: number): string {
        let css = `${fontSize}px ${this.fontFamily}`;

        if (this.fontWeight !== undefined) css = `${this.fontWeight} ${css}`;
        if (this.fontStyle !== undefined) css = `${this.fontStyle} ${css}`;

        return css;
    }
}

export class FontLoadEvent extends EventBase<string> {
    constructor(readonly font: FontFace) {
        super([getFontIdentifier(font.family)]);
    }
}

export class FontController {
    readonly onFontLoad = new EventHandler<FontLoadEvent>();

    private subscriptions: Subscription[] = [];

    constructor(private board: Board) {}

    public activate(): void {
        this.subscriptions.push(
            createDomEventListener(document.fonts, "loadingdone", e => {
                this.onFontsLoaded(<FontFaceSetLoadEvent>(<unknown>e));
            }),
        );
    }

    public deactivate(): void {
        unsubscribeAll(this.subscriptions);
    }

    private onFontsLoaded(e: FontFaceSetLoadEvent): void {
        for (const font of e.fontfaces) {
            this.onFontLoad.dispatch(new FontLoadEvent(font));
        }
    }
}

export function getFontIdentifier(family: string): string {
    // Standardize font family name
    return family.replace("'", "").replace('"', "").toLowerCase();
}
