export const categories = [
  {id:'dev', zh:'开发工具', en:'Developer', icon:'</>'},
  {id:'image',zh:'图片工具',en:'Images',icon:'▧'},
  {id:'text',zh:'文本与日常',en:'Text & everyday',icon:'Aa'},
  {id:'file',zh:'文件与数据',en:'Files & data',icon:'▤'},
];
const records = [
 ['D01','json','dev','JSON 格式化','JSON formatter','格式化、压缩与校验，让数据清晰可读。','Format, minify and validate your JSON.','json 格式化 校验 压缩 beautify validate','{}'],
 ['D02','unicode','dev','Unicode 编解码','Unicode converter','中文、Emoji 与 Unicode 转义相互转换。','Convert text and Unicode escape sequences.','unicode 中文转义 \\u encode decode','U+'],
 ['D03','base64','dev','Base64 编解码','Base64 encoder','支持中文文本和 Base64URL 的编码转换。','Encode UTF-8 text and decode Base64 or Base64URL.','base64 编码 解码 utf8','64'],
 ['D04','url','dev','URL 编解码','URL toolkit','编码网址、解码参数，拆解查询字符串。','Encode URLs and inspect query parameters.','url uri 参数 encode decode query','%'],
 ['D05','timestamp','dev','时间戳转换','Timestamp converter','秒与毫秒时间戳、日期和时区转换。','Convert Unix timestamps, dates and time zones.','timestamp unix 时间 日期 时区 timezone','◷'],
 ['D06','uuid','dev','UUID 生成','UUID generator','快速生成一个或一组随机 UUID。','Generate one UUID or a whole batch.','uuid guid random 随机 标识','ID'],
 ['D07','hash','dev','哈希摘要','Hash calculator','计算文本或文件的 SHA-256 与 SHA-512。','Calculate SHA-256 or SHA-512 for text and files.','hash sha256 sha512 哈希 摘要 校验','#'],
 ['D08','diff','dev','文本差异对比','Text diff','逐行对比两段文本，找到每一处变化。','Compare text and highlight line-by-line changes.','diff compare 文本 对比 差异','±'],
 ['D09','regex','dev','正则表达式测试','Regex tester','查看匹配、分组和替换结果。','Inspect regular expression matches and replacements.','regex regexp 正则 匹配 替换','.*'],
 ['D10','jwt','dev','JWT 查看','JWT inspector','查看令牌内容和时间字段，不验证签名。','Decode token contents without verifying signatures.','jwt token 令牌 decode','JWT'],
 ['D11','radix','dev','进制转换','Base converter','二、八、十、十六进制，支持大整数。','Convert integers between binary, octal, decimal and hex.','radix binary hex 进制 二进制 十六进制','01'],
 ['D12','color','dev','颜色转换','Color converter','HEX、RGB、HSL 转换与文字对比度。','Convert HEX, RGB and HSL, and check contrast.','color hex rgb hsl 颜色 对比度','◐'],
 ['D13','yaml','dev','JSON 与 YAML','JSON / YAML','转换配置格式，保留准确的数字。','Convert configuration between JSON and YAML.','json yaml yml 配置 转换','Y'],
 ['D14','sql','dev','SQL 格式化','SQL formatter','按方言整理语句，让查询更容易阅读。','Format queries for your SQL dialect.','sql mysql postgres sqlite 格式化','SQL'],
 ['D15','cron','dev','Cron 表达式','Cron explorer','读懂计划任务，预览下一次运行时间。','Explain five-field schedules and preview runs.','cron 定时 表达式 调度 schedule','↻'],
 ['D16','html','dev','HTML 实体转换','HTML entities','文本与 HTML 实体编码相互转换。','Encode and decode HTML entities as plain text.','html entity 实体 转义 encode decode','&'],
 ['I01','image-compress','image','图片压缩','Image compressor','调整质量与尺寸，让图片轻一点。','Reduce image size with quality and dimension controls.','image compress 图片 压缩 jpeg png webp','▧'],
 ['I02','image-resize','image','图片尺寸与裁剪','Resize & crop','调整宽高，裁剪出恰到好处的画面。','Resize and crop your images to fit.','image resize crop 图片 缩放 裁剪 尺寸','⌗'],
 ['I03','image-convert','image','图片格式转换','Image converter','在 JPEG、PNG 和 WebP 之间转换。','Convert images between JPEG, PNG and WebP.','image convert jpeg jpg png webp 格式 转换','⇄'],
 ['I04','watermark','image','图片水印','Image watermark','为图片添加文字或图片水印。','Add a text or image watermark to your photo.','image watermark 图片 文字 水印','©'],
 ['I05','image-info','image','图片信息查看','Image metadata','查看尺寸、大小与照片的 EXIF 信息。','Inspect image dimensions, size and EXIF metadata.','image metadata exif 图片 信息','ⓘ'],
 ['T01','text-stats','text','字数与文本统计','Text statistics','字符、单词、行数与 UTF-8 字节统计。','Count characters, words, lines and UTF-8 bytes.','text count word 字数 字符 统计','Aa'],
 ['T02','text-clean','text','文本整理','Text cleanup','去重、排序、清理空白和转换大小写。','Sort, deduplicate, trim and change text case.','text clean dedupe sort 文本 整理 去重','≡'],
 ['T03','markdown','text','Markdown 预览','Markdown preview','边写边预览，导出 Markdown 或 HTML。','Write, preview and export Markdown or HTML.','markdown md preview 预览 编辑','M↓'],
 ['T04','qrcode','text','二维码生成','QR code generator','将文本或网址变为可下载的二维码。','Turn text or a URL into a downloadable QR code.','qr qrcode 二维码 生成','▦'],
 ['T05','password','text','随机密码生成','Password generator','自选长度与字符，生成安全随机密码。','Create random passwords with your chosen character sets.','password random 密码 随机 安全','**'],
 ['T06','units','text','单位换算','Unit converter','长度、重量、温度、面积、体积与存储。','Convert length, mass, temperature, area, volume and data.','unit convert 单位 换算 温度 存储','⇌'],
 ['T07','date','text','日期计算','Date calculator','计算日期间隔、加减天数与倒计时。','Find date differences, add days and count down.','date 日期 计算 间隔 倒计时','▣'],
 ['F01','csv','file','CSV 与 JSON','CSV / JSON','将表格记录与 JSON 数组相互转换。','Convert tabular records and JSON arrays.','csv json 表格 数据 转换','CSV'],
 ['F02','pdf','file','PDF 合并与拆分','PDF workspace','合并文件、提取页面或调整页面顺序。','Merge documents, extract pages and reorder your PDF.','pdf merge split 合并 拆分 页码 文件','PDF'],
];
export const tools = records.map(([id,slug,category,zh,en,descriptionZh,descriptionEn,keywords,icon])=>({id,slug,category,zh,en,descriptionZh,descriptionEn,keywords,icon}));
export function searchTools(query='',category='all') {
  const q=query.trim().toLowerCase();
  const words=q.split(/\s+/).filter(Boolean);
  return tools.filter(t=>(category==='all'||t.category===category)&&words.every(w=>`${t.zh} ${t.en} ${t.descriptionZh} ${t.descriptionEn} ${t.keywords}`.toLowerCase().includes(w)))
    .sort((a,b)=>score(b,q)-score(a,q));
}
function score(t,q) { if(!q)return 0; const title=`${t.zh} ${t.en}`.toLowerCase(); return (t.zh.toLowerCase()===q||t.en.toLowerCase()===q?100:0)+(title.startsWith(q)?20:0)+(title.includes(q)?10:0); }
