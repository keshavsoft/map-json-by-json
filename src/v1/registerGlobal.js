import meta from "./meta.js";

export const registerGlobal = (inParam) => {
    const localFuncDefinition = typeof inParam === "function"
        ? inParam
        : inParam?.inFuncDefinition;

    if (typeof globalThis === "undefined" || !localFuncDefinition) return;

    globalThis.ks ??= {};
    globalThis.ks["map-json-by-json"] = {
        meta,
        mapJson: localFuncDefinition
    };

    globalThis.ks.mapJson = localFuncDefinition;
};

export default registerGlobal;
