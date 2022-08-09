import type { BoardConfigPartial } from "@canvas/board/Board";
import { Board, BoardConfig } from "@canvas/board/Board";
import { EventHandler as RealEventHandler } from "@canvas/primitives/events";

export function create(
    boardId: string,
    configOverride: BoardConfigPartial = {},
): Board {
    const boardElement = document.getElementById(boardId);
    const board = new Board(
        window,
        boardElement,
        new BoardConfig().copy(configOverride),
    );
    board.run();

    return board;
}

export const EventHandler = RealEventHandler;
