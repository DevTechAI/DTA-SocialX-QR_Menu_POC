# Menu Item Images Guide

## 🎨 Current Status
✅ Menu items now display emoji icons as placeholders
✅ UI structure ready to support custom vector images

## 📸 How to Add Custom Vector Images

### Step 1: Get Cafe-Themed Vector Images

#### **Free Vector Image Resources:**

1. **Freepik** (https://www.freepik.com)
   - Search: "coffee cup vector", "latte icon", "cappuccino illustration"
   - Free account available with attribution
   - High-quality cafe vectors

2. **Flaticon** (https://www.flaticon.com)
   - Search: "coffee", "beverage", "drinks"
   - Large collection of cafe icons
   - SVG and PNG formats

3. **unDraw** (https://undraw.co)
   - Free customizable illustrations
   - Modern, flat design style
   - No attribution required

4. **Vecteezy** (https://www.vecteezy.com)
   - Search: "coffee shop", "beverage icons"
   - Free and premium options
   - SVG format available

5. **IconScout** (https://iconscout.com)
   - Search: "coffee icon", "drink illustration"
   - Free and paid plans
   - Multiple formats (SVG, PNG, AI)

### Step 2: Download and Prepare Images

1. **Download** vector images in SVG or PNG format
2. **Rename** files to match item IDs:
   ```
   hot-latte.svg
   hot-cappuccino.svg
   cold-coffee.svg
   nc-hot-chocolate.svg
   etc.
   ```

3. **Place** in `/public/menu-items/` folder:
   ```
   public/
   └── menu-items/
       ├── hot-latte.svg
       ├── hot-cappuccino.svg
       ├── cold-coffee.svg
       └── ...
   ```

### Step 3: Update Menu Data

Edit `lib/data/menu-items.ts` to use image paths instead of emojis:

```typescript
{
  id: 'hot-latte',
  name: 'Latte',
  description: 'espresso + more milk, less coffee more milk',
  price: 228,
  category: 'HOT',
  available: true,
  icon: '/menu-items/hot-latte.svg', // Image path
}
```

### Step 4: Update Menu Display

The current UI already supports both emojis and image paths!

For **images**, the code will automatically use `<img>` tags:

```tsx
{item.icon && (
  item.icon.startsWith('/') || item.icon.startsWith('http') ? (
    <img 
      src={item.icon} 
      alt={item.name}
      className="w-12 h-12 object-contain"
    />
  ) : (
    <div className="text-2xl">{item.icon}</div>
  )
)}
```

## 🎯 Recommended Image Specifications

- **Format**: SVG (vector) or PNG (transparent background)
- **Size**: 256x256px or 512x512px
- **Style**: Flat design, minimalist, modern
- **Colors**: Match your theme (purple-blue palette)
- **Background**: Transparent

## 🎨 Suggested Search Terms

For best cafe-themed vectors, search for:
- "coffee cup icon flat"
- "latte illustration vector"
- "cappuccino icon minimalist"
- "iced coffee vector"
- "hot chocolate icon"
- "beverage icon set cafe"
- "coffee shop icons"

## ✨ Current Icon Setup (Emojis)

| Item | Icon | Description |
|------|------|-------------|
| Latte | ☕ | Hot coffee cup |
| Cappuccino | 🥤 | Cup with straw |
| Mocha | 🍫 | Chocolate |
| Americano | ☕ | Hot coffee |
| Vietnamese | 🍵 | Tea cup |
| Cold Coffee | 🧊 | Ice cube |
| Cranberry Espresso | 🫐 | Berries |
| Iced Americano | 🧋 | Bubble tea |
| Iced Mocha | 🍨 | Ice cream |
| Hot Chocolate | 🍫 | Chocolate |
| Coke | 🥤 | Cup with straw |
| Redbull | ⚡ | Energy |

## 🚀 Next Steps

1. Choose your preferred vector image source
2. Download cafe-themed icons
3. Create `/public/menu-items/` directory
4. Add images with matching item IDs
5. Update `icon` field in `menu-items.ts`
6. Test on localhost

---

**Note**: For a cohesive design, use icons from the same set or maintain a consistent style across all items!

