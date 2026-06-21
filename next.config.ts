import type {NextConfig} from 'next';
const config:NextConfig={images:{formats:['image/avif','image/webp'],minimumCacheTTL:2592000},poweredByHeader:false,compress:true,async headers(){return [{source:'/media/:path*',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]},{source:'/uploads/:path*',headers:[{key:'Cache-Control',value:'public, max-age=2592000'}]}]}};
export default config;
