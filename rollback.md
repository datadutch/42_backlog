# Rollback Plan

## Option 1 — Git tags (recommended)

Tag each release before deploying:
```bash
git tag v0.4
git push origin v0.4
```

To roll back, checkout the tag, rebuild, redeploy:
```bash
git checkout v0.4
npm run build && scp -r dist/* bcklg42@shaula.uberspace.de:~/html/
scp server.js bcklg42@shaula.uberspace.de:~/42_backlog/
ssh bcklg42@shaula.uberspace.de "supervisorctl restart 42_backlog-api"
git checkout main  # return to main
```

---

## Option 2 — Keep a previous build on the server

Before each deploy, keep a backup copy on Uberspace:
```bash
ssh bcklg42@shaula.uberspace.de "cp -r ~/html ~/html_backup"
```

To roll back instantly (no rebuild needed):
```bash
ssh bcklg42@shaula.uberspace.de "rm -rf ~/html && mv ~/html_backup ~/html"
```

---

## Option 3 — Data rollback (separate concern)

The JSON state file (`~/42_backlog/data/kanban-state.json`) can get corrupted by bad deploys. Back it up separately:

```bash
# Add to deploy workflow — backup data before each deploy
ssh bcklg42@shaula.uberspace.de "cp ~/42_backlog/data/kanban-state.json ~/42_backlog/data/kanban-state.backup.json"
```

To restore:
```bash
ssh bcklg42@shaula.uberspace.de "cp ~/42_backlog/data/kanban-state.backup.json ~/42_backlog/data/kanban-state.json"
```

---

## Combined deploy script

Add to `package.json`:
```json
"deploy": "git tag -f latest-deploy && git push origin latest-deploy --force && npm run build && ssh bcklg42@shaula.uberspace.de 'cp -r ~/html ~/html_backup && cp ~/42_backlog/data/kanban-state.json ~/42_backlog/data/kanban-state.backup.json' && scp -r dist/* bcklg42@shaula.uberspace.de:~/html/"
```

This gives you a one-command deploy with an automatic backup before every push.

---

**Recommendation:** Use **Option 1 + Option 3** — git tags for code history, data file backup for state. Option 2 is a quick safety net for catching a bad deploy immediately.
