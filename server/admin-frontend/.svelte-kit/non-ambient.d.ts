
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/(admin)" | "/" | "/(admin)/announcements" | "/(admin)/cards" | "/(admin)/character-packs" | "/(admin)/commission" | "/(admin)/dashboard" | "/login" | "/(admin)/logs" | "/(admin)/marketing" | "/(admin)/settings" | "/(admin)/software" | "/(admin)/users";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/(admin)": Record<string, never>;
			"/": Record<string, never>;
			"/(admin)/announcements": Record<string, never>;
			"/(admin)/cards": Record<string, never>;
			"/(admin)/character-packs": Record<string, never>;
			"/(admin)/commission": Record<string, never>;
			"/(admin)/dashboard": Record<string, never>;
			"/login": Record<string, never>;
			"/(admin)/logs": Record<string, never>;
			"/(admin)/marketing": Record<string, never>;
			"/(admin)/settings": Record<string, never>;
			"/(admin)/software": Record<string, never>;
			"/(admin)/users": Record<string, never>
		};
		Pathname(): "/" | "/announcements" | "/announcements/" | "/cards" | "/cards/" | "/character-packs" | "/character-packs/" | "/commission" | "/commission/" | "/dashboard" | "/dashboard/" | "/login" | "/login/" | "/logs" | "/logs/" | "/marketing" | "/marketing/" | "/settings" | "/settings/" | "/software" | "/software/" | "/users" | "/users/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}