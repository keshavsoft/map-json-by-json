# map-json-by-json

> Template-driven declarative JSON transformation engine where the target template is the source of truth.

[![npm version](https://img.shields.io/npm/v/map-json-by-json.svg)](https://www.npmjs.com/package/map-json-by-json)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Why map-json-by-json?

In enterprise architectures, backend systems, legacy ERPs, or complex REST/XML APIs emit structures that do not match the clean data contract required by your frontend, reports, or modern microservices.

Instead of writing custom loops and manual glue code for every endpoint, `map-json-by-json` lets you declare the **exact target template** you want. The engine walks your template, extracts the values from the source, and produces the desired shape.

---

## Installation

```bash
npm install map-json-by-json
```

---

## Usage

### 1. Template-Driven Reshaping & Deep `$from` Collections

Declare the final JSON structure you want. Use `$from` to pull items from nested arrays:

```javascript
import { mapJson } from "map-json-by-json";

const rawSourceData = [
  {
    DATE: "20260401",
    VOUCHERNUMBER: 1,
    VOUCHERTYPENAME: "Sales/CA",
    "ALLINVENTORYENTRIES.LIST": [
      {
        STOCKITEMNAME: "Shading Net Kgs",
        RATE: "280.90/kgs",
        AMOUNT: 1280.9,
        "BATCHALLOCATIONS.LIST": [
          { BATCHNAME: "Rishi-Rs.205/-", AMOUNT: 1000 }
        ]
      }
    ]
  }
];

// Target Template defines the final output contract
const template = {
  date: "DATE",
  voucherNo: "VOUCHERNUMBER",
  voucherType: "VOUCHERTYPENAME",
  items: {
    $from: "ALLINVENTORYENTRIES.LIST",
    itemName: "STOCKITEMNAME",
    rate: "RATE",
    amount: "AMOUNT",
    batches: {
      $from: "BATCHALLOCATIONS.LIST",
      batchName: "BATCHNAME",
      amount: "AMOUNT"
    }
  }
};

const result = mapJson(template, rawSourceData);
console.log(result);
```

**Output:**
```json
[
  {
    "date": "20260401",
    "voucherNo": 1,
    "voucherType": "Sales/CA",
    "items": [
      {
        "itemName": "Shading Net Kgs",
        "rate": "280.90/kgs",
        "amount": 1280.9,
        "batches": [
          {
            "batchName": "Rishi-Rs.205/-",
            "amount": 1000
          }
        ]
      }
    ]
  }
]
```

---

### 2. Static Values & Computed Functions

Templates can include static values using `$value` or custom computed functions:

```javascript
const template = {
  system: { $value: "KeshavSoft Enterprise" },
  displayTitle: source => `${source.VOUCHERTYPENAME} #${source.VOUCHERNUMBER}`
};
```

---

### 3. KeshavSoft Parameter Convention

Supports both positional arguments and the KeshavSoft `{ inTemplate, inSource }` destructured object calling pattern:

```javascript
const result = mapJson({
  inTemplate: template,
  inSource: rawSourceData
});
```

---

## Versioned Entry Points

The package root and `map-json-by-json/v2` both expose the v2 API. `map-json-by-json/v3` exposes the strict mapper, which reads a mapping template and source JSON without mutating either input and returns a new result. v1 is not part of this package release.

## Interfaces and guides

- [Interactive playground](docs/index.html)
- [Install and use with npm, npx, CLI, or CDN](docs/usage.html)
- [JavaScript API](docs/api.html)
- [CLI](docs/cli.html)
- [HTTP endpoint example](docs/endpoint.html)
- [Browser and CDN](docs/browser.html)
- [v3 strict mapper](docs/v3.html)
- [Data examples](docs/examples.html)

## Build the V2 playground

```sh
npm install
npm run docs:build
```

Vite writes the built site to `docs/dist/v2` for GitHub Pages or another static host.

## CLI quick start

```sh
npx map-json-by-json --template template.json --input source.json
```

For standard input, pass `--input -`. See the [CLI guide](docs/cli.html) for file output and error handling.

## Local documentation

```sh
npm run docs:serve
```

Open the local URL printed by the command. The playground loads the working tree's v2 module in local mode.

---

## License

[MIT](LICENSE) © [KeshavSoft](https://keshavsoft.com)
