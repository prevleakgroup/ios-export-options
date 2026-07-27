# DNS Configuration for GitHub Pages
## Username: prevleakgroup

---

## Complete DNS Records to Add in GoDaddy

For each of your 5 domains, add these DNS records:

---

### 1. prevleak.company

#### A Records (root domain)
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 185.199.108.153 | 1 hour |
| A | @ | 185.199.109.153 | 1 hour |
| A | @ | 185.199.110.153 | 1 hour |
| A | @ | 185.199.111.153 | 1 hour |

#### CNAME Record (www)
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | prevleakgroup.github.io | 1 hour |

---

### 2. palettemath.company

#### A Records (root domain)
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 185.199.108.153 | 1 hour |
| A | @ | 185.199.109.153 | 1 hour |
| A | @ | 185.199.110.153 | 1 hour |
| A | @ | 185.199.111.153 | 1 hour |

#### CNAME Record (www)
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | prevleakgroup.github.io | 1 hour |

---

### 3. saferide.company

#### A Records (root domain)
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 185.199.108.153 | 1 hour |
| A | @ | 185.199.109.153 | 1 hour |
| A | @ | 185.199.110.153 | 1 hour |
| A | @ | 185.199.111.153 | 1 hour |

#### CNAME Record (www)
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | prevleakgroup.github.io | 1 hour |

---

### 4. qvedic.company

#### A Records (root domain)
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 185.199.108.153 | 1 hour |
| A | @ | 185.199.109.153 | 1 hour |
| A | @ | 185.199.110.153 | 1 hour |
| A | @ | 185.199.111.153 | 1 hour |

#### CNAME Record (www)
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | prevleakgroup.github.io | 1 hour |

---

### 5. plumber.company

#### A Records (root domain)
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 185.199.108.153 | 1 hour |
| A | @ | 185.199.109.153 | 1 hour |
| A | @ | 185.199.110.153 | 1 hour |
| A | @ | 185.199.111.153 | 1 hour |

#### CNAME Record (www)
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | prevleakgroup.github.io | 1 hour |

---

## How to Add These Records in GoDaddy

1. Go to **GoDaddy.com** → **My Products** → **Domains**
2. Click the domain name
3. Click **Manage DNS** (or **DNS** tab)
4. Scroll to **Records** section
5. Click **Add** for each record:
   - Type: A or CNAME
   - Name: @ (for root) or www (for subdomain)
   - Value: IP or domain name
   - TTL: 1 hour (or default)
6. Click **Save**

---

## What to Do After Adding DNS Records

1. **Wait for propagation** (5-30 minutes)
2. **Verify DNS:**
   ```powershell
   nslookup prevleak.company
   # Should return: 185.199.108.153 or similar
   ```

3. **Add custom domain in GitHub:**
   - Go to repo Settings → Pages
   - Under "Custom domain", enter: `prevleak.company`
   - Click Save
   - GitHub will verify DNS automatically (shows green ✓ when confirmed)

4. **Repeat for other 4 domains:**
   - palettemath.company
   - saferide.company
   - qvedic.company
   - plumber.company

5. **Enable HTTPS:**
   - After DNS verification, check "Enforce HTTPS"
   - HTTPS certificate generates automatically (~24 hours)

---

## Verification Checklist

After completing all DNS records:

- [ ] All 4 A records added for each domain
- [ ] CNAME record added for www subdomain (all domains)
- [ ] DNS propagated (5-30 minutes)
- [ ] GitHub Pages custom domain added for each repo
- [ ] Green checkmark showing in GitHub Pages settings
- [ ] HTTPS enabled (24 hours after DNS verification)

---

## Troubleshooting

### DNS Not Verifying

1. **Check records in GoDaddy:**
   ```powershell
   # Test DNS resolution
   nslookup prevleak.company
   dig prevleak.company +short
   ```

2. **Common issues:**
   - A records not yet propagated (wait 5-30 minutes)
   - CNAME points to wrong domain
   - TTL too high (set to 1 hour or lower)

3. **Re-verify in GitHub:**
   - Remove custom domain from GitHub Pages
   - Re-add custom domain
   - GitHub will check DNS again

### GitHub Says "Domain Not Configured"

- Verify all 4 A records exist
- Verify CNAME record exists
- Check no typos in record values
- Wait for DNS propagation

---

## Next Steps

1. **Add DNS records in GoDaddy** (using tables above)
2. **Wait for propagation** (5-30 minutes)
3. **Add custom domains in GitHub:**
   - Settings → Pages → Custom domain
   - Enter each domain one at a time
   - GitHub verifies automatically
4. **Deploy your site** using workflows

---

**GitHub Username:** `prevleakgroup`
**GitHub Pages URL:** `https://prevleakgroup.github.io`
**Custom Domains:** All 5 will point to this GitHub Pages site
