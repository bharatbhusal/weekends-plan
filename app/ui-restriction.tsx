"use client";

import { useEffect } from "react";

export function UiRestriction({
	children,
}: {
	children: React.ReactNode;
}) {
	useEffect(() => {
		// Desktop zoom
		const handleWheel = (e: WheelEvent) => {
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				(e.ctrlKey || e.metaKey) &&
				["+", "-", "=", "_", "0"].includes(e.key)
			) {
				e.preventDefault();
			}
		};

		// Mobile pinch zoom
		const handleTouchMove = (e: TouchEvent) => {
			if (e.touches.length > 1) {
				e.preventDefault();
			}
		};

		// Mobile double-tap zoom
		let lastTouchEnd = 0;

		const handleTouchEnd = (e: TouchEvent) => {
			const now = Date.now();

			if (now - lastTouchEnd <= 300) {
				e.preventDefault();
			}

			lastTouchEnd = now;
		};

		// Disable text selection
		const preventSelection = (e: Event) => {
			e.preventDefault();
		};

		document.addEventListener("wheel", handleWheel, {
			passive: false,
		});

		document.addEventListener("keydown", handleKeyDown);

		document.addEventListener("touchmove", handleTouchMove, {
			passive: false,
		});

		document.addEventListener("touchend", handleTouchEnd, {
			passive: false,
		});

		document.addEventListener(
			"selectstart",
			preventSelection,
		);
		document.addEventListener(
			"contextmenu",
			preventSelection,
		);

		return () => {
			document.removeEventListener("wheel", handleWheel);
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener(
				"touchmove",
				handleTouchMove,
			);
			document.removeEventListener("touchend", handleTouchEnd);
			document.removeEventListener(
				"selectstart",
				preventSelection,
			);
			document.removeEventListener(
				"contextmenu",
				preventSelection,
			);
		};
	}, []);

	return <>{children}</>;
}
