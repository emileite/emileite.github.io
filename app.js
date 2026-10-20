'use strict';

(() => {
  const REPO_API = 'https://api.github.com/repos/emileite/turbo-imap';
  const RELEASE_API = `${REPO_API}/releases/latest`;
  const numberFormat = new Intl.NumberFormat('en');
  const dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

  const byId = (id) => document.getElementById(id);

  const setText = (id, value) => {
    const element = byId(id);
    if (element) element.textContent = value;
  };

  const setLink = (id, href) => {
    const element = byId(id);
    if (element) element.href = href;
  };

  const formatNumber = (value) =>
    Number.isFinite(value) ? numberFormat.format(value) : '—';

  const formatDate = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : dateFormat.format(parsed);
  };

  async function getJSON(url) {
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    return response.json();
  }

  async function loadGitHub() {
    const status = byId('github-status');

    try {
      const [repo, release] = await Promise.all([
        getJSON(REPO_API),
        getJSON(RELEASE_API)
      ]);

      setText('gh-stars', formatNumber(repo.stargazers_count));
      setText('gh-forks', formatNumber(repo.forks_count));
      setText('gh-issues', formatNumber(repo.open_issues_count));
      setText('gh-license', repo.license?.spdx_id || 'MIT');
      setText('gh-updated', formatDate(repo.pushed_at));

      const releaseTag = release.tag_name || '—';
      setText('gh-release', releaseTag);
      setText('hero-release', releaseTag);

      const releaseDate = formatDate(release.published_at);
      setText(
        'hero-release-date',
        releaseDate === '—' ? 'Latest public release' : `Published ${releaseDate}`
      );

      if (release.html_url) {
        setLink('gh-release', release.html_url);
        setLink('hero-release-link', release.html_url);
      }

      if (status) {
        status.textContent = `Live data from GitHub · last push ${formatDate(repo.pushed_at)}.`;
      }
    } catch (error) {
      console.warn('Could not load live GitHub data:', error);
      if (status) {
        status.textContent =
          'Live GitHub data is unavailable right now. The latest known values are shown below.';
      }
    }
  }

  function setYear() {
    const year = byId('year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function init() {
    setYear();
    loadGitHub();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
