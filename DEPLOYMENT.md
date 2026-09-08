# Production deployment

This guide describes the manually triggered first deployment of the static Astro + Starlight site to `hooks.momagdi.com` on Apache/cPanel.

The protected GitHub `production` environment and jailed SSH account are provisioned. The deployment workflow is intentionally manual and does not run on pushes. It uses cPanel user `hooksmomagdi` and fails closed unless `DEPLOY_PATH` is exactly `/home/hooksmomagdi/public_html`. No DNS, cPanel, SSL, or server changes are performed by GitHub Actions.

## 1. Create the cPanel subdomain

In the target cPanel account:

1. Create the `hooks` subdomain under the approved production domain.
2. Choose a dedicated document root for this site rather than the account root or another application directory.
3. Record the exact document root in the deployment runbook. It becomes `DEPLOY_PATH` only after it has been verified on the server.
4. Confirm that the document root is empty or contains only the intended site files before the first deployment.

Do not reuse a package repository's directory or a broad account-level `public_html` path as the deployment target.

## 2. Create the DNS record

Create the DNS record required by the hosting arrangement, normally an `A` record to the approved server address or a `CNAME` to the approved hosting target. Use the final host value only in the operator's private environment.

Verify that `hooks.momagdi.com` resolves to the intended server before enabling production traffic. This stage has not changed DNS.

## 3. Enable SSL

After DNS points to the intended host, issue and install a certificate for `hooks.momagdi.com` using the host's approved cPanel/ACME process. Verify:

- HTTPS serves the static site;
- the certificate covers the exact hostname;
- HTTP redirects to HTTPS if that is the hosting policy;
- canonical URLs still use `https://hooks.momagdi.com`.

Do not add certificate material, private keys, or account credentials to this repository.

## 4. Create restricted deployment access

Create a dedicated deployment user or an account-scoped SSH key with only the permissions required to update the dedicated document root. Prefer:

- a key restricted to the deployment account and repository workflow;
- no interactive shell or sudo access when the host supports command restrictions;
- ownership and permissions that prevent unrelated sites from being modified;
- a separate read-only or audit path for rollback records;
- host-key verification using a reviewed `known_hosts` entry.

Never commit a private key. Store it only in the GitHub Actions secret configured for the deployment stage.

## 5. Configure the GitHub production secrets

The future deployment workflow may use these repository or environment secrets:

| Secret | Purpose |
| --- | --- |
| `DEPLOY_HOST` | Approved SSH hostname; do not use a placeholder in a live environment |
| `DEPLOY_PORT` | SSH port, normally numeric |
| `DEPLOY_USER` | Restricted deployment user |
| `DEPLOY_PATH` | Verified dedicated document root |
| `DEPLOY_SSH_KEY` | Private key for the restricted deployment identity |
| `DEPLOY_KNOWN_HOSTS` | Pinned SSH host-key data |

These values must exist only as protected secrets in the `production` environment. The workflow rejects empty values, password authentication, any user other than `hooksmomagdi`, and any path other than the dedicated document root.

## 6. Build the site

Build from a clean checkout with Node.js 22 and the committed lockfile:

```bash
npm ci
npm run astro -- check
npm run build
npm run validate
```

The build is static and writes the deployable site to:

```text
dist/
```

Run the preview smoke test locally when the build is available:

```bash
npm run preview:smoke
```

## 7. Deploy only the generated output

The future deployment operation must copy the contents of `dist/` into the verified dedicated document root. Do not copy the repository, `node_modules/`, source Markdown, `.git/`, package lockfiles, private environment files, or development tooling to Apache.

The site has no server-side runtime requirement. Apache serves the generated HTML, CSS, JavaScript, images, sitemap, and robots file as static assets.

Before copying, confirm that the build output is non-empty and contains expected files such as `index.html`, `docs/2.x/index.html`, `sitemap-index.xml`, and `robots.txt`.

## 8. Prevent an empty or root deployment path

The workflow fails closed before any remote modification. It validates that:

- the build directory is exactly the workspace's `dist/` directory;
- `dist/index.html` exists and is non-empty;
- the planned documentation entry page exists;
- `DEPLOY_PATH` is non-empty after variable expansion;
- `DEPLOY_PATH` is an absolute, dedicated site path;
- `DEPLOY_PATH` is not `/`, the account home, the repository root, or a known package-repository path;
- the resolved destination is the expected cPanel document root;
- the destination parent exists and is owned by the restricted deployment user.

The implemented guard additionally requires the provisioned cPanel identity and exact document root:

