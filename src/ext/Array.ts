export {};

declare global {
    export interface Array<T> {
        reversed(): Iterable<T>;
        min(compareFn?: (a: T, b: T) => number): T | undefined;
    }
}

(() => {
    if (!Array.prototype.reversed) {
        Array.prototype.reversed = function* <T>(this: T[]) {
            let i = this.length;

            while (i > 0) {
                yield this[--i];
            }
        };
    }

    if (!Array.prototype.min) {
        Array.prototype.min = function <T>(
            this: T[],
            compareFn?: (a: T, b: T) => number,
        ) {
            const n = this.length;
            let min: T | undefined = undefined;

            for (let i = 0; i < n; ++i) {
                const curr = this[i];

                if (min === undefined) {
                    min = curr;
                } else if (compareFn(min, curr) > 0) {
                    min = curr;
                }
            }

            return min;
        };
    }
})();
