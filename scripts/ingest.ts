import { runIngestionPipeline } from "../services/ingestion";

async function main() {
	const startTime = Date.now();
	console.log(
		"=== Weekends Plan — Event Ingestion Pipeline ===",
	);
	console.log(`Started at: ${new Date().toISOString()}\n`);

	try {
		const result = await runIngestionPipeline();

		const elapsed = ((Date.now() - startTime) / 1000).toFixed(
			1,
		);
		console.log(`\n=== Ingestion Summary (${elapsed}s) ===`);
		console.log(
			`Sources attempted: ${result.sourceResults.length}`,
		);
		const successCount = result.sourceResults.filter(
			(s) => !s.error,
		).length;
		const failCount = result.sourceResults.filter(
			(s) => s.error,
		).length;
		console.log(
			`Sources succeeded: ${successCount}, failed: ${failCount}`,
		);
		console.log(
			`Total fetched (pre-dedup): ${result.totalFetched}`,
		);
		console.log(
			`Total unique (post-dedup): ${result.totalUnique}`,
		);
		const deduped = result.totalFetched - result.totalUnique;
		console.log(`Duplicates removed: ${deduped}`);
		console.log(
			`DB inserted: ${result.inserted}, DB updated: ${result.modified}`,
		);

		for (const sr of result.sourceResults) {
			if (sr.error) {
				console.log(`  ❌ ${sr.source}: FAILED — ${sr.error}`);
			} else {
				console.log(`  ✓ ${sr.source}: ${sr.count} events`);
			}
		}

		console.log("\n--- Revalidation ---");
		const appUrl = process.env.NEXT_PUBLIC_APP_URL;
		const revalSecret = process.env.REVALIDATION_SECRET;
		if (!appUrl) {
			console.log(
				"NEXT_PUBLIC_APP_URL: not set — skipping revalidation",
			);
		}
		if (!revalSecret) {
			console.log(
				"REVALIDATION_SECRET: not set — skipping revalidation",
			);
		}
		if (appUrl && revalSecret) {
			const hidden =
				revalSecret.length > 4
					? revalSecret.slice(0, 2) + "…" + revalSecret.slice(-2)
					: "***";
			console.log(`App URL: ${appUrl}`);
			console.log(`Secret:  ${hidden}`);
			try {
				const revalidateUrl = `${appUrl}/api/revalidate?secret=${revalSecret}`;
				const revalRes = await fetch(revalidateUrl, {
					method: "POST",
				});
				if (revalRes.ok) {
					console.log("CDN cache revalidated successfully.");
				} else {
					const body = await revalRes
						.text()
						.catch(() => "(could not read body)");
					console.warn(
						`Revalidation returned HTTP ${revalRes.status}: ${body}`,
					);
				}
			} catch (err) {
				console.warn(
					"Revalidation request failed (server not reachable?):",
					err,
				);
			}
		}

		console.log(`\nPipeline completed in ${elapsed}s.`);
	} catch (err) {
		console.error("\nFatal pipeline error:", err);
		process.exit(1);
	}
}

main();
