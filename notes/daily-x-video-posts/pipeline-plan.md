# Daily X Video Posts — Pipeline Plan

## The Pipeline
1. **Script generation** — AI writes a daily 20-sec stock tip script
2. **HeyGen API call** — generates avatar video from script
3. **Wait for video to render** (~2-5 min)
4. **Download the video**
5. **Generate X post text + hashtags**
6. **Post to X via API**
7. **Run this daily on a cron schedule**

## What You Need

### HeyGen API Key
- Check if your plan includes API access (it's separate from the web UI)
- Usually requires Enterprise or a paid API plan
- Needed to programmatically generate avatar videos

### X/Twitter API Access
- Need a developer account to post programmatically
- Apply at: developer.x.com
- ✅ Already have keys (see third-brain/2026-02-13-x-api-keys.md)

### Server to Run the Cron
- **Railway** can do this (already have backend there)
- Or a simple **GitHub Action** on a schedule
- Or OpenClaw cron job orchestrating the whole flow
