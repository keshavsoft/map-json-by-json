import registerGlobal from "./registerGlobal.js";
import mapJson, { meta } from "./browser.js";

registerGlobal({ inFuncDefinition: mapJson });

export { mapJson, meta };
export default mapJson;
