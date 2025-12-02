# 🚀 Hướng Dẫn Deploy lên Cloudflare Pages

## 📋 Yêu cầu

- Tài khoản Cloudflare (free)
- Repository GitHub: `namhbcf1/buildpcchuan`
- Domain: `buildpcchuan.pages.dev`

## 🎯 Bước 1: Kết nối GitHub với Cloudflare Pages

### 1.1 Đăng nhập Cloudflare Dashboard
1. Truy cập: https://dash.cloudflare.com/
2. Đăng nhập với tài khoản của bạn
3. Chọn **Pages** từ sidebar

### 1.2 Tạo Project Mới
1. Click **Create a project**
2. Chọn **Connect to Git**
3. Chọn **GitHub** và authorize Cloudflare
4. Chọn repository: **buildpcchuan**

## ⚙️ Bước 2: Cấu hình Build

### 2.1 Build Settings
```
Project name: buildpcchuan
Production branch: main
```

### 2.2 Build Configuration
```bash
Framework preset: None (manual configuration)

Build command:
cd react-pc-builder && npm install && npm run build

Build output directory:
react-pc-builder/dist

Root directory:
/ (Leave empty or root path)
```

### 2.3 Environment Variables (Nếu cần)
```
VITE_API_BASE = https://tp-pc-builder-api.bangachieu4.workers.dev
```

## 🔧 Bước 3: Deploy

### 3.1 Save và Deploy
1. Click **Save and Deploy**
2. Cloudflare sẽ bắt đầu build process
3. Chờ 2-3 phút để build hoàn thành

### 3.2 Kiểm tra Build Logs
```
Building...
✓ 51 modules transformed
✓ built in 2s
✓ Deployment complete!
```

## 🌐 Bước 4: Kiểm tra Website

### 4.1 URL mặc định
```
https://buildpcchuan.pages.dev
```

### 4.2 Test các tính năng
- ✅ Trang chủ Builder
- ✅ Components page
- ✅ Config Manager
- ✅ Image loading
- ✅ API connectivity

## 🔄 Bước 5: Auto Deploy (Đã cấu hình)

### 5.1 Trigger Deploy
Mỗi khi push code lên branch `main`:
```bash
git add .
git commit -m "Your message"
git push origin main
```

### 5.2 Cloudflare tự động:
1. Detect changes
2. Build new version
3. Deploy to production
4. Rollback nếu có lỗi

## 🎨 Bước 6: Custom Domain (Optional)

### 6.1 Nếu có domain riêng
1. Pages Dashboard → **Custom domains**
2. Click **Set up a custom domain**
3. Nhập domain của bạn
4. Follow DNS configuration

### 6.2 SSL/HTTPS
- Cloudflare tự động cấu hình SSL
- Free SSL certificate
- Force HTTPS enabled

## 🔍 Bước 7: Monitoring

### 7.1 Analytics
- **Pages Dashboard** → **Analytics**
- Xem traffic, requests, bandwidth

### 7.2 Build History
- **Deployments** tab
- Xem lịch sử build
- Rollback if needed

## 📊 Performance Checks

### Lighthouse Score (Expected)
```
Performance: 95+
Accessibility: 90+
Best Practices: 90+
SEO: 95+
```

### Bundle Sizes
```
Initial load: ~260 KB (gzipped: ~85 KB)
Builder page: ~40 KB (lazy loaded)
Components: ~27 KB (lazy loaded)
ConfigManager: ~22 KB (lazy loaded)
```

## 🐛 Troubleshooting

### Build Failed?
**Check:**
1. Build command syntax
2. Output directory path
3. Node version (use v18+)
4. Dependencies in package.json

**Fix:**
```bash
# Local test first
cd react-pc-builder
npm run build
# If success, commit and push
```

### Images not loading?
**Check:**
1. Images in `react-pc-builder/public/images/`
2. Image paths start with `/images/`
3. Case-sensitive filenames

### API not connecting?
**Check:**
1. Worker deployed: https://tp-pc-builder-api.bangachieu4.workers.dev/health
2. CORS enabled
3. API_URL in code

## 📞 Support

### Cloudflare Support
- Community: https://community.cloudflare.com/
- Docs: https://developers.cloudflare.com/pages/

### GitHub Issues
- https://github.com/namhbcf1/buildpcchuan/issues

---

## ✅ Deployment Checklist

- [ ] Repository connected to Cloudflare
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] First deployment successful
- [ ] Website accessible via URL
- [ ] All pages loading correctly
- [ ] Images loading
- [ ] API connecting
- [ ] Auto-deploy working
- [ ] Custom domain (if needed)
- [ ] SSL enabled

## 🎉 Done!

Website đã sẵn sàng tại: **https://buildpcchuan.pages.dev**

Mỗi lần update code, chỉ cần:
```bash
git push origin main
```

Cloudflare tự động deploy! 🚀
