import "@ext/Array";

import type { Optional } from "@canvas/primitives/types";

export class ZBuffer<T> {
    private buffer: T[] = [];
    private indices = new Map<T, number>();

    public add(object: T, z?: number): void {
        this.addMany([object], z);
    }

    public addMany(objects: T[], z?: number): void {
        this.checkNotExist(objects);

        if (z === undefined) {
            // No index specified: Stack on top
            z = this.buffer.length;
        }

        if (z >= this.buffer.length) {
            // Stack on top
            this.buffer.push(...objects);
        } else {
            // Index already exists
            // Move all existing objects from this index upwards one slot up
            this.buffer.splice(z, 0, ...objects);
        }
        this.reindex(z);
    }

    public remove(object: T): void {
        this.removeMany([object]);
    }

    public removeMany(objects: T[]): void {
        if (objects.length == 0) {
            return;
        }

        this.checkExist(objects);

        const zs = this.sortedObjects(objects);
        const zMin = this.indices.get(zs[0]);

        // Rebuild array from minZ on with remaining objects
        const remaining: T[] = [];
        let i = zMin;
        let j = 0;

        for (; i < this.buffer.length && j < zs.length; ++i) {
            if (this.buffer[i] == zs[j]) {
                // Came across object to remove:
                // Advance and skip item in reamining
                ++j;
            } else {
                remaining.push(this.buffer[i]);
            }
        }

        objects.forEach(object => {
            this.indices.delete(object);
        });

        this.buffer.splice(zMin, i - zMin, ...remaining);
        this.reindex(zMin);
    }

    public moveTo(object: T, z: number): void {
        this.moveManyTo([object], z);
    }

    public moveManyTo(objects: T[], z: number): void {
        this.checkExist(objects);

        // Store relative ordering of objects
        const sortedObjects = this.sortedObjects(objects);

        this.removeMany(objects);
        this.addMany(sortedObjects, z);
    }

    public reorderManyTo(sortedObjects: T[], z: number): void {
        this.checkExist(sortedObjects);
        this.removeMany(sortedObjects);
        this.addMany(sortedObjects, z);
    }

    public getIndex(object: T): Optional<number> {
        return this.indices.get(object);
    }

    public sorted(): T[] {
        return [...this.buffer];
    }

    private checkNotExist(objects: T[]): void {
        const existing = objects.filter(object => this.indices.has(object));

        if (existing.length > 0) {
            throw ["Cannot use existing objects:", existing];
        }
    }

    private checkExist(objects: T[]): void {
        const nonExisting = objects.filter(object => !this.indices.has(object));

        if (nonExisting.length > 0) {
            throw ["Cannot use non-existing objects:", nonExisting];
        }
    }

    private sortedObjects(objects: T[]): T[] {
        return objects
            .map(object => [object, this.getIndex(object)])
            .sort((a: [T, number], b: [T, number]) => a[1] - b[1])
            .map((x: [T, number]) => x[0]);
    }

    private reindex(fromInclude = 0, toExclude = this.buffer.length): void {
        for (let i = fromInclude; i < toExclude; ++i) {
            const object = this.buffer[i];
            this.indices.set(object, i);
        }
    }
}
