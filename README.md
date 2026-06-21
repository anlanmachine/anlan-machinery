# ANLAN Machinery Website

Production-ready B2B construction machinery export website for ANLAN Machinery.

The project includes the full website source code, local product database, local product images, imported company/factory/shipping/customer media, SEO pages, generated blog content, sitemap, robots configuration, admin product manager, and WhatsApp inquiry flow.

## Tech stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Express custom server for local/Node hosting
- JSON local storage for products and media
- Sharp + FFmpeg for media processing
- Optional Supabase and Resend integrations

## Main pages

- `/` Home
- `/about` About Us
- `/products` Products overview
- `/products/excavator`
- `/products/loader`
- `/products/roller`
- `/products/motor-grader`
- `/products/concrete-mixer`
- `/case-studies` Cases
- `/factory` Factory
- `/shipping` Shipping
- `/blog` Blog
- `/media` Media Center
- `/gallery` Gallery
- `/downloads` Downloads
- `/contact` Contact
- `/admin` Admin product manager

## What is included

- Product data: `data/products.json`
- Media index: `data/media.json`
- Local product images: `public/uploads/`
- Local website images/videos: `public/media/`
- SEO sitemap: `app/sitemap.ts`
- Robots configuration: `app/robots.ts`
- Product API for Node hosting: `server.js`
- Product API for Vercel/Next hosting: `app/api/products/route.ts`
- Admin product CRUD API: `app/api/admin/products/route.ts`
- Admin image upload API: `app/api/admin/upload/route.ts`

## Installation

Install Node.js 20 or newer, then run:

```bash
npm install
```

Create environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Then edit `.env.local` and fill the required values.

## Local development

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:3010
```

The custom Express server listens on port `3010` by default. You can change it with:

```bash
PORT=3000 npm run dev
```

On Windows PowerShell:

```powershell
$env:PORT=3000
npm run dev
```

## Production build

Run:

```bash
npm run build
```

Start production server:

```bash
npm run start
```

Default production URL:

```text
http://localhost:3010
```

## Environment variables

Copy `.env.example` to `.env.local`.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public website URL, for SEO canonical URLs and metadata. Example: `https://anlanmachinery.com` |
| `ADMIN_PASSWORD` | Yes | Password for `/admin`. Change before public deployment. |
| `LEADS_TO_EMAIL` | Optional | Email address that receives inquiry notifications. |
| `RESEND_API_KEY` | Optional | Enables email sending through Resend. |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL if using Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Supabase server key for protected server operations. |
| `OPENAI_API_KEY` | Optional | Reserved for future AI-assisted content tools. |
| `RECAPTCHA_SECRET_KEY` | Optional | Server-side CAPTCHA verification key. |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Optional | Client-side CAPTCHA site key. |

## Updating products

Use the admin page:

```text
/admin
```

Default password is controlled by `ADMIN_PASSWORD`.

Admin supports:

- Add product
- Edit product
- Delete product
- Upload product cover image
- Save products into `data/products.json`
- Store uploaded images under `public/uploads/admin/`

For direct file updates:

1. Edit `data/products.json`.
2. Put images in `public/uploads/`.
3. Use local image paths such as `/uploads/xcmg/XE215G-1.jpg`.
4. Run `npm run build`.
5. Deploy again.

## Updating website media

Source media can be re-imported from a local folder:

```bash
npm run ingest:media
```

Default source folder:

```text
E:\信息
```

Custom source folder:

```bash
MEDIA_SOURCE="/path/to/media" npm run ingest:media
```

On Windows PowerShell:

```powershell
$env:MEDIA_SOURCE="E:\信息"
npm run ingest:media
```

The script scans images/videos/documents, classifies company/factory/shipping/customer materials, compresses images to WebP, converts videos to browser-friendly MP4, creates video posters, updates `data/media.json`, and writes optimized assets to `public/media/`.

## Updating blog content

Blog articles are generated from the product catalog in `lib/blog.ts`.

