import * as universal from '../entries/pages/_layout.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.js";
export const imports = ["_app/immutable/nodes/0.BJmXKq_6.js","_app/immutable/chunks/BknnfsOL.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/5yUWFagQ.js","_app/immutable/chunks/DHRCVGej.js","_app/immutable/chunks/KxZlDSAv.js","_app/immutable/chunks/ZIXrXB8P.js","_app/immutable/chunks/DcwqtrKM.js","_app/immutable/chunks/q4OCzlSm.js","_app/immutable/chunks/Dv1qdQ59.js","_app/immutable/chunks/rxA0stX0.js"];
export const stylesheets = ["_app/immutable/assets/0.CdYNVAO2.css"];
export const fonts = [];
