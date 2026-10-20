'use strict';

(() => {
  const USER = 'emileite';
  const API = 'https://api.github.com';
  const PROFILE_API = `${API}/users/${USER}`;
  const REPOS_API = `${API}/users/${USER}/repos?per_page=100&sort=updated`;
  const TURBO_API = `${API}/repos/${USER}/turbo-imap`;
  const RELEASE_API = `${TURBO_API}/releases/latest`;

  const numberFormat = new Intl.NumberFormat('en');
  const dateFormat = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const joinedFormat = new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric'
  });

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

  const formatJoined = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : joinedFormat.format(parsed);
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

  function setAvatar(id, url) {
    const image = byId(id);
    if (!image || !url) return;

    image.onerror = () => {
      image.onerror = null;
      image.src = 'logo.png';
    };

    image.src = url;
  }

  function renderProfile(user) {
    const name = user.name || user.login || USER;

    setAvatar('profile-avatar', user.avatar_url);
    setAvatar('header-avatar', user.avatar_url);

    const profileAvatar = byId('profile-avatar');
    if (profileAvatar) {
      profileAvatar.alt = `${name} GitHub avatar`;
    }

    setText('profile-name', name);
    setText('profile-handle', `@${user.login || USER}`);
    setText(
      'profile-bio',
      user.bio || 'Open-source projects, tools and experiments.'
    );
    setText('profile-repos', formatNumber(user.public_repos));
    setText('profile-followers', formatNumber(user.followers));
    setText('profile-following', formatNumber(user.following));
    setText(
      'profile-joined',
      user.created_at ? `Joined ${formatJoined(user.created_at)}` : 'Joined —'
    );

    setText('gh-repos', formatNumber(user.public_repos));
    setText('gh-followers', formatNumber(user.followers));
    setText('gh-following', formatNumber(user.following));

    if (user.html_url) setLink('profile-link', user.html_url);

    const details = [user.company, user.location, user.blog].filter(Boolean);
    const extra = byId('profile-extra');
    if (extra) {
      extra.textContent = details.join(' · ');
      extra.hidden = details.length === 0;
    }
  }

  function repoCard(repo) {
    const card = document.createElement('article');
    card.className = 'repo-card';

    const head = document.createElement('div');
    head.className = 'repo-head';

    const name = document.createElement('a');
    name.className = 'repo-name';
    name.href = repo.html_url;
    name.target = '_blank';
    name.rel = 'noopener';
    name.textContent = repo.name;
    head.append(name);

    if (repo.fork) {
      const fork = document.createElement('span');
      fork.className = 'repo-badge';
      fork.textContent = 'Fork';
      head.append(fork);
    }

    if (repo.archived) {
      const archived = document.createElement('span');
      archived.className = 'repo-badge';
      archived.textContent = 'Archived';
      head.append(archived);
    }

    const description = document.createElement('p');
    description.className = 'repo-desc';
    description.textContent = repo.description || 'No description provided.';

    const meta = document.createElement('div');
    meta.className = 'repo-meta';

    const metadata = [];

    if (repo.language) {
      const language = document.createElement('span');
      language.className = 'repo-language';
      language.textContent = repo.language;
      metadata.push(language);
    }

    const stars = document.createElement('span');
    stars.className = 'repo-stat';
    stars.textContent = `Stars ${formatNumber(repo.stargazers_count)}`;
    metadata.push(stars);

    const forks = document.createElement('span');
    forks.className = 'repo-stat';
    forks.textContent = `Forks ${formatNumber(repo.forks_count)}`;
    metadata.push(forks);

    const updated = document.createElement('span');
    updated.className = 'repo-updated';
    updated.textContent = `Updated ${formatDate(repo.pushed_at || repo.updated_at)}`;
    metadata.push(updated);

    metadata.forEach((item, index) => {
      if (index > 0) {
        const separator = document.createElement('span');
        separator.className = 'visually-hidden';
        separator.textContent = ' · ';
        meta.append(separator);
      }
      meta.append(item);
    });

    card.append(head, description, meta);
    return card;
  }

  function renderRepos(repos) {
    const list = byId('repo-list');
    const status = byId('repos-status');
    if (!list) return;

    list.replaceChildren();

    if (!Array.isArray(repos) || repos.length === 0) {
      if (status) status.textContent = 'No public repositories found.';
      return;
    }

    const sorted = [...repos].sort((first, second) => {
      const stars = second.stargazers_count - first.stargazers_count;
      if (stars !== 0) return stars;
      return new Date(second.pushed_at) - new Date(first.pushed_at);
    });

    const totalStars = sorted.reduce(
      (sum, repo) => sum + (repo.stargazers_count || 0),
      0
    );
    setText('gh-stars', formatNumber(totalStars));

    if (status) {
      status.textContent = `${formatNumber(sorted.length)} public ${
        sorted.length === 1 ? 'repository' : 'repositories'
      }, sorted by stars.`;
    }

    for (const repo of sorted) {
      list.append(repoCard(repo));
    }
  }

  function renderRepoError() {
    const status = byId('repos-status');
    if (status) {
      status.textContent =
        'Repository data is unavailable right now. Open the profile on GitHub to see all repositories.';
    }
  }

  function renderFeatured(repo, release) {
    if (repo) {
      setText('featured-stars', formatNumber(repo.stargazers_count));
      setText('featured-forks', formatNumber(repo.forks_count));
      setText('featured-language', repo.language || '—');
    }

    if (release?.tag_name) {
      setText('featured-release', release.tag_name);
    }

    if (release?.html_url) {
      setLink('featured-release', release.html_url);
      setLink('featured-release-link', release.html_url);
    }
  }

  async function loadGitHub() {
    const status = byId('github-status');
    const requests = await Promise.allSettled([
      getJSON(PROFILE_API),
      getJSON(REPOS_API),
      getJSON(TURBO_API),
      getJSON(RELEASE_API)
    ]);

    const [userResult, reposResult, turboResult, releaseResult] = requests;

    if (userResult.status === 'fulfilled') {
      renderProfile(userResult.value);
    }

    if (reposResult.status === 'fulfilled') {
      renderRepos(reposResult.value);
    } else {
      renderRepoError();
    }

    renderFeatured(
      turboResult.status === 'fulfilled' ? turboResult.value : null,
      releaseResult.status === 'fulfilled' ? releaseResult.value : null
    );

    const failures = requests.filter((result) => result.status === 'rejected');

    if (status) {
      if (failures.length === 0) {
        status.textContent = 'Live GitHub data from github.com/emileite.';
      } else if (failures.length < requests.length) {
        status.textContent = 'Some live GitHub data could not be loaded.';
      } else {
        status.textContent =
          'Live GitHub data is unavailable right now. Open the profile on GitHub.';
      }
    }

    if (failures.length > 0) {
      console.warn('Some GitHub API requests failed:', failures);
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
