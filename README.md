# HandyBox 百宝匣

30 个在浏览器本地运行的日常工具。支持中英文、搜索、分类、收藏、最近使用，以及浅色 / 深色 / 跟随系统的简洁背景。无需账号或后端，Astro 生成静态页面，可部署 GitHub Pages。

## 本地运行

推荐 Node.js 24 LTS，最低版本 22.23.4。

```sh
npm ci
npm run dev
```

打开终端显示的地址，默认是 `http://127.0.0.1:4321/handybox/`。

查看正式静态产物：

```sh
npm run build
npm run preview
```

## 全部工具

| 分类 | 工具 |
| --- | --- |
| 开发工具，共 16 项 | JSON 格式化与校验、Unicode 编解码、Base64 编解码、URL 编解码与参数解析、时间戳转换、UUID、SHA-256/SHA-512、文本差异、正则测试、JWT 查看、进制转换、颜色转换、JSON/YAML、SQL 格式化、Cron、HTML 实体 |
| 图片工具，共 5 项 | 图片压缩、尺寸与裁剪、格式转换、文字或图片水印、图片与 EXIF 信息 |
| 文本与日常，共 7 项 | 字数统计、文本整理、Markdown 预览、二维码生成、随机密码、单位换算、日期计算 |
| 文件与数据，共 2 项 | CSV/JSON 转换、PDF 合并/拆分/页面重排 |

每个工具有独立地址，例如 `/handybox/tools/json/`。页面提供示例、输入校验与结果操作；文件工具支持拖入、预览和下载。搜索匹配中英文名称与别名，`Ctrl / Command + K` 聚焦搜索。

工具页右上角的「实现原理 / How it works」提供处理流程、核心 API、技术拆解和完整输入输出示例，深入说明算法、数据表示、精度、性能和功能边界。例如 Base64 的位分组、Unicode 代理对、Canvas 像素与坐标换算，以及 PDF 页面对象复制。说明支持章节跳转、中英文和深浅色；点击关闭按钮、遮罩或按 Esc 可返回，输入与结果保持不变。

功能详情见 [功能规划](功能规划.md)，实现分工和检查项见 [实施计划](docs/superpowers/plans/2026-11-05-handybox.md)。

## 数据与功能边界

- 工具不上传输入和文件，不调用远程计算 API。依赖和图标随站点发布；首次加载网站仍需网络，未加入离线缓存。
- 浏览器只持久保存语言、主题、收藏和最近使用的工具编号，存储键使用 `handybox-` 前缀。刷新清除工具输入；页脚可清除偏好与使用记录。禁用存储时仍可使用工具。
- Unicode、Base64 是编解码；哈希是单向摘要；JWT 仅查看内容，不验证签名。
- JSON/YAML 转换保留普通整数精度；无法安全表示的高精度小数、指数值及非有限数会明确报错，可改用带引号的字符串，避免静默改写数据。
- 正则运行于独立 Worker，2 秒超时自动终止，提供取消；使用 JavaScript 正则语法。Markdown 预览禁用原始 HTML、图片及远程嵌入，导出 HTML 也经过净化。
- 图片支持静态 JPEG、PNG、WebP，每张最多 25 MiB、2400 万像素、单边 8192 px。压缩最多 10 张且总计 100 MiB，顺序处理。PNG 不能通过质量滑块保证变小；输出如实显示大小，保留原图下载。GIF、APNG、动画 WebP、HEIC、RAW、SVG 不在范围内。
- 图片转 JPEG 可设置透明区域底色；浏览器不支持的编码会提示失败。重编码可能丢失元数据与色彩配置；不承诺压缩比例、完全保留颜色或完整隐私清除。
- PDF 支持未加密普通文件，最多 10 个、100 MiB 输入/输出、总计 1000 页；拆分最多 20 个输出。页码如 `3,1,1` 可重排并重复，分组如 `1-2;3` 可拆分。预览显示文件与页数，不包含页面渲染；不保证保留签名、书签或表单结构。
- 文件处理的取消会在当前解码、编码或 PDF 库操作完成后生效。CSV 先支持 UTF-8，默认开启电子表格公式注入防护；Cron 使用五段格式。日期计算中的倒计时是点击计算时的快照。

## 验证

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

也可运行 `npm run verify` 一次执行测试、构建与浏览器检查。Windows 默认使用已安装在标准位置的 Microsoft Edge；其他环境使用 Playwright Chromium，可通过 `BROWSER_PATH` 指定浏览器。

单元测试覆盖大整数与 Unicode、时间与夏令时、CSV、正则、图片格式和 PDF 实际输出。浏览器检查会自己启动临时静态服务器，遍历 30 个工具，验证真实输出与文件下载、语言保留输入、主题和收藏、存储不可用、危险 HTML、正则超时、手机布局以及无第三方请求。截图写入未提交的 `.tools/screenshots/`。

## GitHub Pages 部署

1. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
2. 将代码合入 `main`，或在 `main` 手动运行 **Check and publish HandyBox** 工作流。
3. 工作流安装依赖与 Chromium，运行完整验证并发布 `dist/`。PR 只检查，不发布。

默认配置为 `https://jockiepeng.github.io/handybox/`，该配置不表示已经发布。GitHub Actions Variables 可设置 `SITE_URL` 和 `BASE_PATH`；自定义域名根路径使用 `BASE_PATH=/`，并在 Pages 设置绑定域名。需要 CNAME 文件时放在 `public/CNAME`。

本地构建也接受相同环境变量。工具链接与静态资源都包含基础路径，直接访问或刷新工具页面不依赖单页应用回退。

## 目录

```text
src/data/tools.mjs       工具目录与双语搜索
src/layouts/            页面公共布局
src/pages/              首页、30 个静态工具页、404
src/scripts/            语言、主题、收藏与工具加载
src/tools/text/         开发与文本工具、CSV
src/tools/media/        图片与 PDF 工具
src/workers/            可终止的正则执行
src/lib/ui.mjs          双语与本地下载辅助函数
tests/                  单元和浏览器测试
scripts/check-build.mjs 静态页面与链接检查
```
