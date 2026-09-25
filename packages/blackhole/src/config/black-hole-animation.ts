import routeData from "../embedded/routes";

export type BlackHoleVec3 = [number, number, number];

export type BlackHoleAnimationEase =
	| "linear"
	| "smoothstep"
	| "easeInOutCubic"
	| "cinematic";

export type BlackHoleAnimationPaletteMode = "source" | "custom";

export type BlackHoleAnimationGlyphPreset =
	| "gargantua"
	| "classic"
	| "dense"
	| "custom";

export type BlackHoleAnimationKeyframe = {
	duration: number;
	position: BlackHoleVec3;
	forward: BlackHoleVec3;
	universeSign: number;
	ease?: BlackHoleAnimationEase;
	timeScale?: number;
	exposure?: number;
	bloomStrength?: number;
	temporalJitter?: number;
	asciiEnabled?: boolean;
	textSize?: number;
	brightness?: number;
	contrast?: number;
	glyphPreset?: BlackHoleAnimationGlyphPreset;
	customGlyphs?: string;
	paletteMode?: BlackHoleAnimationPaletteMode;
	shadowColor?: string;
	midColor?: string;
	highlightColor?: string;
};

export type BlackHoleOrbit = {
	anchor: BlackHoleVec3;
	lookTarget: BlackHoleVec3;
	driftRadius: number;
	period: number;
	/** Maximum settled heading offsets in degrees; zero when omitted. */
	yawAmplitude?: number;
	pitchAmplitude?: number;
	framingTarget: [number, number];
	/** Session variation affects phase only, never the page composition. */
	phaseOffset?: number;
	/** Inner-gap waypoint for entering or leaving below-disk views. */
	approach?: BlackHoleVec3;
};

export type BlackHoleRouteAnimation = {
	orbit: BlackHoleOrbit;
	intro: BlackHoleAnimationKeyframe[];
	idle: BlackHoleAnimationKeyframe[];
	transition: BlackHoleAnimationKeyframe[];
};

export type BlackHoleAnimationRouteKey = string;
export type BlackHoleRoutes = Record<string, BlackHoleRouteAnimation>;
export const BLACK_HOLE_ANIMATION_ROUTES: BlackHoleRoutes = { "/": routeData["/"], fallback: routeData.fallback } as unknown as BlackHoleRoutes;
export const BLACK_HOLE_ANIMATION_ROUTE_OPTIONS = [{label: "Default", value: "/"}];
export function normalizeBlackHoleAnimationRoute(pathname: string | undefined, routes = BLACK_HOLE_ANIMATION_ROUTES): string {
 const path = (pathname || "/").split(/[?#]/, 1)[0].replace(/\/$/, "") || "/";
 if (routes[path]) return path;
 const wildcard = Object.keys(routes).filter(key => key.endsWith("/*") && path.startsWith(key.slice(0,-1))).sort((a,b) => b.length-a.length)[0];
 return wildcard ?? (routes.fallback ? "fallback" : "/");
}
export function getBlackHoleRouteAnimation(pathname: string | undefined, routes = BLACK_HOLE_ANIMATION_ROUTES): BlackHoleRouteAnimation {
 return routes[normalizeBlackHoleAnimationRoute(pathname, routes)] ?? BLACK_HOLE_ANIMATION_ROUTES["/"];
}
