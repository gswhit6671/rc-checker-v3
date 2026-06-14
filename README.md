# Report Card Checker

A professional, browser-based proofreading tool for whole-class IB PYP report card sets.

## What it checks

- **Names and pronouns** — wrong student name in a comment (copy-paste errors), pronoun inconsistency within a comment
- **Spelling** — common spelling errors, UK/US consistency across the document
- **Grammar** — missing articles (a/an), compound-adjective hyphens
- **Punctuation and spacing** — missing space after full stop, extra spaces, extra full stops
- **Tone** — sensitive or negative wording that should be softened for a parent-facing report
- **First-person wording** — "we," "our," "I" when third-person writing is preferred
- **Wordiness and clarity** — overly formal phrases, jargon that may confuse EAL parents
- **Duplication and contradiction** — repeated phrases, contradictory ability statements, double transitions
- **Comment/level alignment** — comment wording that does not match the selected level (only when levels are visible)

## What it does NOT check

- IB Learner Profile attributes (not a proofreading check)
- ATL skills (not a proofreading check)
- Subject content accuracy

## How to use

1. Go to the website
2. Optionally open **Settings** to set spelling style, class name, and paste a class list
3. Upload a `.pdf` or `.docx` whole-class report file
4. Click **Check Report Cards**
5. Review the feedback tables
6. Download as PDF, HTML, or CSV

## Privacy

Everything runs in your browser. No file is ever uploaded to any server. Student data never leaves your device.

## Accuracy rule

The checker is conservative — it only flags issues it is highly confident about. It is better to miss a small issue than to give confusing or wrong feedback.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure and upload UI |
| `styles.css` | Styling |
| `script.js` | All checking logic |
| `README.md` | This file |
| `.github/workflows/deploy.yml` | Auto-deploy to GitHub Pages |

## How to publish to GitHub Pages

### Step 1 — Create a new repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **+** button (top right) → **New repository**
3. Name it: `rc-checker` (or any name you like)
4. Set it to **Public**
5. Do **not** add a README (you already have one)
6. Click **Create repository**

### Step 2 — Upload the files

**Option A — Upload via the GitHub website:**
1. In your new empty repository, click **uploading an existing file**
2. Drag all four files into the upload area: `index.html`, `styles.css`, `script.js`, `README.md`
3. Also upload the `.github/workflows/deploy.yml` file (create the folder path manually if needed)
4. Click **Commit changes**

**Option B — Use Git (if you have Git installed):**
```bash
cd /path/to/report-card-checker-v3
git init
git add .
git commit -m "Initial commit: Report Card Checker"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/rc-checker.git
git push -u origin main
```

### Step 3 — Turn on GitHub Pages

1. In your repository, go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The deploy workflow runs automatically on every push to `main`

### Step 4 — Get your public link

After the first deploy completes (about 1–2 minutes):

```
https://YOUR-USERNAME.github.io/rc-checker/
```

Replace `YOUR-USERNAME` with your GitHub username and `rc-checker` with your repository name.

You can check deploy status under the **Actions** tab in your repository.
