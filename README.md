# emileite.github.io

GitHub Pages root site for Turbo IMAP.

- `index.html` is the root landing page. It shows live repository data (stars, forks,
  open issues/PRs, latest release, license and last push) from the GitHub API.
- `privacy.html` and `privacy.pt.html` contain the English and Portuguese privacy and
  cookies policies.
- `ads.txt` exposes the AdSense seller record at
  `https://emileite.github.io/ads.txt`.
- `consent.js` shows the cookie banner, stores the choice in local storage for 180 days
  and only loads Google Analytics/AdSense after acceptance.
- `sitemap.xml` covers the root and privacy pages.
- The full project site is at https://emileite.github.io/turbo-imap/ and the source is
  https://github.com/emileite/turbo-imap.

## Local preview

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/.
