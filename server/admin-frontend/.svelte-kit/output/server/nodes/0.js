import * as universal from '../entries/pages/_layout.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.js";
export const imports = ["_app/immutable/nodes/0.DuRllKmF.js","_app/immutable/chunks/hp4PFHFv.js","_app/immutable/chunks/BUApaBEI.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/DUTL2K4h.js","_app/immutable/chunks/B0lgo3m2.js","_app/immutable/chunks/D6X9Dqsv.js","_app/immutable/chunks/D0MnPDPq.js","_app/immutable/chunks/BYVOkQOI.js","_app/immutable/chunks/CxYFv8_H.js","_app/immutable/chunks/fsjQuU9w.js","_app/immutable/chunks/BG8YBeCn.js","_app/immutable/chunks/Co40BFZ2.js"];
export const stylesheets = ["_app/immutable/assets/0.CdYNVAO2.css"];
export const fonts = [];
