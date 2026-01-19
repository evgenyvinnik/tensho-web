import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // React Compiler is experimental - uncomment when using React 19+
      // babel: {
      //   plugins: [
      //     ['babel-plugin-react-compiler', {}],
      //   ],
      // },
    }),
  ],
})
