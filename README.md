# Aply

A job-swiping app: swipe right to save a job and start an application, swipe left to pass.

There are three separate instances, each on its own branch:

| Instance | Branch | Local address | What it is |
|---|---|---|---|
| **Prod** | `main` | http://localhost:8765 | The original app (`prod/index.html`). Only the owner changes it. |
| **Dev** | `dev` | http://localhost:8767 | The near-final version. |
| **Sandbox** | `sandbox` | http://localhost:8766 | Every experiment, each switchable on or off. |

Sandbox and dev are the production page plus experiments from `shared/`. They read a copy of `prod/index.html` and
patch it in memory, so prod is never edited by them.

## Run it on your computer

Needs Python 3 and Node.

```bash
python serve.py 8765 prod
python serve.py 8766 sandbox --api
python serve.py 8767 dev --api
```

`--api` turns on the back end: real job postings from public employer feeds (`jobs_api.py`) and application delivery
(`apply_api.py`). By default applications go to a simulated inbox at `/outbox` and nothing leaves your computer.

To email real recruiters, copy `aply-config.example.json` to `aply-config.json` and add your own mail login. That file
and the `data/` folder are ignored by git and must never be committed.

## Making a change

1. Branch from `sandbox` (for example `git checkout -b my-idea sandbox`), or fork the repository.
2. Edit the files in `shared/` (experiments), `sandbox/` or `dev/` (the two pages), or the Python back end.
3. Run `node check.js`. It checks every file for syntax errors and confirms every experiment still applies.
4. Push and open a pull request into `sandbox`. The same checks run automatically on the pull request.
5. The owner reviews and merges. Changes move up one step at a time: `sandbox`, then `dev`, then `main`.

A push to `sandbox` or `dev` also republishes that hosted page (see below). Nothing is published from `main`.

## Hosted copies

`.github/workflows/pages.yml` publishes `/sandbox/` and `/dev/` on GitHub Pages after each push to those branches.
A static host cannot run the Python back end, so the hosted copies use the example jobs only.
Real jobs and application sending need `serve.py --api` running somewhere.

## One-time repository setup (owner)

1. Create an empty repository on GitHub, then:
   ```bash
   git remote add origin https://github.com/YOUR-NAME/aply.git
   git push -u origin main dev sandbox
   ```
2. Settings, Pages: set the source to **GitHub Actions**.
3. Settings, Branches: protect `main`, `dev` and `sandbox` (require a pull request and a passing "Check the code").
4. Who can change things:
   - **Anyone with the link, by proposal:** make the repository public. Anyone can fork it and open a pull request,
     but only you can merge.
   - **Trusted people, directly:** Settings, Collaborators, invite them. They can push branches and open pull requests.
   - Do not give strangers direct write access. This code can send email and handles applicants' details.
