# piero
piero is the underlying HTML canvas renderer used in [Ledavio moodboards](https://ledavio.design/).
You can also check out this [demo](https://darkclouder.github.io/piero/index.html).

piero has a completly custom
    event system (including click, drag, etc),
    render pipeline,
    object management,
    item alignment with guidelines,
    zoom, pan,
    resize, crop
    etc.
fully built with TypeScript.

## Getting started
* Make sure `node^14.2` and `npm^6.14` is installed.
* Run `npm install`.
* Start locally with `npm run dev`.

The best place to start is looking at the existing demo board you can find at [dist/index.html](dist/index.html).
[src/canvas/dev.ts](src/canvas/dev.ts)'s `fillSamples` is a good example of how you can populate your board with different objects.

[`Selectable`](src/canvas/board/objects/ui/selectable/Selectable.ts) is a useful wrapper if you want to make your object interactive.
[`Rectangle`](src/canvas/board/objects/items/Rectangle.ts) is a good starting point to understand how new object types can be implemented.

For most cases using a [`Board`](src/canvas/board/Board.ts) is preferable as an object manager, which means new object types need to at least implement [`GeometricObject`](src/canvas/board/objects/GeometricObject.ts).

However, by exposing [`LayeredRenderer`](src/canvas/render/LayeredRenderer.ts), you can use the underlying [`RenderObject`](src/canvas/render/RenderObject.ts) interface, which has no concept of object dimensions and simply is drawn when it is needed.

## Building
`npm run build`

Before merging, make sure to pass `npm run lint`.
Running `npm run format` first helps with auto-formatting.
