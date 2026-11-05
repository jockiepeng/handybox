import {defineConfig} from 'astro/config';
const repo=process.env.GITHUB_REPOSITORY?.split('/')[1]||'handybox';
const base=process.env.BASE_PATH??(repo.endsWith('.github.io')?'/':`/${repo}/`);
export default defineConfig({output:'static',site:process.env.SITE_URL||'https://jockiepeng.github.io',base,trailingSlash:'always',devToolbar:{enabled:false},vite:{build:{chunkSizeWarningLimit:700}}});
