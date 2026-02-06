export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14')
];

export const server_loads = [];

export const dictionary = {
		"/(admin)": [3,[2]],
		"/(admin)/announcements": [4,[2]],
		"/(admin)/cards": [5,[2]],
		"/(admin)/character-packs": [6,[2]],
		"/(admin)/commission": [7,[2]],
		"/(admin)/dashboard": [8,[2]],
		"/login": [14],
		"/(admin)/logs": [9,[2]],
		"/(admin)/marketing": [10,[2]],
		"/(admin)/settings": [11,[2]],
		"/(admin)/software": [12,[2]],
		"/(admin)/users": [13,[2]]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
export const encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';