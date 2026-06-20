import { runIngestionPipeline } from '../services/ingestion';

async function main() {
  console.log('=== Weekends Plan — Event Ingestion Pipeline ===');
  console.log(`Started at: ${new Date().toISOString()}\n`);

  try {
    const result = await runIngestionPipeline();

    console.log('\n=== Ingestion Summary ===');
    console.log(`Sources attempted: ${result.sourceResults.length}`);
    console.log(`Total fetched (pre-dedup): ${result.totalFetched}`);
    console.log(`Total unique (post-dedup): ${result.totalUnique}`);
    console.log(`DB inserted: ${result.inserted}`);
    console.log(`DB updated: ${result.modified}`);

    for (const sr of result.sourceResults) {
      const status = sr.error ? `FAILED: ${sr.error}` : `${sr.count} events`;
      console.log(`  ${sr.source}: ${status}`);
    }

    if (process.env.NEXT_PUBLIC_APP_URL && process.env.REVALIDATION_SECRET) {
      try {
        const revalidateUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate?secret=${process.env.REVALIDATION_SECRET}`;
        const revalRes = await fetch(revalidateUrl, { method: 'POST' });
        if (revalRes.ok) {
          console.log('\nCDN cache revalidated successfully.');
        } else {
          console.warn(`\nCache revalidation returned HTTP ${revalRes.status}`);
        }
      } catch (err) {
        console.warn('\nCache revalidation skipped (likely no server running):', err);
      }
    }

    console.log('\nPipeline completed successfully.');
  } catch (err) {
    console.error('\nFatal pipeline error:', err);
    process.exit(1);
  }
}

main();
