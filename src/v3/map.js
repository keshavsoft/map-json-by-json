const isPlainObject = (value) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const validateJsonValue = (value, label, ancestors = new Set()) => {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;

  if (typeof value !== "object") {
    throw new TypeError(`${label} must contain JSON values only`);
  }
  if (ancestors.has(value)) {
    throw new TypeError(`${label} must not contain circular references`);
  }

  ancestors.add(value);
  if (Array.isArray(value)) {
    for (const key of Reflect.ownKeys(value)) {
      if (key === "length") continue;
      const index = typeof key === "string" ? Number(key) : Number.NaN;
      if (!Number.isInteger(index) || index < 0 || index >= value.length || String(index) !== key) {
        throw new TypeError(`${label} arrays must contain indexed JSON values only`);
      }
    }
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, "value")) {
        throw new TypeError(`${label} must not contain sparse arrays`);
      }
      validateJsonValue(descriptor.value, label, ancestors);
    }
  } else {
    if (!isPlainObject(value)) {
      throw new TypeError(`${label} must contain plain JSON objects only`);
    }
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") {
        throw new TypeError(`${label} objects must use string keys only`);
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor.enumerable || !Object.hasOwn(descriptor, "value")) {
        throw new TypeError(`${label} objects must contain enumerable data properties only`);
      }
      validateJsonValue(descriptor.value, label, ancestors);
    }
  }
  ancestors.delete(value);
};

const cloneJsonValue = (value) => {
  if (Array.isArray(value)) return value.map(cloneJsonValue);
  if (!isPlainObject(value)) return value;

  const clone = {};
  for (const [key, child] of Object.entries(value)) {
    Object.defineProperty(clone, key, {
      value: cloneJsonValue(child),
      enumerable: true,
      configurable: true,
      writable: true
    });
  }
  return clone;
};

const getPathValue = (source, path, location) => {
  if (typeof path !== "string" || path.length === 0) {
    throw new TypeError(`${location} must use a non-empty string path`);
  }

  if (isPlainObject(source) && Object.hasOwn(source, path)) return source[path];

  let current = source;
  for (const part of path.split(".")) {
    if (
      current === null ||
      typeof current !== "object" ||
      !Object.hasOwn(current, part)
    ) {
      throw new Error(`Missing source path "${path}" at ${location}`);
    }
    current = current[part];
  }
  return current;
};

const defineJsonProperty = (target, key, value) => {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true
  });
};

const mapRecord = (template, source, location) => {
  if (!isPlainObject(source)) {
    throw new TypeError(`Expected an object source at ${location}`);
  }

  const result = {};
  for (const [key, rule] of Object.entries(template)) {
    if (key.startsWith("$")) {
      if (key === "$from") continue;
      throw new TypeError(`Unknown template directive "${key}" at ${location}`);
    }

    const fieldLocation = `${location}.${key}`;
    if (isPlainObject(rule) && Object.hasOwn(rule, "$value")) {
      if (Object.keys(rule).length !== 1) {
        throw new TypeError(`$value must be the only directive at ${fieldLocation}`);
      }
      defineJsonProperty(result, key, cloneJsonValue(rule.$value));
      continue;
    }

    if (typeof rule === "string") {
      defineJsonProperty(result, key, cloneJsonValue(getPathValue(source, rule, fieldLocation)));
      continue;
    }

    if (isPlainObject(rule) && Object.hasOwn(rule, "$from")) {
      const collection = getPathValue(source, rule.$from, fieldLocation);
      if (Array.isArray(collection)) {
        defineJsonProperty(result, key, collection.map((item, index) =>
          mapRecord(rule, item, `${fieldLocation}[${index}]`)
        ));
      } else {
        defineJsonProperty(result, key, mapRecord(rule, collection, fieldLocation));
      }
      continue;
    }

    if (isPlainObject(rule)) {
      defineJsonProperty(result, key, mapRecord(rule, source, fieldLocation));
      continue;
    }

    defineJsonProperty(result, key, cloneJsonValue(rule));
  }
  return result;
};

/**
 * Strict v3 mapper. Input one is a mapping template; input two supplies values.
 * Both inputs are read only and the returned JSON is fully detached from them.
 */
export const mapJson = (inTemplate, inSource) => {
  validateJsonValue(inTemplate, "Template");
  validateJsonValue(inSource, "Source");

  if (!isPlainObject(inTemplate)) {
    throw new TypeError("Template must be a plain JSON object");
  }
  if (!isPlainObject(inSource) && !Array.isArray(inSource)) {
    throw new TypeError("Source must be a JSON object or an array of JSON objects");
  }

  if (Array.isArray(inSource)) {
    return inSource.map((item, index) => mapRecord(inTemplate, item, `source[${index}]`));
  }
  return mapRecord(inTemplate, inSource, "source");
};

export const mapJsonV3 = mapJson;
export default mapJson;