```bash
set -eu

test -s dist/index.html
test -s dist/docs/2.x/index.html

case "${DEPLOY_PATH:-}" in
  ""|/|/home|*/hooks|*/laravel-hooks|*/hooks-docs)
    echo "Refusing unsafe or empty deployment path" >&2
    exit 1
    ;;
esac

test "${DEPLOY_USER:-}" = hooksmomagdi
test "${DEPLOY_PATH:-}" = /home/hooksmomagdi/public_html

case "${DEPLOY_PATH:-}" in
  /*) ;;
  *) echo "DEPLOY_PATH must be absolute" >&2; exit 1 ;;
esac
```

The real workflow should use an explicit allow-list or a separately verified path rather than trusting an arbitrary secret value.

## 9. Implemented release and backup deployment

`.github/workflows/deploy.yml` implements a release-based deployment without deleting the live document root:

1. Build and validate `dist/` with the complete CI-equivalent sequence.
2. Archive only the contents of `dist/` and upload it to the non-public `/home/hooksmomagdi/.hooks-deploy/incoming` directory.
3. Extract the archive into `/home/hooksmomagdi/.hooks-deploy/releases/<commit-sha>` and verify its required files.
4. Back up existing `public_html` content to `/home/hooksmomagdi/.hooks-deploy/backups/<commit-sha>` when a previous deployment exists.
5. Synchronize the validated release with `rsync --delete` only after all pre-sync checks pass.
6. Record the commit and UTC timestamp under the non-public records directory.
7. Run HTTPS smoke checks before the job succeeds.

The first workflow does not use symlink switching because the exact cPanel atomic-switch capability has not been established. It does not remove old releases or backups. If a failure occurs before synchronization, the live site is not changed.

No `rm -rf` operation is used. The live tree is backed up before synchronization, and release/backup data is retained for manual rollback.

Record the commit SHA, build timestamp, release directory, and rollback target for each approved deployment. Keep only the required number of old releases according to the hosting policy, and remove old releases only after confirming the active target.

## 10. Post-deployment checks

After a future approved deployment, verify:

- `https://hooks.momagdi.com/` loads the Hooks landing page;
- `/docs/2.x/` and every planned documentation route return success;
- canonical URLs and sitemap entries use HTTPS;
- local search, navigation, dark mode, and code blocks work;
- the certificate is valid;
- the document root contains only static build output;
- the rollback release remains available until acceptance is complete.

The workflow performs the build, validation, upload, release extraction, backup, synchronization, and HTTPS smoke checks. It does not configure DNS, cPanel, SSL, or deployment secrets.

## 11. Manual rollback procedure

Rollback is intentionally operator-driven. Do not run it until the failed deployment and target release have been identified.

1. Open the `production` environment and identify the deployment commit from the workflow summary or the non-public record at `/home/hooksmomagdi/.hooks-deploy/records/<commit-sha>.txt`.
2. Connect through the approved jailed SSH account using the same pinned host key. Do not use a password or an unreviewed host key.
3. Inspect the corresponding backup archive under `/home/hooksmomagdi/.hooks-deploy/backups/<commit-sha>/public_html.tar.gz` and confirm it belongs to the previous accepted site.
4. Preserve the current `public_html` tree as an additional operator-named backup. Do not use `rm -rf`.
5. Extract the accepted backup into a temporary directory under `/home/hooksmomagdi/.hooks-deploy/`, verify `index.html` and `docs/2.x/index.html`, then synchronize it into `/home/hooksmomagdi/public_html` with `rsync -a --delete`.
6. Run the HTTPS smoke checks for `/`, `/docs/2.x/`, `/docs/2.x/installation/`, `/docs/2.x/api/`, and a nonexistent route.
7. Record the rollback commit and UTC timestamp in the non-public records directory.

If the backup is missing or corrupted, stop and obtain operator assistance. Never guess a path or restore into the account root.

## Operator handoff checklist

Before implementing a deployment workflow or provisioning the production target, obtain and record all of the following:

- [ ] Approved DNS target: the final `A` or `CNAME` destination for `hooks.momagdi.com`;
- [ ] Exact dedicated cPanel document root: the verified absolute `DEPLOY_PATH`;
- [ ] SSH hostname and port: the approved values for `DEPLOY_HOST` and `DEPLOY_PORT`;
- [ ] Restricted deployment username: the approved `DEPLOY_USER` and its document-root permissions;
- [ ] Deployment authentication method: key-based SSH or another approved mechanism, with no credential committed to Git;
- [ ] Pinned SSH `known_hosts` value: the reviewed `DEPLOY_KNOWN_HOSTS` content for the final host;
- [ ] Atomic deployment capability: confirmation whether the host supports atomic symlink switching or a safe staging/rename alternative;
- [ ] Rollback retention policy: how many previous releases remain available and for how long;
- [ ] GitHub production environment approval settings: required reviewers, branch restrictions, secret scope, and manual approval policy.

Do not add a production deployment workflow until the exact server path and supported atomic-deployment method are known. Do not guess any of these values.
