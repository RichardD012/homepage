#!/usr/bin/env bash
# One-stop maintenance for the RichardD012/homepage fork.
#   scripts/bindery-sync.sh          sync fork dev with upstream, report whether a release is needed, prompt to cut it
#   scripts/bindery-sync.sh --yes    same, cut the release without prompting
#   scripts/bindery-sync.sh --check  report only, change nothing
set -euo pipefail
export GIT_PAGER=cat

# Release step checks out other commits, which rewrites this file mid-run; execute from a temp copy.
if [ -z "${BINDERY_SYNC_COPY:-}" ]; then
  tmp=$(mktemp)
  cp "$0" "$tmp"
  BINDERY_SYNC_COPY=1 exec bash "$tmp" "$@"
fi

mode=prompt
case "${1:-}" in
  --yes) mode=yes ;;
  --check) mode=check ;;
  "") ;;
  *) echo "Usage: $0 [--yes|--check]"; exit 2 ;;
esac

cd "$(git rev-parse --show-toplevel)"

git remote get-url fork >/dev/null 2>&1 || git remote add fork git@github.com:RichardD012/homepage.git
git fetch -q origin --tags
git fetch -q fork --tags

upstream=$(git ls-remote --tags --refs origin 'v*' | awk -F/ '{print $3}' | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1)
current=$(git ls-remote --tags --refs fork 'v*-bindery' | awk -F/ '{print $3}' | sort -V | tail -1)
base=${current%-bindery}

echo "== dev"
echo "fork/dev: $(git rev-list --count fork/dev..origin/dev) behind upstream, fork-only commits:"
git log --oneline origin/dev..fork/dev

echo
echo "== release"
echo "Upstream latest: $upstream"
echo "Fork latest:     $current"
release_needed=0
if [ "$base" = "$upstream" ]; then
  echo "Up to date, no release needed."
else
  release_needed=1
  echo "RELEASE NEEDED -> ${upstream}-bindery. Patches to carry ($base..fork/main):"
  git log --oneline --reverse "$base..fork/main"
fi

[ "$mode" = check ] && exit 0

[ -z "$(git status --porcelain)" ] || { echo "Working tree dirty; commit or stash first."; exit 1; }
start_branch=$(git rev-parse --abbrev-ref HEAD)
trap 'git checkout -q "$start_branch" 2>/dev/null || true' EXIT

echo
echo "== syncing fork dev onto upstream dev"
old_dev=$(git rev-parse fork/dev)
git checkout -q dev
if git cherry dev fork/dev | grep -q '^+'; then
  echo "fork/dev has commits missing from local dev:"; git cherry -v dev fork/dev | grep '^+'
  echo "Bring them into local dev first."; exit 1
fi
git branch -q --set-upstream-to=fork/dev dev
git rebase origin/dev
git push --force-with-lease="dev:$old_dev" fork dev

[ "$release_needed" = 1 ] || exit 0

if [ "$mode" = prompt ]; then
  read -r -p "Cut ${upstream}-bindery now? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || exit 0
fi

echo
echo "== building ${upstream}-bindery"
old_main=$(git rev-parse fork/main)
git checkout -q -B bindery-release "$upstream"
for c in $(git rev-list --reverse "$base..fork/main"); do
  if ! git cherry-pick "$c"; then
    # Expected: upstream appends a widget block at the end of common.json, same spot as "bindery". Keep both.
    if [ "$(git diff --name-only --diff-filter=U)" = "public/locales/en/common.json" ]; then
      python3 - <<'EOF'
import re, json
p = 'public/locales/en/common.json'
s = re.sub(r'<<<<<<< [^\n]*\n(.*?)=======\n(.*?)>>>>>>> [^\n]*\n',
           lambda m: m.group(1) + '    },\n' + m.group(2), open(p).read(), flags=re.S)
json.loads(s)
open(p, 'w').write(s)
EOF
      git add public/locales/en/common.json
      GIT_EDITOR=true git cherry-pick --continue
    else
      trap - EXIT
      echo "Unexpected conflict in $(git log -1 --format='%h %s' "$c"). Resolve, 'git cherry-pick --continue', finish the remaining picks, then: pnpm test && git push --force-with-lease=main:$old_main fork HEAD:main && git tag ${upstream}-bindery && git push fork ${upstream}-bindery"
      exit 1
    fi
  fi
done

pnpm install --frozen-lockfile
pnpm test

git push --force-with-lease="main:$old_main" fork HEAD:main
git tag "${upstream}-bindery"
git push fork "${upstream}-bindery"
git branch -q -D bindery-release 2>/dev/null || true
echo "Released ${upstream}-bindery -> ghcr.io/richardd012/homepage:${upstream}-bindery (built by Docker CI on the fork)."
