// vite.config.ts
import { sveltekit } from "file:///Users/joseph/Dev/pcall/app/node_modules/@sveltejs/kit/src/exports/vite/index.js";
import { nodePolyfills } from "file:///Users/joseph/Dev/pcall/app/node_modules/vite-plugin-node-polyfills/dist/index.js";
var config = {
  mode: "development",
  plugins: [
    sveltekit(),
    nodePolyfills({
      // To exclude specific polyfills, add them to this list.
      exclude: [
        "fs"
        // Excludes the polyfill for `fs` and `node:fs`.
      ],
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true
    })
  ],
  ssr: {
    //noExternal: ['chart.js/**'],
  }
};
var vite_config_default = config;
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvam9zZXBoL0Rldi9wY2FsbC9hcHBcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9qb3NlcGgvRGV2L3BjYWxsL2FwcC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvam9zZXBoL0Rldi9wY2FsbC9hcHAvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBzdmVsdGVraXQgfSBmcm9tICdAc3ZlbHRlanMva2l0L3ZpdGUnO1xuaW1wb3J0IHR5cGUgeyBVc2VyQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgeyBub2RlUG9seWZpbGxzIH0gZnJvbSAndml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMnO1xuXG5jb25zdCBjb25maWc6IFVzZXJDb25maWcgPSB7XG4gIG1vZGU6ICdkZXZlbG9wbWVudCcsXG4gIHBsdWdpbnM6IFtcbiAgICBzdmVsdGVraXQoKSxcbiAgICBub2RlUG9seWZpbGxzKHtcbiAgICAgIC8vIFRvIGV4Y2x1ZGUgc3BlY2lmaWMgcG9seWZpbGxzLCBhZGQgdGhlbSB0byB0aGlzIGxpc3QuXG4gICAgICBleGNsdWRlOiBbXG4gICAgICAgICdmcycsIC8vIEV4Y2x1ZGVzIHRoZSBwb2x5ZmlsbCBmb3IgYGZzYCBhbmQgYG5vZGU6ZnNgLlxuICAgICAgXSxcbiAgICAgIC8vIFdoZXRoZXIgdG8gcG9seWZpbGwgYG5vZGU6YCBwcm90b2NvbCBpbXBvcnRzLlxuICAgICAgcHJvdG9jb2xJbXBvcnRzOiB0cnVlLFxuICAgIH0pLFxuICBdLFxuICBzc3I6IHtcbiAgICAvL25vRXh0ZXJuYWw6IFsnY2hhcnQuanMvKionXSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbmZpZztcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBbVEsU0FBUyxpQkFBaUI7QUFFN1IsU0FBUyxxQkFBcUI7QUFFOUIsSUFBTSxTQUFxQjtBQUFBLEVBQ3pCLE1BQU07QUFBQSxFQUNOLFNBQVM7QUFBQSxJQUNQLFVBQVU7QUFBQSxJQUNWLGNBQWM7QUFBQTtBQUFBLE1BRVosU0FBUztBQUFBLFFBQ1A7QUFBQTtBQUFBLE1BQ0Y7QUFBQTtBQUFBLE1BRUEsaUJBQWlCO0FBQUEsSUFDbkIsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLEtBQUs7QUFBQTtBQUFBLEVBRUw7QUFDRjtBQUVBLElBQU8sc0JBQVE7IiwKICAibmFtZXMiOiBbXQp9Cg==
