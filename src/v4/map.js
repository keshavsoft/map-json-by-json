/**
 * map-json-by-json v1 Engine
 * Story: Template-driven declarative JSON transformation engine.
 * Target template is the source of truth, extracting and reshaping data from source JSON.
 */

const isObject = ({ inValue } = {}) => {
    const localValue = inValue;
    return localValue !== null && typeof localValue === "object";
};

const isPlainObject = ({ inValue } = {}) => {
    const localValue = inValue;
    return isObject({ inValue: localValue }) && !Array.isArray(localValue);
};

const isArray = ({ inValue } = {}) => {
    const localValue = inValue;
    return Array.isArray(localValue);
};

// Helper: Resolve dot-notated path e.g. "order.customer.name" or simple key "VOUCHERNUMBER"
const getPathValue = ({ inObject, inPath } = {}) => {
    const localObject = inObject;
    const localPath = inPath;

    if (!isObject({ inValue: localObject }) || localPath === undefined || localPath === null) {
        return undefined;
    }

    if (typeof localPath !== "string") {
        return undefined;
    }

    // Direct key match (avoids unnecessary split if key has literal dots, e.g. "ALLINVENTORYENTRIES.LIST")
    if (localPath in localObject) {
        return localObject[localPath];
    }

    // Dot notation resolution
    const parts = localPath.split(".");
    let current = localObject;
    for (const part of parts) {
        if (!isObject({ inValue: current }) || !(part in current)) {
            return undefined;
        }
        current = current[part];
    }
    return current;
};

// Maps a single source item against a template object
const mapSingleItem = ({ inTemplate, inSource } = {}) => {
    const localTemplate = inTemplate;
    const localSource = inSource;

    if (!isPlainObject({ inValue: localTemplate })) {
        return localTemplate;
    }

    if (!isObject({ inValue: localSource })) {
        return undefined;
    }

    const localResult = {};

    Object.entries(localTemplate).forEach(([targetKey, rule]) => {
        // Skip metadata directives like $from or $as
        if (targetKey.startsWith("$")) return;

        // 1. Literal / Constant Value
        if (isPlainObject({ inValue: rule }) && "$value" in rule) {
            localResult[targetKey] = rule.$value;
            return;
        }

        // 2. String Path: extract field from source
        if (typeof rule === "string") {
            const val = getPathValue({ inObject: localSource, inPath: rule });
            if (val !== undefined) {
                localResult[targetKey] = val;
            }
            return;
        }

        // 3. Function transform
        if (typeof rule === "function") {
            localResult[targetKey] = rule(localSource);
            return;
        }

        // 4. Sub-collection extraction with $from
        if (isPlainObject({ inValue: rule }) && ("$from" in rule || "from" in rule)) {
            const sourcePath = rule.$from || rule.from;
            const subSource = getPathValue({ inObject: localSource, inPath: sourcePath });

            if (subSource !== undefined && subSource !== null) {
                if (Array.isArray(subSource)) {
                    localResult[targetKey] = subSource
                        .map(item => mapSingleItem({ inTemplate: rule, inSource: item }))
                        .filter(item => item !== undefined);
                } else if (isPlainObject({ inValue: subSource })) {
                    localResult[targetKey] = mapSingleItem({ inTemplate: rule, inSource: subSource });
                } else {
                    localResult[targetKey] = subSource;
                }
            }
            return;
        }

        // 5. Nested object without $from (nested structure in template)
        if (isPlainObject({ inValue: rule })) {
            const nested = mapSingleItem({ inTemplate: rule, inSource: localSource });
            if (nested !== undefined) {
                localResult[targetKey] = nested;
            }
            return;
        }

        // 6. Direct primitive/array in template
        localResult[targetKey] = rule;
    });

    return localResult;
};

export const mapValue = ({ inTemplate, inSource } = {}) => {
    const localTemplate = inTemplate;
    const localSource = inSource;

    if (!isPlainObject({ inValue: localTemplate })) {
        return undefined;
    }

    if (!isObject({ inValue: localSource })) {
        return undefined;
    }

    // If source is an array, map each element
    if (isArray({ inValue: localSource })) {
        return localSource
            .map(item => mapSingleItem({ inTemplate: localTemplate, inSource: item }))
            .filter(item => item !== undefined);
    }

    // Source is a single object
    return mapSingleItem({ inTemplate: localTemplate, inSource: localSource });
};

export const mapJson = (inParamOne, inParamTwo) => {
    // Case 1: Called with single options object { inTemplate, inSource } or { inSource, inTemplate }
    if (
        inParamOne !== null &&
        typeof inParamOne === "object" &&
        !Array.isArray(inParamOne) &&
        "inTemplate" in inParamOne &&
        "inSource" in inParamOne
    ) {
        const localTemplate = inParamOne.inTemplate;
        const localSource = inParamOne.inSource;
        return mapValue({ inTemplate: localTemplate, inSource: localSource });
    }

    // Case 2: Positional arguments (template, source) OR (source, template)
    let localTemplate;
    let localSource;

    if (Array.isArray(inParamOne)) {
        // (sourceArray, template)
        localSource = inParamOne;
        localTemplate = inParamTwo;
    } else if (Array.isArray(inParamTwo)) {
        // (template, sourceArray)
        localTemplate = inParamOne;
        localSource = inParamTwo;
    } else {
        // Both are objects: default (template, source)
        localTemplate = inParamOne;
        localSource = inParamTwo;
    }

    return mapValue({ inTemplate: localTemplate, inSource: localSource });
};

export {
    isObject,
    isPlainObject,
    isArray,
    getPathValue,
    mapSingleItem
};

export default mapJson;