To update the blog:

1. Update products in `data/products.json`.
2. Edit templates in `lib/blog.ts` if needed.
3. Run `npm run build`.
4. Check `/blog` and `/sitemap.xml`.

## Deployment to Vercel

Recommended for easiest global deployment.

1. Push this project to GitHub.
2. Open Vercel and click **Add New Project**.
3. Import the GitHub repository.
4. Set Framework Preset to **Next.js**.
5. Build command: `npm run build`
6. Install command: `PUPPETEER_SKIP_DOWNLOAD=true npm install`
7. Output directory: `.next`
8. Node.js version: `20.x`
9. Add environment variables from `.env.example`.
10. Set `NEXT_PUBLIC_SITE_URL` to the Vercel preview URL first, then to the final domain after binding.
11. Deploy.

Notes:

- Vercel uses the Next.js API route `app/api/products/route.ts`.
- The local Express server `server.js` is for traditional Node/VPS hosting.
- Admin file writes on Vercel serverless storage are not permanent. For long-term online admin editing, connect Supabase Storage/database or redeploy after committing JSON/media changes.

## Deployment to a VPS or Node server

1. Upload the project.
2. Run:

```bash
npm install
npm run build
npm run start
```

3. Use Nginx or another reverse proxy:

```nginx
server {
  server_name anlanmachinery.com www.anlanmachinery.com;

  location / {
    proxy_pass http://127.0.0.1:3010;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

4. Enable HTTPS with Certbot or your hosting panel.

## Binding a formal domain

### Vercel

1. Open Vercel Project → Settings → Domains.
2. Add your domain, for example `anlanmachinery.com` and `www.anlanmachinery.com`.
3. Add the DNS records Vercel shows. Usually:

```text
A      @      76.76.21.21
CNAME  www    cname.vercel-dns.com
```

4. Update `NEXT_PUBLIC_SITE_URL` to `https://anlanmachinery.com`.
5. Redeploy.

### Netlify

1. Open Site settings → Domain management.
2. Add the custom domain.
3. Follow Netlify DNS instructions.
4. Update `NEXT_PUBLIC_SITE_URL`.
5. Redeploy.

### VPS

1. Point DNS `A` record to server IP.
2. Configure Nginx reverse proxy.
3. Enable HTTPS.
4. Update `NEXT_PUBLIC_SITE_URL`.
5. Restart the Node process.

## GitHub upload

If Git is installed:

```bash
git init
git add .
git commit -m "Initial ANLAN Machinery website delivery"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

If using GitHub CLI:

```bash
gh repo create YOUR_ACCOUNT/YOUR_REPOSITORY --private --source=. --remote=origin --push
```

Change `--private` to `--public` if the repository should be public.

## SEO

Included SEO features:

- Per-page titles and descriptions
- Open Graph metadata
- Twitter Card metadata
- Canonical URL support through `NEXT_PUBLIC_SITE_URL`
- `sitemap.xml`
- `robots.txt`
- Product/category SEO pages
- 100+ generated SEO blog articles
- Local optimized media paths

After changing the domain, rebuild and verify:

```text
/sitemap.xml
/robots.txt
```

## Pre-launch checklist

- Change `ADMIN_PASSWORD`.
- Set `NEXT_PUBLIC_SITE_URL` to the real domain.
- Verify WhatsApp number: `+86 187 1546 7045`.
- Test inquiry forms.
- Test all main pages.
- Check product images are local paths under `/uploads/`.
- Check media assets are local paths under `/media/`.
- Run Lighthouse on the deployed URL.
- Submit sitemap to Google Search Console.

## Maintenance workflow

For normal updates:

1. Update products/media/blog templates locally.
2. Run `npm run build`.
3. Test pages locally.
4. Commit and push to GitHub.
5. Vercel redeploys automatically.

For emergency text/image changes:

1. Edit through `/admin` locally or update JSON/assets directly.
2. Build and test.
3. Push to GitHub.
4. Redeploy.
