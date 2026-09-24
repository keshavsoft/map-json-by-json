import registerGlobal from "./registerGlobal.js";
import { mapJson } from "./map.js";
import meta from "./meta.js";

// Register onto globalThis for browser and Node globals
registerGlobal({ inFuncDefinition: mapJson });

export { mapJson, meta };
export default mapJson;
