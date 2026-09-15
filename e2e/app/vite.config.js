export default {
  build: {
    // the full entry intentionally bundles all ~1.5 MB of data
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      input: { full: 'full.html', top10: 'top10.html' },
    },
  },
}
