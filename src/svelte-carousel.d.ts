declare module 'svelte-carousel' {
    import type { SvelteComponent } from 'svelte';

    export interface CarouselProps {
        autoplay?: boolean;
        autoplayDuration?: number;
        arrows?: boolean;
        dots?: boolean;
        infinite?: boolean;
        pauseOnFocus?: boolean;
        swiping?: boolean;
        particlesToShow?: number;
        particlesToScroll?: number;
        duration?: number;
        timingFunction?: string;
        [key: string]: unknown;
    }

    export default class Carousel extends SvelteComponent<CarouselProps> {}
}
