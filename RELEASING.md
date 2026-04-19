# Releasing

The app auto-updates via the [Tauri updater plugin](https://v2.tauri.app/plugin/updater/), pulling signed installers from GitHub Releases. Every push of a `v*` tag triggers [.github/workflows/release.yml](.github/workflows/release.yml), which builds the NSIS installer, signs the updater manifest, and publishes both to a new GitHub Release.

## One-time setup

### 1. Generate a signing key pair

The dev key currently committed to [tauri.conf.json](src-tauri/tauri.conf.json) (`plugins.updater.pubkey`) was generated without a password for scaffolding. **Regenerate before your first real release** so the private key stays on your machine.

```bash
pnpm tauri signer generate -w ~/.tauri/mission-editor.key
```

The command prints a password prompt, then writes two files:
- `~/.tauri/mission-editor.key` — **private key, never commit or share**
- `~/.tauri/mission-editor.key.pub` — public key (safe to share)

### 2. Replace the public key in the config

Open `~/.tauri/mission-editor.key.pub`, copy its contents, and paste them as the value of `plugins.updater.pubkey` in [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json). Commit that change.

### 3. Add the private key to GitHub Secrets

In the repo on GitHub → Settings → Secrets and variables → Actions → New repository secret:

- `TAURI_SIGNING_PRIVATE_KEY` — paste the contents of `~/.tauri/mission-editor.key`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — the password you set in step 1

## Dry-run before the first real release

Trigger the workflow manually once to validate signing + artifact upload without affecting end users:

1. GitHub → Actions → **Release** → **Run workflow** → accept the default `v0.0.0-dryrun` → Run.
2. When it finishes, the release appears under Releases marked **Draft** (invisible to `releases/latest/download/...`, so installed apps won't try to pull it).
3. Expand the draft and confirm the assets: `*-setup.exe`, `*-setup.nsis.zip`, `*-setup.nsis.zip.sig`, and `latest.json` with a non-empty `signature` field.
4. Delete the draft when done.

## Cutting a release

1. Bump the version in `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` (keep them in sync).
2. Commit: `git commit -am "release: v0.2.0"`
3. Tag: `git tag v0.2.0`
4. Push: `git push && git push --tags`

The workflow picks up the tag, builds the NSIS installer on `windows-latest`, signs `latest.json` with the private key from secrets, and publishes a GitHub Release with both attached. Existing installs check `https://github.com/TomsBack/MissionEditor/releases/latest/download/latest.json` on launch and prompt to update.

## Updater endpoint

The check URL is configured in `plugins.updater.endpoints` of `tauri.conf.json`. GitHub redirects `releases/latest/download/latest.json` to whichever release is marked "latest", so no config change is needed per release.

## If updates stop working

- Verify the public key in `tauri.conf.json` matches the private key used in CI. The updater plugin will reject any signature produced by a different key pair.
- Check the release actually has a `latest.json` asset — the workflow uploads it automatically; absence means the build failed before signing.
- Look at the browser devtools console (F12 in the app) on startup; `update check failed` messages include the underlying error.
