// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://mo9a7i.github.io',
  base: 'env_to_k8_config_map_secrets_converter',

  vite: {
      plugins: [tailwindcss()]
    },

  integrations: [react(), mdx()]
});