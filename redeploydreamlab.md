redeploy to dreamlab


● Here's how to set up fairfield.dreamlab-ai.com:

  Step 1: Add CNAME to Fairfield Repo

  In your fairfield repository, create a CNAME file in the root (or public/ if using a build tool):

  # Clone the fairfield repo
  git clone git@github.com:DreamLab-AI/fairfield.git
  cd fairfield

  # Create CNAME file (no extension, just "CNAME")
  echo "fairfield.dreamlab-ai.com" > CNAME

  # Commit and push
  git add CNAME
  git commit -m "Add custom subdomain CNAME"
  git push

  Step 2: Add DNS Record

  In your domain registrar (where you manage dreamlab-ai.com), add:

  | Type  | Name      | Target                |
  |-------|-----------|-----------------------|
  | CNAME | fairfield | dreamlab-ai.github.io |

  Common registrars:

  1. Go to DNS settings
  2. Add record:
    - Type: CNAME
    - Name: fairfield
    - Target: dreamlab-ai.github.io
    - Proxy status: DNS only (gray cloud) initially

  1. Go to Advanced DNS
  2. Add new record:
    - Type: CNAME
    - Host: fairfield
    - Value: dreamlab-ai.github.io. (note trailing dot)

  1. Go to DNS Management
  2. Add record:
    - Type: CNAME
    - Name: fairfield
    - Value: dreamlab-ai.github.io

  Step 3: Configure GitHub Pages

  In the fairfield repo on GitHub:

  1. Go to Settings → Pages
  2. Under "Custom domain", enter: fairfield.dreamlab-ai.com
  3. Click Save
  4. Check Enforce HTTPS (after DNS propagates)

  Step 4: Wait & Verify

  DNS propagation takes 5-30 minutes. Check status:

  # Check DNS propagation
  dig fairfield.dreamlab-ai.com

  # Should return something like:
  # fairfield.dreamlab-ai.com. CNAME dreamlab-ai.github.io.
  # dreamlab-ai.github.io. A 185.199.108.153

  Or use: https://dnschecker.org/#CNAME/fairfield.dreamlab-ai.com

  Step 5: Test

  Once propagated, visit:
  - http://fairfield.dreamlab-ai.com → should redirect to HTTPS
  - https://fairfield.dreamlab-ai.com → your chat app!

  ---
  Which DNS provider do you use? I can give you more specific steps if needed.

───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
> I use Cloudflare for DNS                                                                                                                                                                                                                                                                                                  ↵ send
─────────────────────────────────────────────────────────────────────────────────────────────────