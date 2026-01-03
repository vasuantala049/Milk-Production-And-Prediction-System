// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'


// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
// })

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    https: {
      key: fs.readFileSync(
        path.resolve(__dirname,  "cert/192.168.101.220-key.pem")
      ),
      cert: fs.readFileSync(
        path.resolve(__dirname, "cert/192.168.101.220.pem")
      ),
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
