# How to Test Google Fonts in Hero Section

## Quick Steps

### Step 1: Get Your Google Fonts Embed Code

1. Go to [Google Fonts](https://fonts.google.com)
2. Select the font(s) you want to test
3. Click "Get font" → Copy the `<link>` embed code

Example embed code:
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Montserrat:wght@300;400;600&display=swap" rel="stylesheet">
```

### Step 2: Add to index.html

Open `music-school-frontend/index.html` and add your embed code after line 38:

```html
<!-- TEST FONTS FOR HERO SECTION - Add your Google Fonts embed code here -->
<link href="YOUR_GOOGLE_FONTS_EMBED_CODE_HERE" rel="stylesheet">
```

### Step 3: Apply to Hero Section

Open `music-school-frontend/src/App.jsx` and find the hero section (around line 598).

**For the main title (h1):**
Uncomment and update the `fontFamily` in the style prop:
```jsx
<h1 
  className="text-5xl md:text-7xl lg:text-8xl font-cinema font-bold leading-tight text-white mb-6"
  style={{
    fontFamily: "'Playfair Display', serif"  // Replace with your font name
  }}
>
```

**For the subtitle (p):**
Uncomment and update the `fontFamily`:
```jsx
<p 
  className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed font-medium max-w-3xl mx-auto"
  style={{
    fontFamily: "'Montserrat', sans-serif"  // Replace with your font name
  }}
>
```

### Step 4: Test

1. Save both files
2. Refresh your browser
3. The hero section should now use your test fonts
4. Other sections remain unchanged

### Step 5: Remove Test Fonts

When done testing:
1. Remove the font link from `index.html`
2. Remove or comment out the `style` props from `App.jsx`

## Example: Testing Multiple Fonts

If you want to test different fonts for title and subtitle:

**index.html:**
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Montserrat:wght@300;400;600&display=swap" rel="stylesheet">
```

**App.jsx - Title:**
```jsx
style={{ fontFamily: "'Playfair Display', serif" }}
```

**App.jsx - Subtitle:**
```jsx
style={{ fontFamily: "'Montserrat', sans-serif" }}
```

## Tips

- **Font names with spaces** need quotes: `'Playfair Display'`
- **Multiple fonts** use comma: `'Font One', 'Font Two', serif`
- **Fallback fonts** are good: `'Your Font', serif` or `'Your Font', sans-serif`
- **Test in browser DevTools** - You can test fonts directly in the browser console:
  ```javascript
  document.querySelector('.hero-title').style.fontFamily = "'Your Font', serif"
  ```

## Quick Browser Test (Without Code Changes)

You can also test fonts directly in browser DevTools:

1. Open browser DevTools (F12)
2. Select the hero title element
3. In Styles panel, add:
   ```css
   font-family: 'Your Font Name', serif;
   ```
4. See the change instantly!

