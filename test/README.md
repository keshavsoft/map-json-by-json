# Learn after cloning

This folder is part of the `map-json-by-json` repository. From a terminal:

```sh
git clone https://github.com/keshavsoft/map-json-by-json.git
cd map-json-by-json
npm install
npm test
```

The package root is v2. The strict v3 mapper is available separately from `map-json-by-json/v3`.

## Try the npm API

In another Node.js project, install the published package and import its API:

```sh
npm install map-json-by-json
```

```js
import { mapJson } from "map-json-by-json"; // v2
// import { mapJson } from "map-json-by-json/v3"; // strict v3

const result = mapJson(
  { displayName: "person.name" },
  { person: { name: "Asha" } }
);
console.log(result);
```

V3 treats argument one as the mapping template, leaves it unchanged, reads source values from argument two, and returns a new object. V3 throws if a mapped source path is missing.

## Run the CLI with npx

`npx` fetches and runs the published CLI without adding it to the current project's dependencies:

```sh
npx map-json-by-json --template examples/order-template.json --input examples/order-source.json
```

To save the output, add `--output result.json`. For stdin, pass `--input -`.

## Run the CLI installed by npm

Install it globally to call the command by name:

```sh
npm install --global map-json-by-json
map-json-by-json --template examples/order-template.json --input examples/order-source.json
```

To use the CLI from this cloned checkout without publishing it, run the repository's script directly:

```sh
node bin/map-json-by-json.js --template examples/order-template.json --input examples/order-source.json
```

## Use the browser CDN

Add a module script to an HTML page. The example uses the v2 browser entry:

```html
<script type="module">
  import { mapJson } from "https://cdn.jsdelivr.net/npm/map-json-by-json@2.0.0/src/v2/browser.js";
  const result = mapJson({ label: "name" }, { name: "Cable" });
  console.log(result);
</script>
```

After release `2.1.0` is published, load v3 from `https://cdn.jsdelivr.net/npm/map-json-by-json@2.1.0/src/v3/index.js` and pass JSON-compatible inputs. Pin the release version in browser pages.

## Build and browse the docs

```sh
npm run docs:build
npm run docs:dev
```

Vite writes the playground build to `docs/dist/v2`. This guide is for learning after clone; the test files themselves are run with `npm test`.
