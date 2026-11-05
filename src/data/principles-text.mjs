export const textPrinciples = {
  D01: {
    summary: { zh: '先读懂 JSON 的结构，再用整齐或紧凑的排版重新写出。', en: 'Reads the JSON structure, then writes it back with readable or compact formatting.' },
    steps: [
      { zh: '解析对象、数组和各种值，遇到语法错误时报告解析位置。', en: 'Parses objects, arrays and values, reporting the position of syntax errors.' },
      { zh: '保留数字的原始表示，避免大整数先经过普通浮点数而丢失位数。', en: 'Retains the original number representation so large integers do not lose digits through floating-point conversion.' },
      { zh: '按选项输出两空格缩进、紧凑 JSON，或仅显示校验结果。', en: 'Outputs two-space indentation, compact JSON, or a validation result according to the selected mode.' },
    ],
    implementation: { zh: '按需加载 lossless-json，由它完成解析和序列化。数字使用库提供的无损表示；格式化和压缩都基于解析后的结构，而不是直接删改空白字符。', en: 'Loads lossless-json on demand for parsing and serialization. Its lossless number representation preserves numeric text; formatting and minification operate on the parsed structure rather than deleting whitespace directly.' },
    limits: { zh: '输入最多 200 万个 UTF-16 代码单元；必须是有效 JSON，不支持注释、自动修复或 JSONPath。', en: 'Input is limited to 2 million UTF-16 code units and must be valid JSON. Comments, automatic repair and JSONPath are unsupported.' },
  },
  D02: {
    summary: { zh: '把文字与可见的 Unicode 转义写法互相转换。', en: 'Converts between text and visible Unicode escape sequences.' },
    steps: [
      { zh: '编码时逐个读取 UTF-16 代码单元，保留可打印的 ASCII 字符。', en: 'Encoding reads UTF-16 code units one at a time and keeps printable ASCII characters unchanged.' },
      { zh: '将其他代码单元写成四位十六进制转义；Emoji 通常写成一对代理项转义。', en: 'Writes other code units as four-digit hexadecimal escapes; emoji commonly become a pair of surrogate escapes.' },
      { zh: '解码时识别 Unicode 转义及双反斜杠，逐段恢复文字并拒绝无效写法。', en: 'Decoding recognizes Unicode escapes and doubled backslashes, reconstructing text and rejecting invalid sequences.' },
    ],
    implementation: { zh: '使用 charCodeAt 和 String.fromCharCode 处理 UTF-16，不把输入当作代码执行。反斜杠单独转义，确保文字中的字面反斜杠可以往返恢复。', en: 'Uses charCodeAt and String.fromCharCode to process UTF-16 without executing the input. Backslashes are escaped separately so literal backslashes survive a round trip.' },
    limits: { zh: '解码支持 \\uXXXX 和 \\\\，不支持 \\u{1F600}、\\n 等其他转义；这是表示转换，不是加密。', en: 'Decoding supports \\uXXXX and \\\\, but not \\u{1F600}, \\n or other escape forms. This changes representation; it is not encryption.' },
  },
  D03: {
    summary: { zh: '先把文字变成 UTF-8 字节，再用 Base64 字符表示这些字节。', en: 'Turns text into UTF-8 bytes, then represents those bytes with Base64 characters.' },
    steps: [
      { zh: '用 UTF-8 编码中文、Emoji 和其他文字，得到实际字节序列。', en: 'Encodes Chinese, emoji and other text as a sequence of UTF-8 bytes.' },
      { zh: '由浏览器按每 6 位映射为 Base64 字符；URL 模式替换特殊字符并去掉末尾填充。', en: 'The browser maps each six-bit group to a Base64 character; URL mode replaces special characters and removes trailing padding.' },
      { zh: '解码时检查字符和长度、恢复填充，再将字节严格解读为 UTF-8 文字。', en: 'Decoding checks characters and length, restores padding, then strictly decodes the bytes as UTF-8 text.' },
    ],
    implementation: { zh: 'TextEncoder/TextDecoder 负责 UTF-8，btoa/atob 负责 Base64。Base64URL 将 +、/ 替换为 -、_；解码允许空白，但会拒绝非法 UTF-8 字节。', en: 'TextEncoder/TextDecoder handle UTF-8, while btoa/atob handle Base64. Base64URL replaces + and / with - and _; decoding permits whitespace but rejects invalid UTF-8 bytes.' },
    limits: { zh: '用于 UTF-8 文本，不用于还原任意二进制文件；编码不提供保密性，输入最多 200 万个 UTF-16 代码单元。', en: 'Designed for UTF-8 text, not arbitrary binary files. Encoding provides no secrecy; input is limited to 2 million UTF-16 code units.' },
  },
  D04: {
    summary: { zh: '按 URL 的规则转义文字，或把查询参数逐项展开。', en: 'Escapes text using URL rules or lists a URL’s query parameters.' },
    steps: [
      { zh: '根据操作区分整个 URL、单个参数值和查询参数解析。', en: 'Distinguishes whole-URL encoding, parameter-component encoding and query parsing.' },
      { zh: '编码时将需转义字符写成百分号字节；解析时分离查询部分，忽略片段标识。', en: 'Encoding represents escaped characters as percent-encoded bytes; parsing separates the query and ignores the fragment.' },
      { zh: '以有序键值对展示参数，保留重复键；没有查询部分的完整 URL 返回空列表。', en: 'Displays ordered key-value pairs, preserving duplicate keys; a full URL without a query produces an empty list.' },
    ],
    implementation: { zh: '调用 encodeURI/decodeURI 或 encodeURIComponent/decodeURIComponent，完整地址用 URL 解析，参数用 URLSearchParams 展开。查询解析会把 + 解释为空格，参数不会被合并成普通对象。', en: 'Uses encodeURI/decodeURI or encodeURIComponent/decodeURIComponent, URL for full addresses and URLSearchParams for query entries. Query parsing treats + as a space and keeps entries rather than merging them into an object.' },
    limits: { zh: '整个 URL 模式会保留地址分隔符，单参数模式会转义它们；参数解析不访问网址，非法百分号转义在解码时会报错。', en: 'Whole-URL mode preserves URL separators; component mode escapes them. Parsing does not visit the address, and malformed percent escapes cause decoding errors.' },
  },
  D05: {
    summary: { zh: '用同一个时间点连接 Unix 时间戳与不同时区的日期。', en: 'Connects Unix timestamps and dates in different time zones through the same instant.' },
    steps: [
      { zh: '按自 1970-01-01 UTC 起算的秒或毫秒读取 Unix 值，或解析 ISO 日期及其偏移。', en: 'Reads Unix seconds or milliseconds since 1970-01-01 UTC, or parses an ISO date and its offset.' },
      { zh: '将输入定位到一个时间点；没有偏移的日期使用所选 IANA 时区。', en: 'Resolves the input to an instant; dates without an offset use the selected IANA time zone.' },
      { zh: '同时输出秒、毫秒、UTC、北京时间和所选时区的日期表示。', en: 'Outputs seconds, milliseconds, UTC, Beijing time and the selected zone’s date representation.' },
    ],
    implementation: { zh: 'Luxon 负责 ISO 解析和时区转换，并使用浏览器的时区数据。秒输入先乘以 1000；时区只改变日期的显示方式，不改变同一时间点的 Unix 值。', en: 'Luxon handles ISO parsing and zone conversion using the browser’s time-zone data. Seconds are multiplied by 1000; changing the zone changes the displayed date, not the instant’s Unix value.' },
    limits: { zh: '拒绝无效日期、时区及夏令时前进时不存在的本地时间；夏令时回拨的重复时间请显式填写 UTC 偏移。', en: 'Rejects invalid dates, zones and local times skipped by a DST transition. Include an explicit UTC offset for repeated times during a fall-back transition.' },
  },
  D06: {
    summary: { zh: '让浏览器用密码学随机源生成 UUID v4 标识符。', en: 'Asks the browser to generate UUID v4 identifiers using a cryptographic random source.' },
    steps: [
      { zh: '检查生成数量是否为 1 到 1000 之间的整数。', en: 'Checks that the requested count is an integer from 1 to 1,000.' },
      { zh: '为每个标识符调用浏览器 UUID API，由浏览器设置随机位、版本位和变体位。', en: 'Calls the browser UUID API for each identifier, letting it set the random bits, version bits and variant bits.' },
      { zh: '将带连字符的标准 UUID 逐行列出，方便复制或下载。', en: 'Lists standard hyphenated UUIDs one per line for copying or downloading.' },
    ],
    implementation: { zh: '直接调用 crypto.randomUUID()，不使用 Math.random() 或时间戳拼接。随机数和 UUID 格式由浏览器的 Web Crypto 实现提供。', en: 'Calls crypto.randomUUID() directly instead of combining Math.random() values or timestamps. The browser’s Web Crypto implementation supplies both randomness and UUID formatting.' },
    limits: { zh: '仅生成 v4；随机 UUID 不提供绝对的无碰撞保证，也不按时间排序。需要支持该 API 的安全浏览器环境。', en: 'Generates v4 only. Random UUIDs do not guarantee zero collisions or chronological ordering; a secure browser environment supporting the API is required.' },
  },
  D07: {
    summary: { zh: '为文字或文件的原始字节计算固定长度的 SHA 摘要。', en: 'Computes a fixed-length SHA digest from the bytes of text or a file.' },
    steps: [
      { zh: '若选择了文件就读取文件字节，否则将输入文字编码为 UTF-8。', en: 'Reads the selected file’s bytes, or encodes the input text as UTF-8 when no file is selected.' },
      { zh: '将字节和选定的 SHA-256 或 SHA-512 算法交给浏览器计算。', en: 'Passes the bytes and selected SHA-256 or SHA-512 algorithm to the browser.' },
      { zh: '把摘要的每个字节写成两位十六进制，得到可复制的校验值。', en: 'Formats each digest byte as two hexadecimal digits to produce a copyable checksum.' },
    ],
    implementation: { zh: '使用 crypto.subtle.digest() 计算摘要，TextEncoder 处理文本编码，文件则通过 arrayBuffer() 读取。SHA-256 输出 64 位十六进制字符，SHA-512 输出 128 位。', en: 'Uses crypto.subtle.digest(), TextEncoder for text encoding and arrayBuffer() for file bytes. SHA-256 produces 64 hexadecimal characters; SHA-512 produces 128.' },
    limits: { zh: '文件最多 100 MiB，且整份读入内存；空白、换行和编码变化都会改变摘要。哈希是单向摘要，不能用来解密或证明来源。', en: 'Files are limited to 100 MiB and read fully into memory. Whitespace, newline and encoding changes affect the digest; a hash cannot decrypt data or prove its origin.' },
  },
  D08: {
    summary: { zh: '把两段文字按行对齐，找出保留、删除和新增的内容。', en: 'Compares two texts by line to identify unchanged, removed and added content.' },
    steps: [
      { zh: '读取原始文本和修改后文本，并应用是否忽略每行首尾空白的选项。', en: 'Reads the original and modified text and applies the option to ignore leading and trailing whitespace on each line.' },
      { zh: '由差异库比较行序列，将结果分成相同、删除和新增的连续片段。', en: 'The diff library compares line sequences and groups unchanged, removed and added sections.' },
      { zh: '用减号、加号和颜色标记差异；修改通常表现为旧行删除、新行加入。', en: 'Marks differences with minus signs, plus signs and colors; a modification typically appears as a removed line followed by an added line.' },
    ],
    implementation: { zh: '按需调用 diff 库的 diffLines()，传入首尾空白忽略选项和 2 秒计算时限。预览通过 textContent 写入文字，文本中的 HTML 不会作为页面执行。', en: 'Loads diff and calls diffLines() with the edge-whitespace option and a two-second calculation limit. Preview content is written using textContent, so HTML in the input is not executed.' },
    limits: { zh: '每段最多 20 万个 UTF-16 代码单元；仅做逐行比较，不提供字符级标记。复杂输入可能超时，需要缩小范围。', en: 'Each text is limited to 200,000 UTF-16 code units. Comparison is line-based without character-level highlights; complex inputs may time out and need to be reduced.' },
  },
  D09: {
    summary: { zh: '在可终止的独立线程中，用浏览器真正的正则引擎测试匹配和替换。', en: 'Tests matches and replacements with the browser’s actual regex engine in a terminable worker.' },
    steps: [
      { zh: '将表达式、标志、测试文本和替换模板发送给独立 Worker。', en: 'Sends the pattern, flags, input text and replacement template to a dedicated Worker.' },
      { zh: '逐次运行 RegExp，记录匹配位置、捕获组和命名组；空匹配按标志正确向后推进。', en: 'Runs RegExp repeatedly, recording indices, captures and named groups, and advancing correctly after empty matches.' },
      { zh: '展开替换模板并检查输出大小；任务完成、超时或取消后终止 Worker。', en: 'Expands the replacement template and checks output size, then terminates the Worker on completion, timeout or cancellation.' },
    ],
    implementation: { zh: '匹配由原生 RegExp 执行，主线程设置 2 秒超时并支持手动终止。零宽匹配在 u 或 v 标志下按 Unicode 码点推进，结果索引仍是 UTF-16 偏移；替换模板由工具展开并限制长度。', en: 'Native RegExp performs matching while the main thread enforces a two-second timeout and supports cancellation. Empty matches advance by Unicode code point under u or v, although indices remain UTF-16 offsets; the tool expands replacement tokens with an output-size limit.' },
    limits: { zh: '表达式最多 1000、输入 20 万、替换模板 1 万个 UTF-16 代码单元；展示最多 1000 个匹配，替换输出最多 400 万。可用标志取决于浏览器。', en: 'Limits are 1,000 UTF-16 code units for the pattern, 200,000 for input and 10,000 for the replacement template. Displays up to 1,000 matches and caps replacement output at 4 million code units; flag support depends on the browser.' },
  },
  D10: {
    summary: { zh: '展开 JWT 中可读的数据，帮助查看声明和时间字段。', en: 'Opens the readable parts of a JWT to inspect its claims and time fields.' },
    steps: [
      { zh: '按点号分成三段，分别取出 Header 和 Payload。', en: 'Splits the token into three dot-separated segments and selects the header and payload.' },
      { zh: '将前两段从 Base64URL 还原成 UTF-8 JSON，并要求它们都是对象。', en: 'Decodes the first two segments from Base64URL to UTF-8 JSON and requires both to be objects.' },
      { zh: '展示解码内容，将数值型 iat、exp、nbf 按 Unix 秒换算为 UTC 日期。', en: 'Displays the decoded data and converts numeric iat, exp and nbf Unix-second claims to UTC dates.' },
    ],
    implementation: { zh: '复用 Base64URL 解码流程，再使用 JSON.parse()；超出安全整数范围的数字通过解析器提供的原始片段保留为字符串。签名段不参与校验，所有解码内容以文本展示。', en: 'Reuses the Base64URL decoder, then calls JSON.parse(); integer values outside the safe range are retained as strings using the parser’s original source text. The signature segment is not verified, and decoded data is displayed as text.' },
    limits: { zh: '仅查看三段式 JWT，不支持五段式加密令牌；解码成功不代表签名有效、令牌可信或尚未过期。输入最多 10 万个 UTF-16 代码单元。', en: 'Inspects three-segment JWTs, not five-segment encrypted tokens. Successful decoding does not establish a valid signature, trust or validity period; input is limited to 100,000 UTF-16 code units.' },
  },
  D11: {
    summary: { zh: '用任意精度整数完成进制换算，不让大整数经过浮点数。', en: 'Converts integer bases with arbitrary-precision arithmetic instead of floating-point numbers.' },
    steps: [
      { zh: '识别正负号及对应进制前缀，检查每一位是否属于输入进制。', en: 'Reads the sign and matching base prefix, checking that every digit is valid for the input base.' },
      { zh: '从左到右按“当前值 × 输入进制 + 下一位”累积出 BigInt 整数。', en: 'Builds a BigInt from left to right using “current value × input base + next digit.”' },
      { zh: '调用整数的进制输出能力，写出目标进制的数字并恢复符号。', en: 'Formats the integer in the target base and restores its sign.' },
    ],
    implementation: { zh: '工具自行验证并逐位累积 BigInt，再调用 BigInt.toString(radix) 输出。输入与输出只涉及整数运算，因此可以精确保留超过 Number 安全范围的整数。', en: 'The tool validates digits and accumulates a BigInt, then uses BigInt.toString(radix) for output. Integer-only arithmetic preserves values beyond Number’s safe-integer range.' },
    limits: { zh: '支持二、八、十、十六进制整数，输入数字最多 1 万位；不支持小数或浮点数的二进制位模式。', en: 'Supports integers in bases 2, 8, 10 and 16, with up to 10,000 input digits. Fractions and floating-point bit patterns are unsupported.' },
  },
  D12: {
    summary: { zh: '先把颜色统一为 RGB，再换算其他表示并比较明暗对比。', en: 'Normalizes colors to RGB, then converts their notation and compares luminance contrast.' },
    steps: [
      { zh: '解析三位或六位 HEX、RGB，或把 HSL 的色相、饱和度、亮度换算为 RGB。', en: 'Parses three- or six-digit HEX and RGB, or converts HSL hue, saturation and lightness to RGB.' },
      { zh: '将 RGB 通道取整到 0–255，生成 HEX、RGB、HSL 和颜色预览。', en: 'Rounds RGB channels to 0–255 and produces HEX, RGB, HSL and a color preview.' },
      { zh: '将文字色和背景色转为线性亮度，计算对比度并检查普通文字的 AA、AAA 门槛。', en: 'Converts foreground and background colors to linear luminance, calculates contrast and checks AA and AAA thresholds for normal text.' },
    ],
    implementation: { zh: '颜色公式在本地直接计算；对比度采用 WCAG 的 sRGB 线性化、相对亮度权重以及 (较亮值 + 0.05) ÷ (较暗值 + 0.05)。普通文字 AA 门槛为 4.5:1，AAA 为 7:1。', en: 'Color formulas are calculated locally. Contrast uses WCAG sRGB linearization, relative-luminance weights and (lighter luminance + 0.05) ÷ (darker luminance + 0.05); normal-text thresholds are 4.5:1 for AA and 7:1 for AAA.' },
    limits: { zh: '仅支持不透明颜色及当前表单接受的 HEX/RGB/HSL 写法；不支持颜色名称、透明度或广色域空间。对比度不等同于整页无障碍评估。', en: 'Supports opaque colors in the accepted HEX/RGB/HSL syntax, not named colors, alpha or wide-gamut spaces. A contrast result is not a complete accessibility assessment.' },
  },
  D13: {
    summary: { zh: '在 JSON 和 YAML 的数据结构之间转换，同时检查数字是否会失真。', en: 'Converts JSON and YAML data structures while checking for numeric precision loss.' },
    steps: [
      { zh: '用对应格式的解析器读取数据，检查语法、重复 YAML 键和数字原始写法。', en: 'Parses the source format and checks syntax, duplicate YAML keys and original numeric spellings.' },
      { zh: '普通整数通过 BigInt 或无损数字保留；会舍入、溢出或下溢的小数和指数数值直接报错。', en: 'Preserves plain integers through BigInt or lossless numbers and rejects decimal or exponent values that would round, overflow or underflow.' },
      { zh: '将结构写成目标格式；YAML 转 JSON 时限制别名展开，并拒绝循环引用。', en: 'Serializes the target format; YAML-to-JSON conversion bounds alias expansion and rejects cyclic references.' },
    ],
    implementation: { zh: '按需加载 yaml 和 lossless-json。JSON 普通整数转为 BigInt；YAML 使用核心类型和 intAsBigInt，并在转成 JavaScript 数据前检查数值标量的原始文本，避免非有限数被悄悄写成 null。', en: 'Loads yaml and lossless-json on demand. Plain JSON integers become BigInt; YAML uses core types and intAsBigInt, with original numeric scalars checked before JavaScript conversion so nonfinite values cannot silently become null.' },
    limits: { zh: '注释、标签和锚点写法不能完整往返；不支持的精度及 .inf/.nan 会报错，可改用带引号的字符串。输入最多 200 万个 UTF-16 代码单元。', en: 'Comments, tags and anchor notation do not fully round-trip. Unsupported precision and .inf/.nan are rejected; use quoted strings when needed. Input is limited to 2 million UTF-16 code units.' },
  },
  D14: {
    summary: { zh: '按所选 SQL 方言识别语句，再整理关键字和缩进。', en: 'Recognizes SQL using the selected dialect, then organizes keywords and indentation.' },
    steps: [
      { zh: '读取 SQL 文本，并把所选方言传给格式化器。', en: 'Reads the SQL text and passes the selected dialect to the formatter.' },
      { zh: '由格式化库识别关键字、标识符、字符串和语句结构。', en: 'The formatting library recognizes keywords, identifiers, strings and statement structure.' },
      { zh: '以大写关键字和两空格缩进输出，可复制或下载为 SQL 文件。', en: 'Outputs uppercase keywords and two-space indentation for copying or downloading as SQL.' },
    ],
    implementation: { zh: '调用 sql-formatter 的 format()，设置 language、keywordCase: upper 和 tabWidth: 2。方言解析和排版由该库完成，工具本身不连接数据库。', en: 'Calls sql-formatter’s format() with language, keywordCase: upper and tabWidth: 2. The library handles dialect recognition and layout; the tool does not connect to a database.' },
    limits: { zh: '输入最多 20 万个 UTF-16 代码单元；仅支持列表中的方言，不执行 SQL，也不能代替数据库的语法与语义校验。', en: 'Input is limited to 200,000 UTF-16 code units and the listed dialects. Formatting does not execute SQL or replace database syntax and semantic checks.' },
  },
  D15: {
    summary: { zh: '把五段 Cron 规则读成一句话，并推算所选时区中的后续运行时间。', en: 'Explains a five-field Cron rule and calculates upcoming runs in the selected time zone.' },
    steps: [
      { zh: '确认表达式包含分、时、日、月、星期五个字段，再解析各字段规则。', en: 'Checks for the five minute, hour, day, month and weekday fields, then parses their rules.' },
      { zh: '将规则转换为当前界面语言的说明。', en: 'Converts the rule into a description in the current interface language.' },
      { zh: '从计算时刻开始，按指定时区求出接下来五次触发时间并显示 UTC 偏移。', en: 'Starting at calculation time, finds the next five triggers in the specified zone and displays their UTC offsets.' },
    ],
    implementation: { zh: 'cron-parser 负责解析及后续时间迭代，cronstrue 负责中英文说明，Luxon 负责时区日期输出。运行时间使用时区规则计算，不能简单按固定小时数相加。', en: 'cron-parser handles parsing and iteration, cronstrue supplies Chinese and English descriptions, and Luxon formats zoned dates. Runs follow time-zone rules rather than fixed-hour additions.' },
    limits: { zh: '仅接受五段 Cron，不支持 Quartz 等其他字段布局；结果用于解释与预览，不会创建定时任务，夏令时行为遵循解析库与时区数据。', en: 'Accepts five-field Cron only, not Quartz or other field layouts. Results are explanatory previews and do not schedule jobs; DST behavior follows the parser and time-zone data.' },
  },
  D16: {
    summary: { zh: '在普通字符和 HTML 实体写法之间转换，结果始终作为文字显示。', en: 'Converts between characters and HTML entities while keeping the result as plain text.' },
    steps: [
      { zh: '编码时识别需要实体表示的字符，例如尖括号、与号和引号。', en: 'Encoding identifies characters needing entity notation, such as angle brackets, ampersands and quotes.' },
      { zh: '由实体库生成命名或数字实体；解码时把实体还原为对应 Unicode 字符。', en: 'The entity library generates named or numeric references and decodes references back to Unicode characters.' },
      { zh: '通过文本结果区展示输出，不把解码后的标签插入网页。', en: 'Displays output in the text result area without inserting decoded tags into the page.' },
    ],
    implementation: { zh: '使用 he 库的 encode()/decode()，编码优先采用命名实体，并处理引号等敏感字符。结果通过 textContent 渲染，因此实体解码不会触发 HTML 执行。', en: 'Uses he’s encode()/decode(), preferring named references and encoding sensitive characters such as quotes. Results are rendered with textContent, so decoding entities does not execute HTML.' },
    limits: { zh: '实体转换不能净化任意 HTML，也不解析 DOM 结构；输入最多 200 万个 UTF-16 代码单元。', en: 'Entity conversion does not sanitize arbitrary HTML or parse a DOM structure. Input is limited to 2 million UTF-16 code units.' },
  },
  T01: {
    summary: { zh: '从字符、字素、英文单词、行和字节几个角度统计同一段文字。', en: 'Measures the same text as characters, graphemes, English words, lines and bytes.' },
    steps: [
      { zh: '按 Unicode 码点数出字符，再按字素边界合并组合字符和 Emoji 序列。', en: 'Counts Unicode code points, then groups combining characters and emoji sequences into grapheme clusters.' },
      { zh: '用英文词规则识别单词，并按 CRLF、CR 或 LF 拆分行。', en: 'Recognizes English words with a Latin-letter pattern and splits lines at CRLF, CR or LF.' },
      { zh: '将原文编码为 UTF-8，统计实际字节长度；输入停顿后自动更新。', en: 'Encodes the original text as UTF-8 and counts its bytes, updating after typing pauses.' },
    ],
    implementation: { zh: '字符串迭代器按码点计数，Intl.Segmenter 按 grapheme 分段，TextEncoder 计算 UTF-8 字节。英文词使用 A–Z/a–z 及允许的词内连接符匹配，更新延迟约 250 毫秒。', en: 'String iteration counts code points, Intl.Segmenter uses grapheme segmentation, and TextEncoder supplies UTF-8 bytes. English words use A–Z/a–z with permitted internal connectors; updates are debounced by about 250 milliseconds.' },
    limits: { zh: '英文词数不是多语言分词结果；空文本计 0 行，末尾换行会多计一行。字素结果取决于浏览器的 Unicode 分段支持。', en: 'The English word count is not multilingual word segmentation. Empty text has zero lines and a trailing newline adds a line; grapheme results depend on browser Unicode segmentation support.' },
  },
  T02: {
    summary: { zh: '把常见的文字整理操作应用到整段文本或每一行。', en: 'Applies common cleanup operations to the whole text or to individual lines.' },
    steps: [
      { zh: '读取选定操作，按需要将文本拆成独立的行。', en: 'Reads the selected operation and splits the text into lines when needed.' },
      { zh: '执行大小写转换、逐行去空白、去重、排序或移除空行。', en: 'Applies case conversion, per-line trimming, deduplication, sorting or blank-line removal.' },
      { zh: '行操作按原顺序或排序结果重新用 LF 换行连接，输出整理后的文字。', en: 'Joins processed lines with LF newlines in their retained or sorted order and outputs the result.' },
    ],
    implementation: { zh: '使用 JavaScript 字符串方法、Set 和数组操作；排序通过 localeCompare() 比较。去重保留首次出现的完整行，移除空行时用 trim() 判断该行是否只有空白。', en: 'Uses JavaScript string methods, Set and array operations, with localeCompare() for sorting. Deduplication keeps the first occurrence of each complete line, while blank-line removal tests whether trim() leaves any content.' },
    limits: { zh: '每次执行一种操作；去重区分大小写和空白，排序随浏览器区域规则变化。逐行操作会把原有换行统一为 LF。', en: 'Runs one operation at a time. Deduplication is case- and whitespace-sensitive, sorting follows browser locale rules, and line-based operations normalize newlines to LF.' },
  },
  T03: {
    summary: { zh: '把 Markdown 转成可预览的 HTML，再清除可能影响网页的内容。', en: 'Converts Markdown into previewable HTML, then removes content that could affect the page.' },
    steps: [
      { zh: '解析 Markdown 段落、标题、代码块和表格，原始 HTML 转为可见文字。', en: 'Parses Markdown paragraphs, headings, code blocks and tables, rendering raw HTML as visible text.' },
      { zh: '移除图片、嵌入内容和不允许的属性，再对生成的 HTML 做净化。', en: 'Removes images, embedded content and disallowed attributes, then sanitizes the generated HTML.' },
      { zh: '展示净化后的预览；下载时可选择原始 Markdown 或同样经过净化的 HTML。', en: 'Shows the sanitized preview and offers the original Markdown or the same sanitized HTML for download.' },
    ],
    implementation: { zh: 'marked 负责 GFM Markdown 解析，自定义渲染器转义原始 HTML 并将图片替换为说明文字，DOMPurify 负责净化。允许的链接需手动点击，在新窗口打开并设置 noopener/noreferrer。', en: 'marked parses GFM Markdown; custom renderers escape raw HTML and replace images with their text, while DOMPurify sanitizes the result. Allowed links require a click and open in a new tab with noopener/noreferrer.' },
    limits: { zh: '输入最多 20 万个 UTF-16 代码单元；不显示图片、原始 HTML 效果或远程嵌入。代码块只展示，不执行；预览在输入停顿后更新。', en: 'Input is limited to 200,000 UTF-16 code units. Images, raw HTML effects and remote embeds are disabled; code blocks are displayed without execution, and previews update after typing pauses.' },
  },
  T04: {
    summary: { zh: '将输入内容编码为带纠错信息的静态二维码图片。', en: 'Encodes your content into a static QR image with error-correction data.' },
    steps: [
      { zh: '读取文本、图片尺寸和 L/M/Q/H 纠错级别，检查内容与尺寸范围。', en: 'Reads the content, image size and L/M/Q/H error-correction level and checks their limits.' },
      { zh: '由二维码库选择编码与符号版本，生成数据、纠错信息和黑白模块矩阵。', en: 'The QR library selects encoding and symbol version and generates data, error correction and the black-and-white module matrix.' },
      { zh: '保留四模块留白边框，将矩阵绘制成 PNG，用于预览和下载。', en: 'Keeps a four-module quiet zone and renders the matrix as a PNG for preview and download.' },
    ],
    implementation: { zh: '按需加载 qrcode，调用 toDataURL() 并传入 width、errorCorrectionLevel 与 margin: 4。二维码编码、纠错和图像生成由该库完成，工具使用生成的 PNG 数据地址展示结果。', en: 'Loads qrcode on demand and calls toDataURL() with width, errorCorrectionLevel and margin: 4. The library handles encoding, error correction and image generation; the tool displays its PNG data URL.' },
    limits: { zh: '内容最多 2900 个 UTF-16 代码单元，实际容量还受字节数和纠错级别限制；尺寸设置为 64–2048 px，过小尺寸可能由库调整以容纳模块。网址二维码不提供短链或访问统计。', en: 'Content is capped at 2,900 UTF-16 code units, with actual capacity also depending on bytes and error correction. Size is set from 64–2,048 px; the library may adjust a size too small for the modules. URL codes provide no link shortening or visit tracking.' },
  },
  T05: {
    summary: { zh: '用密码学随机数挑选字符，并确保每组选中的字符集都出现。', en: 'Uses cryptographic randomness to choose characters while including every selected character group.' },
    steps: [
      { zh: '组合所选字符集，按选项排除 O、0、I、l、1，并检查密码长度。', en: 'Combines the selected character groups, optionally excludes O, 0, I, l and 1, and checks the requested length.' },
      { zh: '每组选取一个随机字符，再从合并字符集中随机补足长度。', en: 'Selects one random character from each group, then fills the remaining positions from the combined set.' },
      { zh: '随机打乱全部字符，避免必选字符总是出现在固定位置。', en: 'Shuffles all characters so required groups do not always appear in fixed positions.' },
    ],
    implementation: { zh: '使用 crypto.getRandomValues() 生成 32 位随机数，以拒绝采样去除取模偏差，再用 Fisher–Yates 洗牌。整个生成过程在本地完成，不使用 Math.random()，也不保存生成的密码。', en: 'Uses crypto.getRandomValues() for 32-bit random values, rejection sampling to avoid modulo bias, and a Fisher–Yates shuffle. Generation stays local, does not use Math.random(), and does not save passwords.' },
    limits: { zh: '至少选择一组字符；长度不得小于所选组数，最多 256。字符来自工具内置集合；网站自身的密码规则仍需另行满足。', en: 'Select at least one group; length must be at least the number of groups and no more than 256. Characters come from built-in sets, so a destination site’s password rules still apply.' },
  },
  T06: {
    summary: { zh: '先换到同一类单位的基准值，再换成目标单位。', en: 'Converts through a shared reference unit before producing the target value.' },
    steps: [
      { zh: '确认输入是有限数值，并且两个单位属于同一类别。', en: 'Checks that the input is finite and both units belong to the same category.' },
      { zh: '长度、重量、面积、体积和存储按固定倍率换算；温度先转为摄氏度。', en: 'Uses fixed factors for length, mass, area, volume and storage; temperature is first converted to Celsius.' },
      { zh: '应用目标单位的倍率或温度公式，显示换算等式。', en: 'Applies the target unit’s factor or temperature formula and displays the conversion equation.' },
    ],
    implementation: { zh: '本地单位表保存相对于基准单位的倍率，通常按“输入 × 原单位倍率 ÷ 目标倍率”计算。温度单独处理比例和偏移；MB 使用 1000 的幂，MiB 使用 1024 的幂。', en: 'A local unit table stores factors relative to a reference unit, normally calculated as input × source factor ÷ target factor. Temperature handles scale and offset separately; MB uses powers of 1000 and MiB powers of 1024.' },
    limits: { zh: '只支持表单列出的单位，gal 是美制液量加仑；使用 JavaScript Number，结果可能有浮点舍入，不适用于要求任意精度的计量。', en: 'Supports the listed units only; gal means US liquid gallon. JavaScript Number arithmetic can introduce rounding and is not intended for arbitrary-precision measurement.' },
  },
  T07: {
    summary: { zh: '区分日历上相差几天与实际经过多久，再进行日期加减。', en: 'Separates calendar-day differences from elapsed time, then adds or subtracts calendar days.' },
    steps: [
      { zh: '按选定时区解析开始和结束日期，拒绝无效日期及夏令时跳过的本地时间。', en: 'Parses the start and end dates in the selected zone, rejecting invalid dates and local times skipped by DST.' },
      { zh: '只比较年月日来计算自然日差，同时按真实时间点计算小时与秒差。', en: 'Compares year, month and day for calendar-day differences, while comparing actual instants for elapsed hours and seconds.' },
      { zh: '给开始日期加减日历天数，并计算当前时刻距离结束日期还有多少秒。', en: 'Adds or subtracts calendar days from the start date and calculates the seconds from now until the end date.' },
    ],
    implementation: { zh: 'Luxon 负责解析、时区和日历加减；自然日差将两端年月日映射到 UTC 日期后比较，实际时间差直接比较两个时间点。加一天按日历推进，因此跨夏令时可能只经过 23 或 25 小时。', en: 'Luxon handles parsing, zones and calendar arithmetic. Calendar-day differences compare UTC dates built from each endpoint’s year, month and day, while elapsed differences compare instants directly. Adding one calendar day can span 23 or 25 hours across DST.' },
    limits: { zh: '加减天数必须为整数且绝对值不超过 365000；倒计时只在执行时更新。回拨时重复的本地时间由日期库消歧，结果依赖所选时区规则。', en: 'The day adjustment must be an integer with magnitude no greater than 365,000. Countdown updates only when run; repeated fall-back local times are resolved by the date library using the selected zone’s rules.' },
  },
  F01: {
    summary: { zh: '按 CSV 的引号和分隔符规则读写表格，并与 JSON 行记录互换。', en: 'Reads and writes table data using CSV quoting and delimiter rules and converts it to or from JSON rows.' },
    steps: [
      { zh: '读取 UTF-8 文本，用 CSV 解析器识别分隔符、双引号转义和字段内换行。', en: 'Reads UTF-8 text and uses a CSV parser to recognize delimiters, escaped quotes and newlines within fields.' },
      { zh: '导入时保留字符串字段，校验表头与列数；导出时合并所有对象键，并精确保留数字文本。', en: 'Import keeps fields as strings and checks headers and row width; export collects keys from all objects and preserves numeric text exactly.' },
      { zh: '按选定格式输出；CSV 导出可给疑似公式单元格加单引号，并提供 JSON 表格预览。', en: 'Outputs the selected format; CSV export can prefix formula-like cells with an apostrophe, while JSON results have a table preview.' },
    ],
    implementation: { zh: 'Papa Parse 负责 CSV 解析和序列化，lossless-json 负责 JSON 数字保真。解析器的源位置用于仅忽略真正的空物理行，保留逗号空行、引号空值及空格；导出启用 escapeFormulae 时会改变相关单元格内容。', en: 'Papa Parse handles CSV parsing and serialization, while lossless-json preserves JSON numbers. Parser source positions skip only truly empty physical lines, retaining comma-only records, quoted empties and spaces; enabling escapeFormulae changes affected cell contents on export.' },
    limits: { zh: '仅支持平面对象数组或二维数组；含表头导入时，表头须非空且唯一，各行列数须一致。文件最多 2 MiB，预览最多 20 行；嵌套对象和混合行类型会报错。', en: 'Supports flat object arrays or two-dimensional arrays. Imports with headers require nonempty, unique headers and consistent row widths. Files are capped at 2 MiB and previews at 20 rows; nested objects and mixed row types are rejected.' },
  },
};
