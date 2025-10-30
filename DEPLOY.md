# Deploying to GitHub Pages

## Quick Deploy

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy Vivid game engine"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click **Settings**
   - Scroll to **Pages** section
   - Under **Source**, select your branch (usually `main`)
   - Under **Folder**, select `/ (root)`
   - Click **Save**

3. **Access Your Game**:
   - Your site will be available at: `https://yourusername.github.io/vivid/`
   - The Time Eater game will be at: `https://yourusername.github.io/vivid/time_eater/`

## Custom Domain (Optional)

1. Add a `CNAME` file to the root with your domain name
2. Configure DNS settings with your domain provider
3. Follow GitHub's [custom domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

## Testing Locally

### Using Python
```bash
cd vivid
python -m http.server 8000
```
Then visit:
- Main page: `http://localhost:8000`
- Time Eater: `http://localhost:8000/time_eater/`

### Using Node.js
```bash
npx http-server vivid -p 8000
```

### Using PHP
```bash
cd vivid
php -S localhost:8000
```

## Troubleshooting

### Game Won't Load
- Check browser console for errors (F12)
- Ensure all JSON files are valid (use jsonlint.com)
- Verify file paths are correct (case-sensitive on Linux/GitHub)

### Images Not Showing
- Check that `ImageUrl` paths are correct
- Use absolute URLs for external images
- Use relative paths for local images

### 404 Errors
- Ensure `StartingLocationId` in `Game.json` matches actual file path
- Check that all `LinkedLocations` IDs point to existing files
- Remember: GitHub Pages is case-sensitive!

## Adding New Games

Create a new folder alongside `time_eater`:

```
vivid/
  engine/
  time_eater/
  your_game/
    index.html
    Game.json
    Locations/
```

Then link to it from the main `index.html`.
