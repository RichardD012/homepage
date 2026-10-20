# Bindery fork

This is RichardD012/homepage (remote `fork`), a fork of gethomepage/homepage (remote `origin`, no push access). It exists only to ship the custom Bindery service widget (`src/widgets/bindery/`).

## Release model

- `main` on the fork = latest upstream release tag + the fork's patch commits (Bindery widget, ghcr-only Docker publishing, this file and the sync script).
- A release is a tag `v<upstream version>-bindery` (e.g. `v2.6.0-bindery`). Pushing it makes the fork's Docker CI build `ghcr.io/richardd012/homepage:<tag>`. There are no GitHub Releases.
- `dev` on the fork = upstream `dev` + fork-only commits (e.g. the Crowdin workflow removal). It is the default branch, so scheduled workflows run from it.

## "Do I need to do a release?" / "Am I behind?"

Run `scripts/bindery-sync.sh --check` and answer from its output: if it says RELEASE NEEDED, say which upstream version is out, which -bindery version is current, and offer to run `scripts/bindery-sync.sh --yes`. Don't answer with dev ahead/behind counts.

`scripts/bindery-sync.sh` (no flags) does everything: rebases fork `dev` onto upstream `dev` and pushes it, then if upstream has a newer release, rebuilds `main` on that tag with the patches, resolves the expected `public/locales/en/common.json` conflict (keeps both blocks), runs `pnpm test`, pushes `main` with `--force-with-lease`, and pushes the new `-bindery` tag.
