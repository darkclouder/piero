export class ImmutableSetView<T> {
    constructor(private set: Set<T>) {}

    public has(value: T): boolean {
        return this.set.has(value);
    }

    public forEach(
        callbackfn: (value: T, value2: T, set: Set<T>) => void,
    ): void {
        this.set.forEach(callbackfn);
    }

    public get size(): number {
        return this.set.size;
    }

    *[Symbol.iterator](): Iterator<T> {
        for (const curr of this.set) {
            yield curr;
        }
    }
}

declare global {
    export interface Set<T> {
        immutable(): ImmutableSetView<T>;
    }
}

(() => {
    if (!Set.prototype.immutable) {
        Set.prototype.immutable = function <T>(this: Set<T>) {
            return new ImmutableSetView<T>(this);
        };
    }
})();
