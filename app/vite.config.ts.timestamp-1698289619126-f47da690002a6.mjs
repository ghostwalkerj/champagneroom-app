// vite.config.ts
import { sveltekit } from "file:///Users/joseph/Dev/pcall/app/node_modules/@sveltejs/kit/src/exports/vite/index.js";
import EnvironmentPlugin from "file:///Users/joseph/Dev/pcall/app/node_modules/vite-plugin-environment/dist/index.js";
import { nodePolyfills } from "file:///Users/joseph/Dev/pcall/app/node_modules/vite-plugin-node-polyfills/dist/index.js";
import mkcert from "file:///Users/joseph/Dev/pcall/app/node_modules/vite-plugin-mkcert/dist/mkcert.mjs";
var config = {
  mode: "development",
  plugins: [
    sveltekit(),
    mkcert(),
    EnvironmentPlugin(["MONGO_DB_FIELD_SECRET"]),
    nodePolyfills({
      protocolImports: true
    })
  ],
  resolve: {
    alias: {}
  },
  build: {
    chunkSizeWarningLimit: 16e3,
    rollupOptions: {
      external: ["@web3-onboard/*"]
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  server: {
    https: true,
    fs: {
      // Allow serving files from one level up to the project root
      allow: [".."]
    }
  },
  optimizeDeps: {
    exclude: ["@ethersproject/hash", "wrtc", "http"],
    include: [
      "@web3-onboard/core",
      "js-sha3",
      "@ethersproject/bignumber"
    ],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis"
      }
    }
  }
};
var vite_config_default = config;
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvam9zZXBoL0Rldi9wY2FsbC9hcHBcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9qb3NlcGgvRGV2L3BjYWxsL2FwcC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvam9zZXBoL0Rldi9wY2FsbC9hcHAvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBzdmVsdGVraXQgfSBmcm9tICdAc3ZlbHRlanMva2l0L3ZpdGUnO1xuaW1wb3J0IHR5cGUgeyBVc2VyQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgRW52aXJvbm1lbnRQbHVnaW4gZnJvbSAndml0ZS1wbHVnaW4tZW52aXJvbm1lbnQnO1xuaW1wb3J0IHsgbm9kZVBvbHlmaWxscyB9IGZyb20gJ3ZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzJ1xuaW1wb3J0IG1rY2VydCBmcm9tJ3ZpdGUtcGx1Z2luLW1rY2VydCdcblxuY29uc3QgY29uZmlnOiBVc2VyQ29uZmlnID0ge1xuICBtb2RlOiAnZGV2ZWxvcG1lbnQnLFxuICBwbHVnaW5zOiBbXG4gICAgc3ZlbHRla2l0KCksXG4gICAgbWtjZXJ0KCksXG4gICAgRW52aXJvbm1lbnRQbHVnaW4oWydNT05HT19EQl9GSUVMRF9TRUNSRVQnXSksXG4gICAgbm9kZVBvbHlmaWxscyh7XG4gICAgICBwcm90b2NvbEltcG9ydHM6IHRydWUsXG4gICAgfSksXG5cbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG5cbiAgICB9XG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxNjAwMCxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBleHRlcm5hbDogWydAd2ViMy1vbmJvYXJkLyonXSxcblxuICAgIH0sXG4gICAgY29tbW9uanNPcHRpb25zOiB7XG4gICAgICB0cmFuc2Zvcm1NaXhlZEVzTW9kdWxlczogdHJ1ZVxuICAgIH1cbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgaHR0cHM6IHRydWUsXG4gICAgZnM6IHtcbiAgICAgIC8vIEFsbG93IHNlcnZpbmcgZmlsZXMgZnJvbSBvbmUgbGV2ZWwgdXAgdG8gdGhlIHByb2plY3Qgcm9vdFxuICAgICAgYWxsb3c6IFsnLi4nXSxcbiAgICB9LFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbJ0BldGhlcnNwcm9qZWN0L2hhc2gnLCAnd3J0YycsICdodHRwJ10sXG4gICAgaW5jbHVkZTogW1xuICAgICAgJ0B3ZWIzLW9uYm9hcmQvY29yZScsXG4gICAgICAnanMtc2hhMycsXG4gICAgICAnQGV0aGVyc3Byb2plY3QvYmlnbnVtYmVyJ1xuICAgIF0sXG4gICAgZXNidWlsZE9wdGlvbnM6IHtcbiAgICAgIC8vIE5vZGUuanMgZ2xvYmFsIHRvIGJyb3dzZXIgZ2xvYmFsVGhpc1xuICAgICAgZGVmaW5lOiB7XG4gICAgICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICAgICAgfSxcbiAgICB9XG5cbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbmZpZztcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBbVEsU0FBUyxpQkFBaUI7QUFFN1IsT0FBTyx1QkFBdUI7QUFDOUIsU0FBUyxxQkFBcUI7QUFDOUIsT0FBTyxZQUFXO0FBRWxCLElBQU0sU0FBcUI7QUFBQSxFQUN6QixNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsSUFDUCxVQUFVO0FBQUEsSUFDVixPQUFPO0FBQUEsSUFDUCxrQkFBa0IsQ0FBQyx1QkFBdUIsQ0FBQztBQUFBLElBQzNDLGNBQWM7QUFBQSxNQUNaLGlCQUFpQjtBQUFBLElBQ25CLENBQUM7QUFBQSxFQUVIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPLENBRVA7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCx1QkFBdUI7QUFBQSxJQUN2QixlQUFlO0FBQUEsTUFDYixVQUFVLENBQUMsaUJBQWlCO0FBQUEsSUFFOUI7QUFBQSxJQUNBLGlCQUFpQjtBQUFBLE1BQ2YseUJBQXlCO0FBQUEsSUFDM0I7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixPQUFPO0FBQUEsSUFDUCxJQUFJO0FBQUE7QUFBQSxNQUVGLE9BQU8sQ0FBQyxJQUFJO0FBQUEsSUFDZDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyx1QkFBdUIsUUFBUSxNQUFNO0FBQUEsSUFDL0MsU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxJQUNBLGdCQUFnQjtBQUFBO0FBQUEsTUFFZCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxFQUVGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFROyIsCiAgIm5hbWVzIjogW10KfQo=
