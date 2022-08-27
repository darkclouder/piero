import { Font } from "canvas/board/controllers/board/FontController";
import type { GeometricObject } from "canvas/board/objects/GeometricObject";
import { BlockText } from "canvas/board/objects/items/BlockText";
import { ImageItem, ImageSet } from "canvas/board/objects/items/ImageItem";
import { Rectangle } from "canvas/board/objects/items/Rectangle";
import { StyledText } from "canvas/board/objects/items/StyledText";
import {
    Selectable,
    SelectionOptions,
} from "canvas/board/objects/ui/selectable/Selectable";
import { EventHandler as RealEventHandler } from "canvas/primitives/events";
import { Vector2 } from "canvas/primitives/space";
import { defaultBackgroundColor, defaultFrameColor } from "config/draw";

import type { Board } from "./board/Board";
import { StickyNote } from "./board/objects/items/StickyNote";
import { create as realCreate } from "./index";

export function fillSamples(board: Board): void {
    function addContentOnTop(content: GeometricObject[]) {
        board.addObjectsBelow(content, board.controller.maxContentMarker);
    }

    addContentOnTop([
        new Selectable(
            new Rectangle("#000000", new Vector2(0, 0), new Vector2(100, 100)),
            new SelectionOptions(true, true, false),
        ),
        new Selectable(
            new Rectangle(
                defaultFrameColor,
                new Vector2(300, 100),
                new Vector2(200, 100),
                Math.PI / 4,
            ),
            new SelectionOptions(true, true, false),
        ),
        new Selectable(
            new Rectangle(
                defaultBackgroundColor,
                new Vector2(520, 100),
                new Vector2(200, 100),
                Math.PI / 2,
            ),
        ),
    ]);

    const lorem = `
Majoruslonguslinoswoodchuckchuckinawood
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
incididunt ut labore et dolore magna aliqua. Enim facilisis gravida neque
convallis a. Aliquam eleifend mi in nulla. Pulvinar etiam non quam lacus
suspendisse faucibus interdum posuere. Porta non pulvinar neque laoreet
suspendisse interdum consectetur. Donec ultrices tincidunt arcu non. Vitae purus
faucibus ornare suspendisse sed nisi. Justo donec enim diam vulputate ut
pharetra sit. Consequat nisl vel pretium lectus quam id leo in vitae.
Pulvinar pellentesque habitant morbi tristique senectus.
Superlonguswordusandsoondusblablablablubb andanotherreallylongwordblablablubbsadad         Hi
`;

    const loremBlockText = new Selectable(
        new BlockText(
            lorem,
            "#333377",
            18,
            new Font("Helvetica"),
            new Vector2(350, 500),
            new Vector2(300, 200),
        ),
    );

    addContentOnTop([
        new Selectable(
            new StyledText(
                "Hello 世界",
                "#333377",
                50,
                new Font("Helvetica"),
                new Vector2(700, 200),
                0.7,
            ),
        ),
        new Selectable(
            new StyledText(
                "Hello 世界",
                "#333377",
                50,
                new Font("Helvetica"),
                new Vector2(700, 200),
            ),
        ),
        new Selectable(
            new StyledText(
                "Multi-line\ntext\nنص\n한글로",
                "#333377",
                50,
                new Font("Helvetica"),
                new Vector2(100, 500),
            ),
            new SelectionOptions(false, false, true),
        ),
        loremBlockText,
        new Selectable(
            new BlockText(
                lorem,
                "#330000",
                18,
                new Font("Hanalei"),
                new Vector2(800, 500),
                new Vector2(300, 200),
                0.7,
            ),
        ),
        new Selectable(
            new StickyNote(
                "The newly created note has a yellow background and a placeholder text “Edit here”",
                "#000",
                "#DECD00",
                14,
                new Font("Open Sans"),
                new Vector2(350, 500),
                new Vector2(300, 200),
                0,
                false,
                10,
            ),
        ),
    ]);

    const selectionContainers = [];
    const n = 100;

    for (let i = 0; i < n; i++) {
        selectionContainers.push(
            new Selectable(
                new Rectangle(
                    "#" + (((1 << 24) * Math.random()) | 0).toString(16),
                    new Vector2(600 + i * 220, 300),
                    new Vector2(200, 100),
                ),
            ),
        );
    }

    addContentOnTop(selectionContainers);

    addContentOnTop([
        new Selectable(
            new ImageItem(
                new ImageSet(
                    {
                        width: 1200,
                        height: 1134,
                        url:
                            "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Panama_hat.jpg/1200px-Panama_hat.jpg",
                    },
                    [
                        {
                            width: 474,
                            height: 447,
                            url:
                                "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse3.mm.bing.net%2Fth%3Fid%3DOIP.Aa6w6hSm8mbUt0QzBYhmbwHaG_%26pid%3DApi&f=1",
                        },
                    ],
                ),
                new Vector2(1100, 50),
                0,
                false,
                new Vector2(1200 / 6, 1134 / 6),
                Vector2.origin,
                1 / 6,
            ),
        ),
    ]);

    addContentOnTop([
        new Selectable(
            new ImageItem(
                new ImageSet({
                    width: 1200,
                    height: 1134,
                    url:
                        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/this_does_not_exist.jpg",
                }),
                new Vector2(1100, 300),
                0,
                false,
                new Vector2(1200 / 6, 1134 / 6),
                Vector2.origin,
                1 / 6,
            ),
        ),
    ]);
}

export const create = realCreate;
export const EventHandler = RealEventHandler;
