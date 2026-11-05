export const dailyTechnicalDetails = {
  T01: {
    details: [
      {
        title: { zh: '码点、字素与 UTF-16 长度', en: 'Code points, graphemes and UTF-16 length' },
        paragraphs: [
          {
            zh: 'JavaScript 字符串以 UTF-16 代码单元存储，普通的 length 不能直接代表字符数。工具用展开运算符 [...input] 按 Unicode 码点遍历，使基本平面之外的 Emoji 不被代理对拆成两个字符；但组合重音、肤色修饰和连接符序列仍可能包含多个码点。',
            en: 'JavaScript strings store UTF-16 code units, so ordinary length is not a character count. The tool spreads [...input] to iterate Unicode code points, keeping an Emoji outside the basic plane from being counted as two surrogate units. Combining accents, skin-tone modifiers and joined sequences can still contain several code points.',
          },
          {
            zh: '字素数另用 Intl.Segmenter 的 grapheme 粒度计算，尽量对应一个可见书写单元。它与码点统计并列展示，不先执行 NFC 等 Unicode 归一化；例如 e 加组合重音通常是两个码点、一个字素，与预组字符 é 看起来相近，却不具有相同的原始编码。',
            en: 'Grapheme count separately uses Intl.Segmenter with grapheme granularity to approximate visible writing units. It is displayed alongside code-point count without first applying Unicode normalization such as NFC. An e followed by a combining accent is usually two code points but one grapheme, resembling precomposed é while having different original encoding.',
          },
        ],
      },
      {
        title: { zh: '英文单词与行数的明确口径', en: 'Explicit rules for English words and lines' },
        paragraphs: [
          {
            zh: '英文单词采用拉丁字母正则匹配，允许词内的直撇号、弯撇号和连字符，因此 don’t 与 well-known 各算一个词。它不是中文分词器，也不把数字当作单词；带重音字母不属于这里的 A–Z 范围，结果不应当作所有语言的通用词数。',
            en: 'English words are matched with a Latin-letter regex allowing internal straight apostrophes, curly apostrophes and hyphens, so don’t and well-known each count as one word. It is not a Chinese tokenizer and does not count numbers as words. Accented letters are outside this A–Z range, so the result is not a universal multilingual word count.',
          },
          {
            zh: '行数按 CRLF、单独 CR 或 LF 分隔，CRLF 整体只算一次换行；空文本特别返回 0 行，末尾换行会留下最后一个空行。空格、标点和换行自身都仍参与码点、字素和字节统计，不会在统计前被去掉。',
            en: 'Lines are split on CRLF, standalone CR or LF, treating CRLF as one separator. Empty input specially returns zero lines, while a trailing newline leaves a final empty line. Spaces, punctuation and newline characters still contribute to code-point, grapheme and byte counts and are not trimmed before counting.',
          },
        ],
        code: { zh: '码点数 = [...input].length\n字素数 = [...Segmenter(grapheme).segment(input)].length\n英文词 = /[A-Za-z]+(?:[\'’-][A-Za-z]+)*/g\n行数 = 空文本 ? 0 : 按 CRLF / CR / LF 拆分后的长度', en: 'codePoints = [...input].length\ngraphemes = [...Segmenter(grapheme).segment(input)].length\nEnglish words = /[A-Za-z]+(?:[\'’-][A-Za-z]+)*/g\nlines = empty ? 0 : split on CRLF / CR / LF and count' },
      },
      {
        title: { zh: '字节数测量的是 UTF-8 编码', en: 'Byte count measures UTF-8 encoding' },
        paragraphs: [
          {
            zh: 'TextEncoder 把当前字符串编码为 UTF-8，再读取字节数组长度；ASCII 通常一字节，常见汉字三字节，示例中的 Emoji 四字节。这既不是 UTF-16 内存占用，也不含下载文件额外的 BOM。统计会遍历输入并创建分段或编码结果，输入上限按 JavaScript 的 200 万代码单元检查，页面输入后延迟约 250 ms 更新。',
            en: 'TextEncoder encodes the current string as UTF-8 and measures the byte array. ASCII typically uses one byte, common Chinese characters three, and the example Emoji four. This is neither UTF-16 memory usage nor a count including an extra file BOM. Counting traverses input and creates segmentation or encoding results; the limit is checked as two million JavaScript code units, and the page updates about 250 ms after typing pauses.',
          },
        ],
      },
    ],
    example: {
      input: { zh: '文本为 A é😀 后接一个 LF 换行和 中；其中 é 是 e 与 U+0301 的组合。', en: 'Text is A é😀 followed by one LF newline and 中; é consists of e plus U+0301.' },
      output: { zh: '码点数 7；字素数 6；英文词数 2；行数 2；UTF-8 字节数 13。', en: '7 code points; 6 graphemes; 2 English words; 2 lines; 13 UTF-8 bytes.' },
      explanation: { zh: '组合重音单独占一个码点但与 e 合成一个字素；UTF-8 字节相加为 1+1+1+2+4+1+3=13，UTF-16 length 则为 8。', en: 'The combining accent adds a code point but forms one grapheme with e. UTF-8 bytes sum to 1+1+1+2+4+1+3=13, while UTF-16 length is 8.' },
    },
  },
  T02: {
    details: [
      {
        title: { zh: '一次执行只有一个整理操作', en: 'Each run performs one cleanup operation' },
        paragraphs: [
          {
            zh: '操作菜单选择一个分支，函数读取输入框原文并返回新结果，没有隐含的“先去空白再去重再排序”流水线。若想组合操作，需要把上一步结果放回输入再执行；仅切换菜单重跑仍使用当前输入框，而不是自动接着处理结果区。',
            en: 'The operation menu selects one branch: the function reads the input text and returns a new result without an implicit trim–deduplicate–sort pipeline. To combine operations, put the previous result back into the input before running again. Switching the menu and rerunning still uses the current input field, not the result area automatically.',
          },
          {
            zh: '按行操作先识别 CRLF、CR 和 LF，输出统一用 LF 连接，因此可能改变换行编码。大写和小写分支直接调用整个字符串的 toUpperCase 或 toLowerCase，不重组行分隔符；这些是 Unicode 大小写转换，不是可逆加密，也不保证转换前后码点数量相同。',
            en: 'Line operations recognize CRLF, CR and LF and join output with LF, so newline encoding can change. Uppercase and lowercase branches call toUpperCase or toLowerCase on the entire string without rebuilding line separators. These are Unicode case conversions, not reversible encryption, and code-point counts need not remain unchanged.',
          },
        ],
      },
      {
        title: { zh: '去重、去空行与 trim 的差别', en: 'How deduplication, blank removal and trim differ' },
        paragraphs: [
          {
            zh: '去重使用 Set，按完整行内容比较，保留首次出现顺序，不忽略大小写或行首尾空格；空行也可作为一个独立值保留。trim 则对每行删除两端空白，保留中间空格和空行数量，因此两个原本不同的行可能在 trim 后变成重复行，却不会被自动合并。',
            en: 'Deduplication uses Set to compare entire lines and preserves first occurrence order without ignoring case or edge spaces; an empty line can remain as one distinct value. Per-line trim removes edge whitespace but retains internal spaces and the number of empty lines. Different lines can become duplicates after trimming without being automatically merged.',
          },
          {
            zh: '移除空行用 line.trim() 的真假值判断，但通过筛选的行仍返回原文，所以非空行的首尾空白不受影响。先 trim 再去重与先去重再 trim 可能得到不同结果，操作顺序是数据规则的一部分；本工具不会擅自归一化 Unicode 或把仅外观相似的文本视为相同。',
            en: 'Blank removal tests the truthiness of line.trim() but returns retained lines unchanged, leaving edge spaces on nonblank lines intact. Trimming before deduplication can differ from deduplicating before trimming, so operation order is part of the data rule. The tool does not silently normalize Unicode or treat merely similar-looking text as identical.',
          },
        ],
        code: { zh: '去重：Array.from(new Set(行数组)).join("\\n")\ntrim：行数组.map(line => line.trim()).join("\\n")\n去空行：行数组.filter(line => line.trim()).join("\\n")', en: 'unique: Array.from(new Set(lines)).join("\\n")\ntrim: lines.map(line => line.trim()).join("\\n")\nremove blanks: lines.filter(line => line.trim()).join("\\n")' },
      },
      {
        title: { zh: '排序使用浏览器区域比较规则', en: 'Sorting uses browser locale comparison' },
        paragraphs: [
          {
            zh: '排序比较器为 a.localeCompare(b)，不指定固定语言、数值排序或大小写优先级，所以不同浏览器区域设置可能影响顺序，不等于逐字节排序。Set、拆行数组及输出字符串都在内存中处理；去重通常需额外保存唯一行，排序还需进行多次比较，因此限制输入长度不代表任意长行列表都能即时完成。',
            en: 'The comparator is a.localeCompare(b), with no fixed locale, numeric ordering or case priority, so browser locale settings can affect order; it is not bytewise sorting. Sets, line arrays and output strings are processed in memory. Deduplication stores unique lines and sorting performs repeated comparisons, so an input-length limit does not guarantee instantaneous processing of every long list.',
          },
        ],
      },
    ],
    example: {
      input: { zh: '按转义记法输入 " a \\na\\n a \\n"，选择“去除重复行”。', en: 'In escaped notation, input is " a \\na\\n a \\n"; choose Remove duplicate lines.' },
      output: { zh: '结果为 " a \\na\\n"：带空格的 a、无空格的 a 和末尾空行均保留。', en: 'Output is " a \\na\\n": the spaced a, unspaced a and trailing empty line are retained.' },
      explanation: { zh: '第三行与第一行完全相同而被移除。若对原文先 trim 再去重，结果是 "a\\n"；先去重再 trim 则是 "a\\na\\n"。', en: 'The third line exactly matches the first and is removed. Trimming the original before deduplicating gives "a\\n"; deduplicating before trimming gives "a\\na\\n".' },
    },
  },
  T03: {
    details: [
      {
        title: { zh: 'Markdown 解析与原始 HTML 转义', en: 'Markdown parsing and escaping raw HTML' },
        paragraphs: [
          {
            zh: 'marked 按 GFM 规则把标题、强调、代码块、表格等 Markdown 结构解析为 HTML。工具自定义 renderer.html，将原始 HTML token 的文本转义为实体，因此输入中的标签按文字显示，不作为一段可执行页面直接拼接；代码块内容也由 Markdown 渲染规则处理。',
            en: 'marked parses Markdown structures such as headings, emphasis, code blocks and tables into HTML using GFM rules. A custom renderer.html escapes raw HTML token text into entities, so input tags appear as text instead of being directly concatenated as an executable page. Code-block contents are handled by the Markdown renderer as well.',
          },
          {
            zh: 'renderer.image 也被替换，只返回转义后的图片说明文字，不生成 img 标签。因此 Markdown 图片地址不会被预览主动请求；这与“先加载远程图片再隐藏”不同，原始 HTML 图片标签也不会绕过转义直接成为图片元素。',
            en: 'renderer.image is also replaced: it returns escaped image-description text rather than an img element. Markdown image URLs are therefore not actively requested by the preview. This is not a load-then-hide approach, and a raw HTML image tag cannot bypass escaping to become an image element.',
          },
        ],
      },
      {
        title: { zh: 'DOMPurify 是第二道结构检查', en: 'DOMPurify provides a second structural check' },
        paragraphs: [
          {
            zh: '解析后的 HTML 再交给 DOMPurify 净化，额外禁止 img、svg、math、style、iframe、form、video、audio 等标签，以及 style、src、srcset 属性。净化器还按自身规则过滤危险链接协议和事件属性，最后才把净化后的字符串写入预览容器，而非先显示不受信任内容再补救。',
            en: 'The parsed HTML then passes through DOMPurify, additionally forbidding img, svg, math, style, iframe, form, video and audio tags, plus style, src and srcset attributes. The sanitizer also filters dangerous link protocols and event attributes according to its own rules. Only afterward is the sanitized string assigned to the preview container.',
          },
          {
            zh: '普通链接仍可保留，需要用户点击才导航。预览链接添加 target="_blank" 与 rel="noopener noreferrer"，让新页面不获得 opener；这不是网址真实性检测。此处的规则用于显示和导出静态内容，不提供脚本、交互表单、自定义样式或任意远程嵌入环境。',
            en: 'Ordinary links can remain and navigate when clicked. Preview links receive target="_blank" and rel="noopener noreferrer" so the opened page does not gain an opener reference; this is not URL authenticity checking. These rules support static display and export, not scripts, interactive forms, custom styling or arbitrary remote embeds.',
          },
        ],
        code: { zh: '原文 → marked.parse({ renderer, gfm:true })\n     → DOMPurify.sanitize(禁止标签和属性)\n     → 预览容器.innerHTML\n原始 HTML token：escapeHtml(token.text)', en: 'source → marked.parse({ renderer, gfm:true })\n       → DOMPurify.sanitize(forbidden tags and attributes)\n       → preview.innerHTML\nraw HTML token: escapeHtml(token.text)' },
      },
      {
        title: { zh: '源文档与净化 HTML 分别导出', en: 'Source Markdown and sanitized HTML export separately' },
        paragraphs: [
          {
            zh: '复制或下载 Markdown 使用输入原文，保留 Markdown 语法；HTML 下载使用净化后的结果，再包裹声明 UTF-8 的静态文档外壳。净化不会回写删除输入内容。页面在输入停止约 250 ms 后重新解析，单次 Markdown 限 20 万 UTF-16 代码单元；解析树、HTML 字符串与预览 DOM 都可能额外占用内存。',
            en: 'Copying or downloading Markdown uses the original input and retains Markdown syntax. HTML export uses the sanitized result inside a static document wrapper declaring UTF-8; sanitization does not delete content from the input. The page reparses about 250 ms after typing pauses and limits Markdown to 200,000 UTF-16 code units. Parse structures, HTML strings and preview DOM can each require extra memory.',
          },
        ],
      },
    ],
    example: {
      input: { zh: '原文为 "# Hi\\n\\n**bold**"。', en: 'Source in escaped notation: "# Hi\\n\\n**bold**".' },
      output: { zh: '净化 HTML 正文为 "<h1>Hi</h1>\\n<p><strong>bold</strong></p>\\n"；Markdown 下载仍包含原来的 # 与 **。', en: 'Sanitized HTML body: "<h1>Hi</h1>\\n<p><strong>bold</strong></p>\\n"; the Markdown download still contains the original # and **.' },
      explanation: { zh: '标题和强调是允许的结构，因此保留；若另输入原始 <b> 标签，标签本身会被转义为可见文字，而不会作为原始 HTML 执行。', en: 'Heading and emphasis elements are allowed and retained. If raw <b> tags are entered instead, the tags themselves are escaped into visible text rather than executed as raw HTML.' },
    },
  },
  T04: {
    details: [
      {
        title: { zh: '文本先编码为模块矩阵', en: 'Text is first encoded into a module matrix' },
        paragraphs: [
          {
            zh: 'qrcode 库先分析内容，可组合数字、字母数字或字节等编码段，再根据数据量和纠错级别自动选择版本。中文等字符在字节模式下消耗 UTF-8 字节，字符数并不直接等于可用容量；工具没有固定版本，也没有传入汉字 Shift-JIS 转换函数来启用该库的 Kanji 优化。',
            en: 'The qrcode library analyzes content and can combine numeric, alphanumeric or byte segments, then selects a version from the data size and error-correction level. Characters such as Chinese consume UTF-8 bytes in byte mode, so character count is not capacity. The tool does not fix a version or supply a Shift-JIS conversion function to enable the library’s Kanji optimization.',
          },
          {
            zh: '版本 v 的符号边长为 4v+17 个模块，版本范围为 1–40。矩阵中包含定位、时序等功能图案以及数据和纠错码字；库还选择掩码以减少不利于扫描的图案。黑白小方块称为模块，不应与最终 PNG 的屏幕像素混为一谈。',
            en: 'Version v has a symbol width of 4v+17 modules, with versions ranging from 1 to 40. The matrix contains finder and timing patterns alongside data and error-correction codewords; the library also selects a mask to reduce patterns unfavorable for scanning. These black and white squares are modules, not necessarily individual PNG pixels.',
          },
        ],
      },
      {
        title: { zh: '纠错空间与四模块静区', en: 'Error-correction space and the four-module quiet zone' },
        paragraphs: [
          {
            zh: 'L、M、Q、H 通过 Reed–Solomon 纠错增加冗余，较高级别通常让同样内容需要更多空间。菜单中的百分比是常见纠错能力的概略标记，不是可随意遮住相同比例像素的保证，连续破坏定位图案或复杂拍摄条件仍可能使二维码无法识别。',
            en: 'L, M, Q and H add Reed–Solomon redundancy, with higher levels generally needing more space for the same content. Menu percentages are rough conventional indicators of recovery capability, not a guarantee that the same percentage of arbitrary pixels can be covered. Damaged finder patterns or difficult capture conditions can still prevent decoding.',
          },
          {
            zh: '工具固定 margin=4，单位是模块，因此符号外还需左右、上下各四模块的浅色静区。请求宽度够大时，渲染比例为 width/(模块数+8)；像素采样使用取整后的模块索引。请求尺寸不足以容纳矩阵和静区时，库会回退到默认缩放，并非始终强制生成所填像素尺寸。',
            en: 'The tool fixes margin=4 in modules, adding four light modules on every side as a quiet zone. When the requested width is large enough, rendering scale is width/(moduleCount+8), with pixel sampling mapped through floored module indices. If the requested size cannot contain the matrix and quiet zone, the library falls back to its default scale rather than always forcing that pixel size.',
          },
        ],
        code: { zh: '模块数 N = 4 × 版本 + 17\n含静区边长 = N + 2 × 4\n若 width ≥ N+8：scale = width/(N+8)\n否则：scale = 4；输出边长 = floor((N+8)×scale)', en: 'modules N = 4 × version + 17\nside including quiet zone = N + 2 × 4\nif width ≥ N+8: scale = width/(N+8)\notherwise: scale = 4; output side = floor((N+8)×scale)' },
      },
      {
        title: { zh: 'PNG 导出与容量边界', en: 'PNG export and capacity boundaries' },
        paragraphs: [
          {
            zh: '生成结果为静态 PNG Data URL，下载时再转为 Blob；工具不提供短网址、动态跳转或扫描追踪。界面尺寸限制为整数 64–2048，输入限 2900 个 UTF-16 代码单元，但库仍可能因实际编码字节和纠错需求超容量而拒绝，因此通过长度检查并不表示一定能生成。',
            en: 'The result is a static PNG Data URL converted to a Blob for download; the tool does not provide URL shortening, dynamic redirects or scan tracking. Size is limited to integers from 64 to 2048 and input to 2,900 UTF-16 code units. Actual encoded bytes and error-correction requirements can still exceed capacity, so passing the length check does not guarantee generation.',
          },
        ],
      },
    ],
    example: {
      input: { zh: '内容 HELLO，纠错级别 M，请求尺寸 290 px。', en: 'Content HELLO, error-correction level M, requested width 290 px.' },
      output: { zh: '当前库自动选择版本 1，符号为 21×21 模块；含静区为 29×29 模块，生成 PNG 为 290×290 px。', en: 'The current library selects version 1: a 21×21-module symbol, or 29×29 including the quiet zone, rendered as a 290×290 px PNG.' },
      explanation: { zh: '此例每模块恰好 10 px，静区每侧 40 px。该尺寸结果依赖本例所选版本，不代表任何内容都能按相同模块比例或请求尺寸输出。', en: 'Each module is exactly 10 px and each quiet-zone side is 40 px. This dimension follows the version selected for this example and is not a blanket guarantee for other contents or requested sizes.' },
    },
  },
  T05: {
    details: [
      {
        title: { zh: '密码学随机数与拒绝采样', en: 'Cryptographic randomness and rejection sampling' },
        paragraphs: [
          {
            zh: '每次随机选择都从 crypto.getRandomValues 获取一个 Uint32 值，范围为 0 到 2³²−1，不使用 Math.random。若字符数 N 不能整除 2³²，直接做随机数 % N 会使部分余数多一次机会，因此先计算 L=floor(2³²/N)×N，只接受小于 L 的样本，再返回样本 % N。',
            en: 'Each selection uses crypto.getRandomValues to obtain a Uint32 value from 0 to 2³²−1, not Math.random. If N choices do not divide 2³² evenly, taking random % N directly gives some remainders an extra opportunity. The tool computes L=floor(2³²/N)×N, accepts only samples below L, then returns sample % N.',
          },
          {
            zh: '例如 N=10 时阈值为 4294967290，最高的六个值会重抽，使十个余数拥有相同数量的可接受原像。拒绝采样消除这一步的取模偏差，但不能把任意后续构造算法都变成所有密码等概率；随机源不可用时也没有回退到较弱随机数的路径。',
            en: 'For N=10 the threshold is 4294967290, so the six largest values are redrawn and each remainder has the same number of accepted preimages. Rejection sampling removes modulo bias in this selection step, but does not make every later construction uniform over all passwords. If the cryptographic source is unavailable, there is no weaker-randomness fallback.',
          },
        ],
        code: { zh: 'L = floor(4294967296 / N) × N\n重复 x = 随机 Uint32，直到 x < L\n返回 x % N', en: 'L = floor(4294967296 / N) × N\nrepeat x = random Uint32 until x < L\nreturn x % N' },
      },
      {
        title: { zh: '字符集保证与 Fisher–Yates 洗牌', en: 'Character-group guarantees and Fisher–Yates shuffling' },
        paragraphs: [
          {
            zh: '选中的大写、小写、数字和符号组先分别构造，开启排除后仅删除 O、0、I、l、1，不泛化为所有外观相近字符。算法从每个有效组先抽一个字符，确保至少出现一次，再从各组合并后的字符池补足长度；长度不得小于组数，也不得超过 256。',
            en: 'Selected uppercase, lowercase, digit and symbol groups are constructed first. Exclusion removes exactly O, 0, I, l and 1 rather than every visually similar character. The algorithm draws one character from each group to ensure coverage, then fills remaining positions from the combined pool. Length must be at least the number of groups and no more than 256.',
          },
          {
            zh: '最后从末尾向前执行 Fisher–Yates：在 0 到 i 中随机选 j 并交换当前位置，打散“每组先取一个”的位置特征。洗牌均匀作用于已生成的字符排列，但“先保证组再补足”可能给某些满足约束的字符串更高概率，不能据此声称所有合规密码等概率或直接套用无限制字符池的熵公式。',
            en: 'A reverse Fisher–Yates pass then selects j uniformly from 0 through i and swaps positions, hiding the initial one-per-group positions. Shuffling acts uniformly on the generated arrangement, but the guarantee-then-fill construction can give some constraint-satisfying strings greater probability. It does not imply uniform sampling over every valid password or justify an unrestricted alphabet entropy formula.',
          },
        ],
      },
      {
        title: { zh: '结果保证与不能保证的内容', en: 'What the output does and does not guarantee' },
        paragraphs: [
          {
            zh: '结果长度按选定的 ASCII 字符计数，因此没有 Emoji 代理对或组合字符的长度歧义。每次执行重新取随机样本，不使用输入文字作种子，也不保证两次结果绝不重复；组覆盖和长度是结构检查，并不能预测网站自身的密码规则、泄露状态或离线猜测成本。',
            en: 'Length counts the selected ASCII characters, avoiding surrogate-pair or combining-character ambiguity. Every run draws fresh samples rather than using input text as a seed, but repeated results are not impossible. Group coverage and length are structural guarantees, not predictions of a website’s password rules, breach status or offline guessing cost.',
          },
        ],
      },
    ],
    example: {
      input: { zh: '长度 8，仅启用数字组，开启排除易混字符。', en: 'Length 8, digits only, with ambiguous-character exclusion enabled.' },
      output: { zh: '确定的输出性质：恰好 8 个字符，每个均来自 23456789；具体密码随机，不提供固定结果。', en: 'Deterministic output properties: exactly 8 characters, each from 23456789. The password itself is random, not a fixed result.' },
      explanation: { zh: '数字组删除 0 和 1 后剩八种选择；N=8 整除 2³²，拒绝阈值恰为 4294967296，此例所有 Uint32 样本都可接受。', en: 'Removing 0 and 1 leaves eight digit choices. N=8 divides 2³², so the rejection threshold is 4294967296 and every Uint32 sample is accepted in this example.' },
    },
  },
  T06: {
    details: [
      {
        title: { zh: '同一量纲通过基准单位换算', en: 'Converting through a base unit within one dimension' },
        paragraphs: [
          {
            zh: '长度、重量、面积、体积和存储类别分别有单位到基准单位的系数表，例如长度以 m、重量以 kg、体积以 L、存储以 B 为基准。普通换算先乘原单位系数，再除以目标单位系数；函数先确认两个单位同属一个表，不能因为都输入数字就把米直接换成千克。',
            en: 'Length, weight, area, volume and storage each have coefficients to a base unit, such as m, kg, L and B. Ordinary conversion multiplies by the source coefficient and divides by the target coefficient. The function first checks that both units belong to one table; numeric inputs do not make meters convertible to kilograms.',
          },
          {
            zh: '面积和体积使用预先登记的完整系数，而不是临时解析单位字符串中的平方或立方符号。体积中的 US gal 是美制液量加仑，系数为 3.785411784 L，不是英制加仑。支持范围由表中标签决定，不包含汇率、密度推导或用户自定义单位表达式。',
            en: 'Area and volume use registered coefficients rather than dynamically parsing square or cube symbols in a unit string. US gal means a US liquid gallon, equal to 3.785411784 L, not an imperial gallon. Supported conversions are defined by table labels and do not include exchange rates, density inference or custom unit expressions.',
          },
        ],
        code: { zh: '普通单位：结果 = 数值 × 原单位系数 / 目标单位系数\n例如：km→m 使用 1000/1；mL→L 使用 0.001/1', en: 'ordinary units: result = value × sourceFactor / targetFactor\nexamples: km→m uses 1000/1; mL→L uses 0.001/1' },
      },
      {
        title: { zh: '温度需要比例与零点偏移', en: 'Temperature requires scale and zero-point offsets' },
        paragraphs: [
          {
            zh: '摄氏、华氏和开尔文不能只用一个倍率互换。代码先归一到摄氏度：华氏输入先减 32 再乘 5/9，开尔文输入减 273.15；再按目标温标应用反向转换。所以 32°F 等于 0°C，而不是把 32 直接乘一个固定比例。',
            en: 'Celsius, Fahrenheit and kelvin cannot be converted with one multiplier alone. The code first normalizes to Celsius: Fahrenheit subtracts 32 and multiplies by 5/9, while kelvin subtracts 273.15, then the target conversion is applied. Thus 32°F is 0°C rather than 32 multiplied by a fixed ratio.',
          },
          {
            zh: '这是温度读数换算，不是温差换算：温差不应重复加减零点偏移。工具检查有限数值和量纲，但不另外禁止低于绝对零度等物理上不成立的输入，因此算术结果不代表输入满足某项实验或工程条件。',
            en: 'This converts temperature readings, not temperature differences, which should not receive zero-point offsets. The tool validates finite numbers and matching dimensions but does not separately reject physically impossible inputs such as temperatures below absolute zero. An arithmetic result therefore does not certify experimental or engineering validity.',
          },
        ],
      },
      {
        title: { zh: '十进制、二进制与浮点精度', en: 'Decimal storage, binary storage and floating-point precision' },
        paragraphs: [
          {
            zh: 'MB 定义为 1000000 B，MiB 为 1048576 B，所以二者不是同一单位；B 表示字节而非比特。输入用 Number 解析，空文本、NaN、Infinity 会拒绝，但有效结果仍使用双精度浮点运算，可能出现小数舍入，不提供任意精度或有效数字管理；页面直接显示数值转换结果。',
            en: 'MB is 1000000 B and MiB is 1048576 B, so they are different units; B means bytes rather than bits. Input is parsed with Number and empty text, NaN and Infinity are rejected. Valid calculations still use double-precision arithmetic and can round decimals; the tool provides neither arbitrary precision nor significant-figure management and displays the converted number directly.',
          },
        ],
      },
    ],
    example: {
      input: { zh: '分别计算 1 MB→MiB，以及 32°F→°C。', en: 'Calculate 1 MB→MiB and 32°F→°C separately.' },
      output: { zh: '数值结果分别为 0.95367431640625 MiB 和 0°C。', en: 'The numeric results are 0.95367431640625 MiB and 0°C respectively.' },
      explanation: { zh: '存储结果为 1000000/1048576；温度结果为 (32−32)×5/9。两例分别展示倍率换算和带零点偏移的换算。', en: 'Storage uses 1000000/1048576; temperature uses (32−32)×5/9. These illustrate ratio conversion and conversion with a zero-point offset.' },
    },
  },
  T07: {
    details: [
      {
        title: { zh: '日历日期差不是小时除以 24', en: 'Calendar-day difference is not elapsed hours divided by 24' },
        paragraphs: [
          {
            zh: 'Luxon 按选定 IANA 时区解析没有偏移的 ISO 日期时间，再分别得到起止时刻。自然日差只取解析结果的年、月、日，重建成 UTC 午夜后相减，避免夏令时改变某一天的长度；它统计日历日期之间的差，不是经过多少个完整 24 小时，也不包含工作日或节假日规则。',
            en: 'Luxon interprets ISO date-times without offsets in the selected IANA zone to obtain start and end instants. Calendar-day difference extracts year, month and day from each result, reconstructs UTC midnights and subtracts them, avoiding changes in day length caused by DST. It measures calendar-date separation, not completed 24-hour periods, and includes no business-day or holiday rules.',
          },
          {
            zh: '实际小时和秒差则直接对起止时刻做 diff，保留时区偏移变化的影响。带显式偏移的输入会先定位到具体时刻，再按选定时区表示；无偏移输入不能脱离时区解释。若结束早于开始，差值为负，工具不自动交换两端。',
            en: 'Elapsed hours and seconds instead use diff between actual instants, preserving changes in timezone offset. An explicit input offset identifies an instant that is represented in the selected zone, whereas offset-free input requires that zone for interpretation. If the end precedes the start, differences are negative; the tool does not swap endpoints.',
          },
        ],
        code: { zh: '自然日差 = UTC(结束年/月/日) − UTC(开始年/月/日)，单位为天\n小时差 = 结束时刻.diff(开始时刻, "hours")\n加天数 = 开始日期.plus({days: 整数天数})', en: 'calendarDays = UTC(end year/month/day) − UTC(start year/month/day), in days\nelapsedHours = end.diff(start, "hours")\nadded = start.plus({days: integerDays})' },
      },
      {
        title: { zh: '加一天与夏令时的边界', en: 'Adding one day across DST boundaries' },
        paragraphs: [
          {
            zh: '加减天数调用 plus({days})，按当地日历移动，通常保留钟面时间，因此跨春季切换的一天可能只有 23 小时，而不是固定增加 86400 秒。天数必须为整数且绝对值不超过 365000；这项功能没有把月份、小时或营业日混入天数选项。',
            en: 'Adding or subtracting days calls plus({days}) to move through the local calendar, usually retaining wall-clock time. A day crossing the spring transition can therefore span 23 hours rather than a fixed 86400 seconds. Day count must be an integer with absolute value no greater than 365000; this option does not mix in months, hours or business days.',
          },
          {
            zh: '对于春季跳时中不存在的本地时间，代码比较解析前后的年月日时分，发现被自动推进就报错。秋季回拨会出现同一钟面时间对应两个时刻，界面没有单独的消歧选项，不应假定总选择某一侧；计算结果还取决于运行环境所提供的时区数据库。',
            en: 'For nonexistent local times in a spring clock jump, the code compares the entered and parsed date and minute fields and rejects automatic forward shifting. Autumn clock repetition can map one wall time to two instants; the UI has no separate disambiguation control, so a particular occurrence should not be assumed. Results also depend on the runtime’s timezone database.',
          },
        ],
      },
      {
        title: { zh: '倒计时是一次计算的快照', en: 'Countdown is a snapshot from one calculation' },
        paragraphs: [
          {
            zh: 'countdownSeconds 使用结束时刻与执行时“现在”的秒差，并向下取整；负值表示目标已经过去。它在点击计算时更新，不是持续运行的秒表，也不与自然日差共用同一个起点。示例只给出不依赖当前时钟的字段，不能把某次倒计时结果写成永远固定的预期值。',
            en: 'countdownSeconds subtracts the execution-time “now” from the end instant and floors the seconds; negative values mean the target has passed. It updates when Calculate is clicked rather than running as a live stopwatch, and its starting point differs from the calendar-day difference. Examples therefore list clock-independent fields instead of treating one countdown snapshot as a permanent expected value.',
          },
        ],
      },
    ],
    example: {
      input: { zh: 'America/New_York：开始 2026-03-07T12:00，结束 2026-03-09T12:00，给开始日期加 1 天。', en: 'America/New_York: start 2026-03-07T12:00, end 2026-03-09T12:00, and add 1 day to the start.' },
      output: { zh: '结果字段摘录：days=2，hours=47，seconds=169200，added="2026-03-08T12:00:00.000-04:00"；倒计时未列入。', en: 'Result-field excerpt: days=2, hours=47, seconds=169200, added="2026-03-08T12:00:00.000-04:00"; countdown is omitted.' },
      explanation: { zh: '3 月 8 日进入夏令时，偏移从 -05:00 变为 -04:00，两个日历日少了一小时；按日历加一天仍为当地中午。', en: 'DST begins on March 8, shifting the offset from -05:00 to -04:00, so two calendar days span one fewer hour. Calendar addition still lands at local noon.' },
    },
  },
  F01: {
    details: [
      {
        title: { zh: '引号状态决定真正的记录边界', en: 'Quote state determines actual record boundaries' },
        paragraphs: [
          {
            zh: 'Papa Parse 按指定单字符分隔符解析，而不是简单 split 逗号或换行：双引号字段可含分隔符和多行，字段内部的引号用两个双引号表示。输入开头的 UTF-8 BOM 被去掉；未启用 dynamicTyping，其默认值为 false，所以 001、true 和大整数仍是字符串，不会被猜测成数字或布尔值。',
            en: 'Papa Parse uses the selected single-character delimiter rather than simply splitting commas or newlines: quoted fields can contain delimiters and multiple lines, and embedded quotes are doubled. An initial UTF-8 BOM is removed. dynamicTyping is not enabled and defaults to false, so 001, true and large integers remain strings rather than guessed numbers or booleans.',
          },
          {
            zh: '每条记录通过 meta.cursor 回看原文片段，只忽略引号之外真正空白的物理行。仅含逗号的记录、带引号空串和空格行仍保留，带引号字段中的空行也不删除；若只凭解析后的空字符串判断，就会误删这些不同含义的数据。',
            en: 'Each record uses meta.cursor to inspect its original source slice, ignoring only empty physical lines outside quotes. Comma-only records, quoted empty strings and whitespace-only records are retained, as are blank lines inside quoted fields. Judging only from parsed empty strings would incorrectly discard these distinct kinds of data.',
          },
        ],
      },
      {
        title: { zh: '表头映射与 JSON 的字段并集', en: 'Header mapping and the union of JSON fields' },
        paragraphs: [
          {
            zh: 'CSV 有表头时，首行必须非空且字段名唯一，后续每行列数必须相同，再用 Object.fromEntries 映射为对象；无表头则返回二维数组。反向转换使用 lossless-json 保留数字原文，再把数值单元格转成其文本，避免大整数先经过 Number 四舍五入。',
            en: 'With headers, the first CSV row must have nonempty unique names and every data row must have the same width before Object.fromEntries creates objects. Without headers it returns row arrays. Reverse conversion uses lossless-json to retain number source text and passes numeric cells as that text, avoiding large integers being rounded through Number first.',
          },
          {
            zh: '对象数组导出先遍历所有行，按字段首次遇到的顺序建立并集，所以后面对象新增的键不会遗漏；缺失值和 null 输出为空单元格。只接受平面对象数组或二维数组，不混合两种行形态，也不把嵌套对象偷偷序列化到单元格；导出记录分隔符固定为 CRLF。',
            en: 'Object-array export scans every row to build the field union in first-encounter order, retaining keys introduced later. Missing values and null become empty cells. Input must contain flat object rows or row arrays without mixing the two, and nested objects are rejected rather than silently serialized into cells. Exported record separators are fixed to CRLF.',
          },
        ],
        code: { zh: '[{"a":"1"},{"b":"2"}]\n→ 字段 ["a","b"]\n→ CSV（转义记法）"a,b\\r\\n1,\\r\\n,2"', en: '[{"a":"1"},{"b":"2"}]\n→ fields ["a","b"]\n→ CSV in escaped notation: "a,b\\r\\n1,\\r\\n,2"' },
      },
      {
        title: { zh: 'CSV 引号与公式防护是两件事', en: 'CSV quoting and formula protection are different' },
        paragraphs: [
          {
            zh: 'unparse 为含分隔符、换行或引号等内容加引号并转义，这保证 CSV 结构，却不阻止电子表格执行公式。启用防护时，库对匹配其内置规则、以 =、+、-、@、制表或回车开头的字符串添加单引号，并强制引用；这是会改变值的导出策略，不是通用公式检测。最多 20 行的表格预览也不表示其余行被截掉。',
            en: 'unparse quotes and escapes cells containing delimiters, newlines or quotes to preserve CSV structure, but that alone does not stop spreadsheets from evaluating formulas. When protection is enabled, strings matching the library’s built-in rule and beginning with =, +, -, @, tab or carriage return receive an apostrophe and forced quoting. This changes exported values and is not universal formula detection. The 20-row table preview does not truncate the remaining output.',
          },
        ],
      },
    ],
    example: {
      input: { zh: 'CSV 转 JSON，逗号分隔、有表头；以下以 \\n 表示换行：name,note\\n中,"a,b"\\n\\nJane,"line1\\nline2"\\n,\\n', en: 'CSV to JSON with comma delimiter and headers; writing newlines as \\n: name,note\\n中,"a,b"\\n\\nJane,"line1\\nline2"\\n,\\n' },
      output: { zh: 'JSON 内容（省略排版空白）：[{"name":"中","note":"a,b"},{"name":"Jane","note":"line1\\nline2"},{"name":"","note":""}]。', en: 'JSON content with formatting whitespace omitted: [{"name":"中","note":"a,b"},{"name":"Jane","note":"line1\\nline2"},{"name":"","note":""}].' },
      explanation: { zh: '逗号和字段内换行均保留在 note；独立空行被忽略，而逗号组成的最后一行代表两个空字段，仍生成一条记录。', en: 'The comma and quoted newline remain inside note. The separate empty line is ignored, while the final comma-only line represents two empty fields and still creates a record.' },
    },
  },
};
