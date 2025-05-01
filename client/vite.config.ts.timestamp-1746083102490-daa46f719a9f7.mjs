// vite.config.ts
import path from "path";
import { createRequire } from "node:module";
import { defineConfig, normalizePath } from "file:///C:/Users/Yigal%20Lim/Desktop/nlp-assignment/conversation-ui/chad-pdf/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Yigal%20Lim/Desktop/nlp-assignment/conversation-ui/chad-pdf/node_modules/@vitejs/plugin-react/dist/index.mjs";
import tailwindcss from "file:///C:/Users/Yigal%20Lim/Desktop/nlp-assignment/conversation-ui/chad-pdf/node_modules/@tailwindcss/vite/dist/index.mjs";
import { viteStaticCopy } from "file:///C:/Users/Yigal%20Lim/Desktop/nlp-assignment/conversation-ui/chad-pdf/node_modules/vite-plugin-static-copy/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Yigal Lim\\Desktop\\nlp-assignment\\conversation-ui\\chad-pdf";
var __vite_injected_original_import_meta_url = "file:///C:/Users/Yigal%20Lim/Desktop/nlp-assignment/conversation-ui/chad-pdf/vite.config.ts";
var require2 = createRequire(__vite_injected_original_import_meta_url);
var pdfjsDistPath = path.dirname(require2.resolve("pdfjs-dist/package.json"));
var cMapsDir = normalizePath(path.join(pdfjsDistPath, "cmaps"));
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: cMapsDir,
          dest: ""
        }
      ]
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxZaWdhbCBMaW1cXFxcRGVza3RvcFxcXFxubHAtYXNzaWdubWVudFxcXFxjb252ZXJzYXRpb24tdWlcXFxcY2hhZC1wZGZcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFlpZ2FsIExpbVxcXFxEZXNrdG9wXFxcXG5scC1hc3NpZ25tZW50XFxcXGNvbnZlcnNhdGlvbi11aVxcXFxjaGFkLXBkZlxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvWWlnYWwlMjBMaW0vRGVza3RvcC9ubHAtYXNzaWdubWVudC9jb252ZXJzYXRpb24tdWkvY2hhZC1wZGYvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgY3JlYXRlUmVxdWlyZSB9IGZyb20gXCJub2RlOm1vZHVsZVwiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBub3JtYWxpemVQYXRoIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tIFwiQHRhaWx3aW5kY3NzL3ZpdGVcIjtcbmltcG9ydCB7IHZpdGVTdGF0aWNDb3B5IH0gZnJvbSBcInZpdGUtcGx1Z2luLXN0YXRpYy1jb3B5XCI7XG5cbmNvbnN0IHJlcXVpcmUgPSBjcmVhdGVSZXF1aXJlKGltcG9ydC5tZXRhLnVybCk7XG5jb25zdCBwZGZqc0Rpc3RQYXRoID0gcGF0aC5kaXJuYW1lKHJlcXVpcmUucmVzb2x2ZShcInBkZmpzLWRpc3QvcGFja2FnZS5qc29uXCIpKTtcbmNvbnN0IGNNYXBzRGlyID0gbm9ybWFsaXplUGF0aChwYXRoLmpvaW4ocGRmanNEaXN0UGF0aCwgXCJjbWFwc1wiKSk7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICB0YWlsd2luZGNzcygpLFxuICAgIHZpdGVTdGF0aWNDb3B5KHtcbiAgICAgIHRhcmdldHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHNyYzogY01hcHNEaXIsXG4gICAgICAgICAgZGVzdDogXCJcIixcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF3WSxPQUFPLFVBQVU7QUFDelosU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxjQUFjLHFCQUFxQjtBQUM1QyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFDeEIsU0FBUyxzQkFBc0I7QUFML0IsSUFBTSxtQ0FBbUM7QUFBZ04sSUFBTSwyQ0FBMkM7QUFPMVMsSUFBTUEsV0FBVSxjQUFjLHdDQUFlO0FBQzdDLElBQU0sZ0JBQWdCLEtBQUssUUFBUUEsU0FBUSxRQUFRLHlCQUF5QixDQUFDO0FBQzdFLElBQU0sV0FBVyxjQUFjLEtBQUssS0FBSyxlQUFlLE9BQU8sQ0FBQztBQUdoRSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixlQUFlO0FBQUEsTUFDYixTQUFTO0FBQUEsUUFDUDtBQUFBLFVBQ0UsS0FBSztBQUFBLFVBQ0wsTUFBTTtBQUFBLFFBQ1I7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInJlcXVpcmUiXQp9Cg==
