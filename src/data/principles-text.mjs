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

const technicalTextDetails = {
  D01: {
    details: [
      {
        title: { zh: '语法树与数字精度', en: 'Structure and numeric precision' },
        paragraphs: [{ zh: 'JSON 文本中的数字只是十进制字符序列，而 JavaScript Number 使用 IEEE 754 双精度浮点表示。整数超过 2⁵³−1 后，相邻值可能映射到同一个 Number。这里先用 lossless-json 解析，数字保存在 LosslessNumber 中，不先转换成浮点数。因此即使整数很长，重新序列化时也能写回原数字，而不是把已经舍入的值再排版。', en: 'A JSON number begins as decimal text, whereas JavaScript Number uses IEEE 754 double precision. Above 2⁵³−1, adjacent integers may map to the same Number. lossless-json parses numbers into LosslessNumber values without first converting them to floating point, allowing serialization to retain the original numeric text rather than format a rounded value.' }],
      },
      {
        title: { zh: '格式化、压缩与校验共用一条路径', en: 'One path for formatting, minification and validation' },
        paragraphs: [{ zh: '三个操作都会先调用库的 parse()，所以字符串内部的空格、转义引号和换行不会被误当成排版删除。格式化向 stringify() 传入缩进宽度 2，压缩传入 0；校验同样完成解析和序列化，但界面只显示有效状态。这不是用正则清除空白，也不会尝试猜测缺失的引号或逗号。下面是实际流程的简化示意。', en: 'All three operations begin with parse(), so spaces, escaped quotes and newlines inside strings are not mistaken for removable layout. stringify() receives an indentation width of 2 for formatting or 0 for minification. Validation follows the same parse-and-serialize path but displays only validity. It neither removes whitespace with a regex nor guesses missing quotes or commas; the code below is a simplified flow.' }],
        code: { zh: 'value = losslessParse(input)\noutput = losslessStringify(value, null, minify ? 0 : 2)', en: 'value = losslessParse(input)\noutput = losslessStringify(value, null, minify ? 0 : 2)' },
      },
      {
        title: { zh: '语法正确不等于业务正确', en: 'Syntax validity versus application validity' },
        paragraphs: [{ zh: '解析失败会保留库返回的位置说明，方便定位无效字符，但本工具不检查字段是否齐全、类型是否符合接口约定，也不执行 JSON Schema。解析后的结构和输出字符串同时占用内存，深层嵌套还受运行时调用栈约束；200 万个 UTF-16 代码单元只是输入上限，不代表任意形状的数据都能以同样速度处理。', en: 'Parser errors retain the library’s position information, but the tool does not check required fields, API-specific types or JSON Schema. Parsed structures and output strings coexist in memory, and deeply nested input is also constrained by the runtime stack. The 2-million-code-unit limit is an input bound, not a promise that every data shape has the same processing cost.' }],
      },
    ],
    example: {
      input: { zh: '操作：格式化\n{"n":9007199254740993,"ok":true}', en: 'Mode: Format\n{"n":9007199254740993,"ok":true}' },
      output: { zh: '{\n  "n": 9007199254740993,\n  "ok": true\n}', en: '{\n  "n": 9007199254740993,\n  "ok": true\n}' },
      explanation: { zh: '输出采用两空格缩进，n 的最后一位仍为 3。若先用普通 JSON.parse() 将这个数读成 Number，它会成为 9007199254740992；这里通过无损数字表示避免了这一步。', en: 'The output uses two-space indentation and n still ends in 3. Ordinary JSON.parse() would read this value as the Number 9007199254740992; lossless number storage avoids that conversion.' },
    },
  },
  D02: {
    details: [
      {
        title: { zh: '码点与 UTF-16 代码单元', en: 'Code points versus UTF-16 code units' },
        paragraphs: [{ zh: 'JavaScript 字符串按 UTF-16 存储。基本多文种平面内的“中”占一个代码单元，码点超过 U+FFFF 的 😀 则占高、低两个代理项。工具使用 charCodeAt() 逐单元读取，因此输出分别是一个和两个四位转义，并不是把 Emoji 的码点直接写成一个超长的反斜杠 u 表达式。下面给出代理对的标准换算关系。', en: 'JavaScript strings use UTF-16. The BMP character 中 occupies one code unit, while 😀 lies above U+FFFF and occupies a high and a low surrogate. The tool reads units with charCodeAt(), so these become one and two four-digit escapes respectively, rather than one oversized backslash-u escape. The formula below describes the standard surrogate-pair mapping.' }],
        code: { zh: 'U = codePoint − 0x10000\nhigh = 0xD800 + (U >> 10)\nlow  = 0xDC00 + (U & 0x3FF)\nU+1F600 → D83D DE00', en: 'U = codePoint − 0x10000\nhigh = 0xD800 + (U >> 10)\nlow  = 0xDC00 + (U & 0x3FF)\nU+1F600 → D83D DE00' },
      },
      {
        title: { zh: '逐字符扫描，而不是执行字符串', en: 'Scanning text without executing it' },
        paragraphs: [{ zh: '编码保留 ASCII 32–126 范围的可打印字符，反斜杠单独加倍，其他代码单元写成小写十六进制并补足四位。解码器遇到反斜杠时检查下一字符：只有双反斜杠，或 u 后恰好四位十六进制数字会被接受；随后用 String.fromCharCode() 还原。整个过程不调用 eval()，输入不能借此成为可执行代码。', en: 'Encoding preserves printable ASCII from 32 through 126, doubles backslashes and writes other code units as four-digit lowercase hexadecimal escapes. The decoder examines each backslash and accepts either another backslash or u followed by four hexadecimal digits, then reconstructs units with String.fromCharCode(). It never calls eval(), so input is not executed.' }],
      },
      {
        title: { zh: '可逆范围与未做的规范化', en: 'Round trips and normalization boundaries' },
        paragraphs: [{ zh: '由于反斜杠也被编码，原文中看起来像转义的六个字面字符不会和一个真实字符混淆。解码只处理本工具约定的两种形式，不把反斜杠 n 转为换行，也不解释花括号码点语法。它按代码单元保留内容，不做 Unicode 正规化或孤立代理项修复；视觉相同但编码不同的文字仍可能产生不同输出。', en: 'Escaping backslashes keeps six literal characters that resemble an escape distinct from an actual character. Decoding recognizes only the tool’s two supported forms: it does not interpret backslash-n or brace-style code-point escapes. It preserves code units without Unicode normalization or repairing lone surrogates, so visually identical text can still encode differently.' }],
      },
    ],
    example: {
      input: { zh: '操作：编码\n中😀', en: 'Mode: Encode\n中😀' },
      output: { zh: '\\u4e2d\\ud83d\\ude00', en: '\\u4e2d\\ud83d\\ude00' },
      explanation: { zh: '两个 Unicode 码点在 UTF-16 中共占三个代码单元，因此得到三组转义。把这段输出切换到解码模式处理，会恢复为同样的“中😀”。', en: 'The two Unicode code points occupy three UTF-16 code units, producing three escapes. Decoding this output restores the same 中😀 text.' },
    },
  },
  D03: {
    details: [
      {
        title: { zh: '从 UTF-8 字节到六位分组', en: 'From UTF-8 bytes to six-bit groups' },
        paragraphs: [{ zh: 'Base64 表示的是字节而非字符。TextEncoder 先把文字编码成 UTF-8，例如“中”为 E4 B8 AD，😀 为 F0 9F 98 80。标准 Base64 每三个字节形成 24 位，再拆成四个 6 位索引，从 64 字符表中取字符；末组不足三个字节时用等号表示填充。这个位分组由浏览器 btoa() 完成，工具不自行实现编码表。', en: 'Base64 represents bytes, not characters. TextEncoder first emits UTF-8: 中 becomes E4 B8 AD and 😀 becomes F0 9F 98 80. Standard Base64 groups three bytes into 24 bits, splits them into four six-bit indices and looks up a 64-character alphabet, using equals signs for incomplete final groups. Browser btoa(), rather than a custom encoder, performs this mapping.' }],
        code: { zh: '3 字节 = 24 位 = 4 × 6 位\n有填充时的字符数 = 4 × ceil(字节数 / 3)', en: '3 bytes = 24 bits = 4 × 6 bits\nPadded character count = 4 × ceil(byteCount / 3)' },
      },
      {
        title: { zh: '浏览器 API 与 URL 变体', en: 'Browser APIs and the URL variant' },
        paragraphs: [{ zh: 'btoa() 需要每个字符都在 0–255 范围内的二进制字符串，因此工具把 Uint8Array 分成小块转换，避免一次展开过多参数。Base64URL 保持同样的六位数据，只把 +、/ 改成 -、_ 并去掉末尾等号。解码先清除空白，再按开关还原字母表和必要填充；长度余 1 或填充位置不合法会被拒绝。', en: 'btoa() expects a binary string whose characters fit in 0–255. The tool converts Uint8Array chunks to avoid spreading too many arguments at once. Base64URL keeps the same six-bit data but substitutes - and _ for + and / and removes trailing equals signs. Decoding removes whitespace, restores the selected alphabet and padding, and rejects impossible lengths or malformed padding.' }],
      },
      {
        title: { zh: '解码成功还需要 UTF-8 有效', en: 'Valid Base64 is not necessarily valid UTF-8' },
        paragraphs: [{ zh: 'atob() 恢复字节后，TextDecoder 使用 fatal: true 解读 UTF-8；因此一串语法合法的 Base64 若表示图片或任意二进制内容，也可能因不是有效文字而报错。Base64 通常把体积扩大约三分之一，本工具还会同时保留输入、字节和结果；它是可逆表示，没有密钥，也不会增加内容的保密性。', en: 'After atob() restores bytes, TextDecoder reads UTF-8 with fatal: true. Syntactically valid Base64 for an image or arbitrary binary data can therefore fail because it is not valid text. Base64 generally expands data by about one third, and input, byte buffers and output coexist in memory. It is reversible, uses no secret key and provides no confidentiality.' }],
      },
    ],
    example: {
      input: { zh: '操作：编码；Base64URL：关闭\n中😀', en: 'Mode: Encode; Base64URL: off\n中😀' },
      output: { zh: '5Lit8J+YgA==', en: '5Lit8J+YgA==' },
      explanation: { zh: '原文共有 7 个 UTF-8 字节，标准输出长 12 个字符，末尾含两个填充等号。开启 Base64URL 后，同一输入得到 5Lit8J-YgA。', en: 'The text contains seven UTF-8 bytes, yielding 12 Base64 characters including two padding signs. With Base64URL enabled, the same input produces 5Lit8J-YgA.' },
    },
  },
  D04: {
    details: [
      {
        title: { zh: '百分号编码与地址结构', en: 'Percent encoding and URL structure' },
        paragraphs: [{ zh: '百分号编码先将字符编码为 UTF-8 字节，再用 %HH 表示需要转义的字节。encodeURI() 假定输入是完整地址，会保留冒号、斜杠、问号等结构字符；encodeURIComponent() 假定输入是一个参数值，会把这些字符也转义。两种解码函数同样有区别，不能总用整址解码替代参数解码。选择范围决定了分隔符究竟是结构还是数据。', en: 'Percent encoding uses UTF-8 bytes and represents escaped bytes as %HH. encodeURI() assumes a full address and preserves structural characters such as colons, slashes and question marks; encodeURIComponent() treats them as component data and escapes them. The corresponding decoders also differ. The selected scope determines whether a separator is structure or literal data.' }],
      },
      {
        title: { zh: '重复参数需要有序列表', en: 'Repeated parameters need an ordered list' },
        paragraphs: [{ zh: '解析路径先识别带协议的完整地址或 // 开头的地址，再由 URL 提取 searchParams；裸查询则先移除 # 后的片段部分。URLSearchParams 按表单查询规则解码，+ 在此代表空格，而 %2B 代表字面加号。展开结果保留键值对顺序，避免把 tag=a&tag=b 转成普通对象后只剩一个 tag。完整地址没有问号时也不会凭空生成参数。', en: 'Parsing first recognizes absolute or //-prefixed addresses and uses URL.searchParams. For raw queries, it removes the fragment beginning with # first. URLSearchParams applies form-query rules: + means a space, while %2B means a literal plus sign. An ordered entry list preserves tag=a&tag=b instead of losing one tag in an object, and queryless full addresses yield no entries.' }],
        code: { zh: 'tag=a&tag=b → [["tag", "a"], ["tag", "b"]]\nq=a+b → [["q", "a b"]]\nq=a%2Bb → [["q", "a+b"]]', en: 'tag=a&tag=b → [["tag", "a"], ["tag", "b"]]\nq=a+b → [["q", "a b"]]\nq=a%2Bb → [["q", "a+b"]]' },
      },
      {
        title: { zh: '解析不是发起网络请求', en: 'Parsing is not a network request' },
        paragraphs: [{ zh: 'URL 和 URLSearchParams 都只在内存中分析字符串；工具不会打开该地址，也不检查服务器是否存在。百分号解码依赖内建函数，损坏的转义序列会报错；查询解析则采用 URLSearchParams 自己的容错规则，两者并非完全相同的校验器。片段中的问号不是查询起点，裸参数值中的空格也不会为排版而被清除。', en: 'URL and URLSearchParams analyze strings in memory without opening addresses or checking a server. Direct percent decoding uses built-in functions and throws on malformed escapes, whereas query parsing follows URLSearchParams’ own forgiving rules; they are not identical validators. A question mark in a fragment does not begin a query, and spaces in raw parameter values are not trimmed for presentation.' }],
      },
    ],
    example: {
      input: { zh: '操作：解析查询参数\nhttps://example.com/?tag=a&tag=b', en: 'Mode: Parse query parameters\nhttps://example.com/?tag=a&tag=b' },
      output: { zh: '[\n  [\n    "tag",\n    "a"\n  ],\n  [\n    "tag",\n    "b"\n  ]\n]', en: '[\n  [\n    "tag",\n    "a"\n  ],\n  [\n    "tag",\n    "b"\n  ]\n]' },
      explanation: { zh: '两个同名键都保留，顺序与地址一致。若输入改为 https://example.com/path#part，则没有查询部分，结果为 []。', en: 'Both repeated keys remain in their original order. Changing the input to https://example.com/path#part produces [] because the address has no query.' },
    },
  },
  D05: {
    details: [
      {
        title: { zh: '时间点与墙上时钟', en: 'An instant versus a wall-clock time' },
        paragraphs: [{ zh: 'Unix 值描述从 1970-01-01T00:00:00Z 起经过的时间，时区不是这个数字的一部分。工具把秒乘以 1000 后交给 Luxon 的 fromMillis()；毫秒直接读取。显示北京时间或纽约时间时，只改变同一时间点的当地日期和 UTC 偏移，不在时间戳上再加八小时。把时区偏移直接加到 Unix 值会得到另一个时间点。', en: 'A Unix value measures time since 1970-01-01T00:00:00Z; a time zone is not part of that number. Seconds are multiplied by 1,000 before Luxon.fromMillis(), while milliseconds are used directly. Displaying Beijing or New York time changes the local date and UTC offset for the same instant. Adding eight hours to the Unix value itself would produce a different instant.' }],
        code: { zh: 'milliseconds = seconds × 1000\n同一时间点：\n1970-01-01T00:00:00Z\n1970-01-01T08:00:00+08:00', en: 'milliseconds = seconds × 1000\nThe same instant:\n1970-01-01T00:00:00Z\n1970-01-01T08:00:00+08:00' },
      },
      {
        title: { zh: 'ISO 偏移与 IANA 时区', en: 'ISO offsets and IANA zones' },
        paragraphs: [{ zh: '日期输入由 DateTime.fromISO() 解析。带 Z 或显式偏移的日期先由该偏移确定时间点；没有偏移时，则借助选定 IANA 时区来解释当地时间。IANA 名称包含历史和夏令时规则，而 +08:00 只是固定偏移。Luxon 使用运行环境提供的时区能力，再将结果输出为 UTC、Asia/Shanghai 以及用户选择的时区。', en: 'DateTime.fromISO() parses date input. Z or an explicit offset determines the instant; otherwise the selected IANA zone interprets the local clock time. An IANA name carries historical and DST rules, whereas +08:00 is only a fixed offset. Luxon uses the runtime’s zone support and formats the result in UTC, Asia/Shanghai and the selected zone.' }],
      },
      {
        title: { zh: '夏令时空缺与重复时段', en: 'DST gaps and overlaps' },
        paragraphs: [{ zh: '某些地区春季会跳过一段本地时间，秋季又会重复一段。日期库可能自动把不存在的时间向后调整，因此工具把解析后的年月日时分与无偏移输入比较，不一致就拒绝。回拨时同一钟点可能对应两个时间点，建议输入明确偏移。数值和日期还受 JavaScript 日期范围限制；这里不模拟闰秒，也不提供任意精度的亚毫秒计算。', en: 'Some zones skip local times in spring and repeat them in autumn. Because a date library may shift a nonexistent time forward, the tool compares the parsed local year, month, day, hour and minute with offset-free input and rejects a mismatch. Explicit offsets disambiguate overlaps. Values remain bounded by JavaScript date ranges; leap seconds and arbitrary-precision submillisecond arithmetic are not modeled.' }],
      },
    ],
    example: {
      input: { zh: '操作：Unix 秒 → 日期\n时区：Asia/Shanghai\n0', en: 'Mode: Unix seconds → date\nZone: Asia/Shanghai\n0' },
      output: { zh: 'Unix 秒: 0\nUnix 毫秒: 0\nUTC: 1970-01-01T00:00:00.000Z\n北京时间: 1970-01-01T08:00:00.000+08:00\n选定时区: 1970-01-01T08:00:00.000+08:00', en: 'Unix seconds: 0\nUnix milliseconds: 0\nUTC: 1970-01-01T00:00:00.000Z\nBeijing time: 1970-01-01T08:00:00.000+08:00\nSelected zone: 1970-01-01T08:00:00.000+08:00' },
      explanation: { zh: '时间戳保持为 0，UTC 显示午夜，北京显示早上八点；这两种日期表示同一个时间点，并不是把时间戳改成了 28800。', en: 'The timestamp stays zero while UTC displays midnight and Beijing displays 08:00. These are two representations of one instant, not a change to timestamp 28800.' },
    },
  },
  D06: {
    details: [
      {
        title: { zh: '128 位标识符中的随机部分', en: 'The random portion of a 128-bit identifier' },
        paragraphs: [{ zh: 'UUID 是一个 128 位值，通常用 32 个十六进制数字加四个连字符写成 8-4-4-4-12 格式。v4 固定版本字段为二进制 0100，RFC 变体还固定两个高位，留下 122 个随机位。于是第三组首位为 4，第四组首位只能是 8、9、a 或 b。格式标记不是额外随机熵，不能把 128 位全都算作独立随机位。', en: 'A UUID is a 128-bit value commonly written as 32 hexadecimal digits with four hyphens in an 8-4-4-4-12 layout. Version 4 fixes its version field to 0100 and the RFC variant fixes two more high bits, leaving 122 random bits. The third group starts with 4 and the fourth with 8, 9, a or b; those format bits do not contribute random entropy.' }],
        code: { zh: 'xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx\n随机位数 = 128 − 4 − 2 = 122', en: 'xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx\nRandom bits = 128 − 4 − 2 = 122' },
      },
      {
        title: { zh: '随机源和格式由浏览器负责', en: 'The browser supplies randomness and formatting' },
        paragraphs: [{ zh: '工具检查数量为 1–1000 的整数，再对每条结果调用 crypto.randomUUID()。密码学随机源、版本与变体位设置、十六进制格式化都由浏览器实现提供，代码不拼接当前时间、设备编号或 Math.random()。批量结果用换行连接，复制和下载使用同一份内存中的字符串，不把生成值写入浏览器偏好存储。', en: 'After checking an integer count from 1 to 1,000, the tool calls crypto.randomUUID() for every result. The browser supplies cryptographic randomness, version and variant bits and hexadecimal formatting; the code does not combine timestamps, device identifiers or Math.random(). Batch results are joined with newlines and reused for copying and downloading without being saved as preferences.' }],
      },
      {
        title: { zh: '碰撞概率与适用场景', en: 'Collision probability and intended use' },
        paragraphs: [{ zh: '随机抽样不提供数学上的唯一性保证。理想独立随机且碰撞概率很小时，生成 n 个值的碰撞概率约为 n(n−1)/(2×2¹²²)，但工具不会维护全局登记册来证明唯一性。v4 也不携带排序时间。UUID 可用于分布式记录标识；需要强制唯一约束时仍应由数据库检查，不能把它的随机外观当作访问授权。', en: 'Random sampling cannot prove uniqueness. Under ideal independent randomness and when the collision probability is small, the probability for n values is approximately n(n−1)/(2×2¹²²), but this tool keeps no global registry. v4 also carries no ordering timestamp. UUIDs suit distributed identifiers; databases should still enforce required uniqueness, and random-looking identifiers are not authorization.' }],
      },
    ],
    example: {
      input: { zh: '生成数量：1', en: 'Count: 1' },
      output: { zh: '6f9619ff-8b86-4e1c-9b66-42d4b8f2f9a1', en: '6f9619ff-8b86-4e1c-9b66-42d4b8f2f9a1' },
      explanation: { zh: '这是一次可能结果的格式示例，每次实际生成都会重新取随机值。第三组以 4 开头，第四组以 9 开头，符合 v4 和 RFC 变体的位布局；不要将这个公开示例用于秘密值。', en: 'This illustrates one possible result; actual runs draw new randomness. The third group starts with 4 and the fourth with 9, matching v4 and RFC variant bits. This public example is not a secret.' },
    },
  },
  D07: {
    details: [
      {
        title: { zh: '摘要处理的是精确字节', en: 'Digests operate on exact bytes' },
        paragraphs: [{ zh: '同样看起来是文字，字节内容仍可能不同。工具用 TextEncoder 将文本编码为 UTF-8，不自动删除空白、统一换行或做 Unicode 正规化。选择文件后则优先使用文件的原始 ArrayBuffer，不把文件内容先解读成文字。因此 LF 与 CRLF、有无 UTF-8 BOM、组合字符与预组合字符，都可能得到不同的摘要，这是按字节校验的正常结果。', en: 'Text that looks identical can still have different bytes. TextEncoder produces UTF-8 without trimming whitespace, normalizing line endings or applying Unicode normalization. A selected file takes priority and supplies its raw ArrayBuffer without text decoding. LF versus CRLF, a UTF-8 BOM and composed versus decomposed characters can therefore produce different digests, as expected for byte-level checks.' }],
      },
      {
        title: { zh: 'SHA 标准与 Web Crypto 的职责', en: 'SHA standards and Web Crypto’s role' },
        paragraphs: [{ zh: '从标准原理看，SHA-256 以 512 位消息块处理数据，SHA-512 使用 1024 位块；标准规定填充、消息扩展和压缩轮，最终得到 256 或 512 位摘要。这些步骤并不由页面手写实现，而是交给 crypto.subtle.digest()。工具只选择算法、传入字节，再把每个结果字节补足两位十六进制，因此输出分别是 64 和 128 个字符。', en: 'At the standards level, SHA-256 processes 512-bit message blocks and SHA-512 uses 1,024-bit blocks. Padding, message expansion and compression rounds yield 256- or 512-bit digests. The page does not implement these rounds; crypto.subtle.digest() does. The tool selects the algorithm, supplies bytes and formats every result byte as two hexadecimal digits, producing 64 or 128 characters.' }],
        code: { zh: 'bytes = UTF8(text) 或 file.arrayBuffer()\ndigestBytes = await crypto.subtle.digest("SHA-256", bytes)\nhex = 每个字节转为两位小写十六进制', en: 'bytes = UTF8(text) or file.arrayBuffer()\ndigestBytes = await crypto.subtle.digest("SHA-256", bytes)\nhex = each byte formatted as two lowercase hex digits' },
      },
      {
        title: { zh: '完整读入与校验能力的边界', en: 'Whole-buffer memory use and verification limits' },
        paragraphs: [{ zh: '当前流程把整个文件读入内存，再一次性调用 digest()，不是流式分块哈希，所以设置了 100 MiB 文件上限。Promise 返回并不代表文件不会占用完整缓冲区。相同摘要可以用于比较文件是否与可信公布值一致，但普通 SHA 不含密钥，无法证明发送者身份，也不是适合直接保存密码的慢速派生算法；工具不提供 HMAC 或签名验证。', en: 'The current flow reads a whole file and calls digest() once rather than hashing a stream, hence the 100 MiB file cap. Returning a Promise does not remove whole-buffer memory use. A digest can be compared with a trusted published checksum, but unkeyed SHA cannot identify a sender and is not a slow password-storage derivation function. HMAC and signature verification are not provided.' }],
      },
    ],
    example: {
      input: { zh: '算法：SHA-256；未选择文件\nabc', en: 'Algorithm: SHA-256; no file selected\nabc' },
      output: { zh: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', en: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' },
      explanation: { zh: '输入恰好是三个字节 61 62 63，末尾没有换行。增加一个换行或把 a 改为 A 都会改变摘要；输出长度固定，与输入文件大小无关。', en: 'The input is exactly bytes 61 62 63, with no trailing newline. Adding a newline or changing a to A changes the digest; digest length is fixed regardless of input size.' },
    },
  },
  D08: {
    details: [
      {
        title: { zh: '以行作为比较单元', en: 'Lines as comparison tokens' },
        paragraphs: [{ zh: '逐行差异比较先把输入变成行序列，再寻找可保留的共同片段和需要插入、删除的片段。这里调用 diff 库的 diffLines()，不是在页面中手写逐字符编辑算法。库默认把 LF 或 CRLF 换行附在所属行上，所以末行有没有换行也可能影响比较；它不会按语义判断“这一行被移动了”，移动通常会表现为删除加新增。', en: 'Line comparison tokenizes text into lines, finds shared sections and identifies insertions and deletions. The tool uses diff.diffLines() rather than implementing a character-edit algorithm. By default, the library attaches LF or CRLF to its line, so a final newline can affect equality. It does not semantically identify moved lines; a move commonly appears as removal plus addition.' }],
      },
      {
        title: { zh: '空白忽略的精确含义', en: 'Exactly what ignoring whitespace means' },
        paragraphs: [{ zh: '开启忽略选项时，当前库在比较每行是否相同时使用 trim() 去掉首尾空白，不会删除行中间的空格。例如两端的缩进可以忽略，但 a b 与 a  b 仍可能不同。这个选项改变的是行的相等判定，不是对两份源文本先做永久清理；工具不会把某个操作结果自动覆盖回输入框。', en: 'With whitespace ignoring enabled, this library version trims line edges for equality checks; it does not remove internal spaces. Leading indentation may therefore be ignored while a b and a  b can still differ. The option changes comparison equality rather than permanently cleaning both source texts, and the result is not written over the inputs.' }],
      },
      {
        title: { zh: '差异片段、显示和计算开销', en: 'Diff components, rendering and cost' },
        paragraphs: [{ zh: '库返回含 value、added、removed 等字段的连续片段。工具给新增行加“+ ”、删除行加“- ”，保留行加两个空格，并在预览中着色；相邻删除和新增表达一次修改，不代表逐字替换。每边限制 20 万个代码单元并传入 2 秒库级超时，但该计算不在 Worker 中，复杂的高度不同文本仍可能短暂占用主线程。', en: 'The library returns contiguous components with value, added and removed fields. Added lines receive “+ ”, removed lines “- ” and unchanged lines two spaces, with colored previews. Adjacent removals and additions represent changes without character-level replacement claims. Each side is capped at 200,000 code units with a two-second library timeout; computation is not in a Worker and complex dissimilar input can still occupy the main thread briefly.' }],
        code: { zh: '相同片段 → "  " + 行内容\n删除片段 → "- " + 行内容\n新增片段 → "+ " + 行内容', en: 'Unchanged → "  " + line\nRemoved   → "- " + line\nAdded     → "+ " + line' },
      },
    ],
    example: {
      input: { zh: '忽略首尾空白：关闭；两段末尾均有换行\n原文：\na\nb\n修改后：\na\nc\n', en: 'Ignore edge whitespace: off; both texts end with a newline\nOriginal:\na\nb\nModified:\na\nc\n' },
      output: { zh: '  a\n- b\n+ c\n', en: '  a\n- b\n+ c\n' },
      explanation: { zh: '第一行保留，第二行 b 被删除，c 被加入。结果前缀中的空格属于差异标记，不是原文中新增加的缩进；预览会为删除与新增分别着色。', en: 'The first line remains; b is removed and c is added. Spaces in the prefixes are diff markers rather than newly inserted source indentation; the preview colors removals and additions separately.' },
    },
  },
};

Object.assign(technicalTextDetails, {
  D09: {
    details: [
      {
        title: { zh: '原生引擎与可终止执行', en: 'Native matching with terminable execution' },
        paragraphs: [{ zh: 'JavaScript 正则可能因大量回溯而耗时，尤其是重复量词嵌套且最终匹配失败时。工具不尝试静态判断表达式是否安全，而是在独立 Worker 中构造 RegExp。主线程启动 2 秒定时器，收到结果、发生异常、超时或点击取消后都会终止 Worker。它是运行隔离与时间限制，不是换成另一个无回溯引擎，也不会把正则发送到服务器。', en: 'JavaScript regexes can spend excessive time backtracking, particularly with nested repetition followed by failure. Instead of trying to prove a pattern safe statically, the tool constructs RegExp inside a dedicated Worker. The main thread starts a two-second timer and terminates the Worker on completion, errors, timeout or cancellation. This isolates execution; it does not replace the engine with a nonbacktracking one or send the pattern to a server.' }],
      },
      {
        title: { zh: '匹配游标与 Unicode 边界', en: 'Match cursors and Unicode boundaries' },
        paragraphs: [{ zh: '每次 exec() 后记录完整匹配、index、位置捕获组和命名捕获组；没有 g 标志时只列出一次匹配。全局正则遇到零长度匹配时，exec() 不会自动推进游标，工具因此手动移动 lastIndex：普通模式按一个 UTF-16 单元，u 或 v 模式按一个 Unicode 码点。索引本身仍是 UTF-16 偏移，所以 Emoji 后紧接的字符可能从索引 2 而不是 1 开始。', en: 'Each exec() result records the full match, index, positional captures and named captures. Without g, only one match is listed. Because exec() does not advance after a zero-length global match, the tool moves lastIndex by one UTF-16 unit normally or one Unicode code point under u or v. Returned indices still count UTF-16 units, so a character after an emoji can start at index 2 rather than 1.' }],
        code: { zh: '简化游标示意：\nif (空匹配 && 全局模式) {\n  lastIndex += Unicode模式且遇到代理对 ? 2 : 1\n}', en: 'Simplified cursor flow:\nif (emptyMatch && globalMode) {\n  lastIndex += unicodeModeAndSurrogatePair ? 2 : 1\n}' },
      },
      {
        title: { zh: '替换模板和输出放大', en: 'Replacement templates and output amplification' },
        paragraphs: [{ zh: '替换再调用原生 replace()，由工具的回调展开 $$、$&、数字组、命名组及前后文引用。前后文引用可能把输出放大到远大于输入，因此回调累计长度，超过 400 万代码单元就抛错。匹配列表最多展示 1000 项，但这不表示只替换前 1000 项；是否全局替换取决于 g。达到展示上限会提示截断，部分组未参与匹配时也不会凭空生成文字。', en: 'Replacement uses native replace() with a callback that expands $$, $&, numbered and named captures and context references. Context references can amplify output, so the callback tracks length and throws above 4 million code units. The 1,000-item match display cap does not limit replacement to those items; g determines global replacement. Reaching the display cap marks truncation, and unmatched captures do not invent text.' }],
      },
    ],
    example: {
      input: { zh: '表达式：([A-Z])(\\d+)\n标志：g\n文本：A12\n替换模板：$1-$2', en: 'Pattern: ([A-Z])(\\d+)\nFlags: g\nText: A12\nReplacement: $1-$2' },
      output: { zh: '匹配结果节选：\ntext: A12\nindex: 0\ngroups: ["A", "12"]\n替换结果：A-12', en: 'Match result excerpt:\ntext: A12\nindex: 0\ngroups: ["A", "12"]\nReplacement result: A-12' },
      explanation: { zh: '这是结果字段的文字节选：第一组取到 A，第二组取到 12，模板中的短横线是字面字符。若使用 (?:)、gv 和 😀，匹配边界是 0、2，替换为 - 时得到 -😀-。', en: 'This is a textual excerpt of the result fields: capture 1 is A and capture 2 is 12, with a literal hyphen between them. For (?:), gv and 😀, boundaries are 0 and 2; replacing with - yields -😀-.' },
    },
  },
  D10: {
    details: [
      {
        title: { zh: '三段结构不等于三段都可信', en: 'Three segments are not three trust guarantees' },
        paragraphs: [{ zh: '常见签名式 JWT 使用 Header.Payload.Signature 三段文本。前两段通常是 JSON 的 UTF-8 字节经过 Base64URL 表示，第三段用于完整性验证。本工具只要求恰好三段并解码前两段为对象，不读取密钥，也不验证第三段。Header 中的 alg 只是来自输入的数据，显示 HS256、RS256 或 none 都不构成算法已经执行或签名已经通过的证据。', en: 'A common signed JWT has Header.Payload.Signature segments. The first two are usually UTF-8 JSON encoded as Base64URL, and the third supports integrity verification. This tool only checks for three segments and decodes the first two into objects. It reads no keys and verifies no signature; an alg value such as HS256, RS256 or none is untrusted input, not evidence that an algorithm ran or verification succeeded.' }],
      },
      {
        title: { zh: 'JSON 数字和时间声明', en: 'JSON numbers and time claims' },
        paragraphs: [{ zh: 'JSON.parse() 的 reviver 检查超出安全整数范围的整数，利用支持该能力的浏览器提供的原始 source 片段把它保留为字符串；不是把所有 JSON 数字都变成任意精度类型，普通小数仍按 Number 处理。iat、exp、nbf 只有在值为 number 时才按秒乘 1000，再由 Date 输出 UTC；字段本来就是字符串时，不自动猜测并转换。', en: 'The JSON.parse() reviver checks unsafe integer values and, when supported by the browser, retains their original source text as strings. This is not arbitrary-precision parsing for every JSON number; ordinary decimals still use Number. Only numeric iat, exp and nbf values are multiplied by 1,000 and formatted as UTC with Date. String-valued claims are not guessed into timestamps.' }],
        code: { zh: '时间字段换算：\nUTC = new Date(NumericDate × 1000).toISOString()\n注意：显示时间 ≠ 校验令牌有效期', en: 'Time-claim conversion:\nUTC = new Date(NumericDate × 1000).toISOString()\nDisplaying a time ≠ validating token lifetime' },
      },
      {
        title: { zh: '数据查看器的安全边界', en: 'The boundary of a data inspector' },
        paragraphs: [{ zh: '结果经 textContent 写入界面，Payload 内的标签或脚本只会显示为文本。工具不依据 exp 阻止输出，不验证 issuer、audience、nonce 或签名，因此不能代替身份认证库。五段式 JWE 加密令牌也不属于此流程。遇到非常大的整数且浏览器不提供原始数值片段时，工具宁可报错，也不把已经失真的整数当成准确声明展示。', en: 'Results are rendered with textContent, so tags or scripts inside a payload stay text. The tool does not block output based on exp or validate issuer, audience, nonce or signatures, and cannot replace an authentication library. Five-segment encrypted JWE tokens are outside this flow. If an unsafe integer cannot be recovered from original parser source, the tool rejects it rather than presenting a rounded integer as exact.' }],
      },
    ],
    example: {
      input: { zh: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiI0MiIsImV4cCI6MH0.', en: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiI0MiIsImV4cCI6MH0.' },
      output: { zh: '解码结果节选：\nHeader: {"alg":"none"}\nPayload: {"sub":"42","exp":0}\nexp: 1970-01-01T00:00:00.000Z', en: 'Decoded result excerpt:\nHeader: {"alg":"none"}\nPayload: {"sub":"42","exp":0}\nexp: 1970-01-01T00:00:00.000Z' },
      explanation: { zh: '这个公开示例的签名段为空，只演示解码。exp=0 被解释为 Unix 起点；界面能展示它，并不说明这是一个可接受、已验证或未过期的认证令牌。', en: 'This public example has an empty signature segment and demonstrates decoding only. exp=0 maps to the Unix epoch; displaying it does not make the token acceptable, verified or unexpired.' },
    },
  },
  D11: {
    details: [
      {
        title: { zh: '位权与逐位累积', en: 'Place values and digit accumulation' },
        paragraphs: [{ zh: '位置计数法中，每向左一位，位权乘以进制 b。代码从零开始，对每个数字执行 n=n×b+d：先把已经读过的部分左移一个“进制位”，再加入下一位。这里 n、b、d 都参与 BigInt 运算，不先使用 parseInt() 把整串数变成 Number。因此二进制、八进制或十六进制的大整数都不会在中途被浮点数舍入。', en: 'In positional notation, each place to the left multiplies its weight by base b. Starting at zero, the code applies n=n×b+d for each digit, shifting the accumulated prefix one base-position and adding the next digit. Accumulation uses BigInt, rather than parseInt() on the whole string into Number, so large binary, octal and hexadecimal integers are not rounded in transit.' }],
        code: { zh: '十六进制 1A 的实际累积：\n0n × 16n + 1n  = 1n\n1n × 16n + 10n = 26n\n26n.toString(2) = "11010"', en: 'Actual accumulation for hexadecimal 1A:\n0n × 16n + 1n  = 1n\n1n × 16n + 10n = 26n\n26n.toString(2) = "11010"' },
      },
      {
        title: { zh: '符号、前缀与合法数字', en: 'Signs, prefixes and valid digits' },
        paragraphs: [{ zh: '输入先去掉两端空白并统一为小写，再识别正负号；0x、0b、0o 只有与选定输入进制对应时才作为前缀移除。每个字符单独转换为数字并检查 d<b，所以二进制中的 2 或十六进制中的 g 会报错，而不是像宽松的整数解析那样只取前半段。空内容和超过 1 万位的输入也在累积之前被拒绝。', en: 'Input is trimmed and lowercased before reading a sign. Prefixes 0x, 0b and 0o are removed only when they match the selected input base. Every character is converted and checked against d<b, so binary 2 or hexadecimal g causes an error rather than accepting a valid prefix of the text. Empty input and more than 10,000 digits are rejected before accumulation.' }],
      },
      {
        title: { zh: '输出表示与大数计算成本', en: 'Output representation and big-integer cost' },
        paragraphs: [{ zh: '累积后通过 BigInt.toString(radix) 生成目标进制字符串，具体的大整数格式化由运行时负责。结果使用小写十六进制，不保留输入的前导零、正号或原有前缀；负号表示数学上的负整数，不是固定位宽补码。BigInt 精度可增长，但乘法和字符串输出的内存与耗时也随位数增长，输入上限因此不能理解成固定耗时保证。', en: 'BigInt.toString(radix) delegates target-base formatting to the runtime. Output uses lowercase hex and does not preserve leading zeros, a plus sign or the original prefix. A minus sign represents a mathematical negative integer, not fixed-width two’s complement. BigInt precision can grow, but multiplication and output memory and cost grow with digit count; the input cap is not a fixed-time guarantee.' }],
      },
    ],
    example: {
      input: { zh: '输入进制：16；输出进制：10\n20000000000001', en: 'Input base: 16; output base: 10\n20000000000001' },
      output: { zh: '9007199254740993', en: '9007199254740993' },
      explanation: { zh: '结果等于 2⁵³+1，已经超过 Number 的安全整数范围，最后一位仍精确保留为 3。若输入 -10 并从二进制转十六进制，结果为 -2，而不是某种固定位宽的全 f 表示。', en: 'The value is 2⁵³+1, beyond Number’s safe-integer range, yet the final 3 is exact. Converting -10 from binary to hexadecimal produces -2 rather than a fixed-width pattern of f digits.' },
    },
  },
  D12: {
    details: [
      {
        title: { zh: '以八位 RGB 作为中间表示', en: 'Eight-bit RGB as the intermediate form' },
        paragraphs: [{ zh: 'HEX 的每两位对应一个 0–255 通道，三位写法通过重复每一位扩展，例如 #abc 成为 #aabbcc。RGB 输入直接读取三个通道；HSL 输入则先把色相环归一到 0–360°，按所在的六个扇区求色度和中间分量，再加入亮度偏移。最终通道取整，所以任意小数 HSL 往返一次可能有轻微差异，并不是所有表示都能保持原始小数位。', en: 'Each HEX byte is a 0–255 channel; short HEX duplicates each digit, turning #abc into #aabbcc. RGB supplies channels directly. HSL normalizes hue to 0–360°, computes chroma and intermediate components in six hue sectors, then applies the lightness offset. Final channels are rounded, so arbitrary fractional HSL values can change slightly on a round trip.' }],
      },
      {
        title: { zh: 'sRGB 需要先线性化', en: 'sRGB must be linearized first' },
        paragraphs: [{ zh: '屏幕 RGB 数值不是光强的线性比例，不能直接把三个通道平均当作可读性。工具先将通道归一到 0–1，再按 WCAG 的分段公式线性化；随后以 0.2126、0.7152、0.0722 权重组合红、绿、蓝，得到相对亮度。绿色权重大于蓝色，反映的是该标准的亮度模型，不是对色彩偏好的主观判断。下式是代码采用的计算公式。', en: 'Display RGB values are not linear light intensities, so averaging raw channels is not a readability measure. Channels are normalized to 0–1 and linearized with the WCAG piecewise formula, then combined using red, green and blue weights 0.2126, 0.7152 and 0.0722. The larger green weight belongs to the standard luminance model, not a subjective color preference. The formula below is used by the code.' }],
        code: { zh: 'c ≤ 0.04045：c_linear = c / 12.92\n否则：c_linear = ((c + 0.055) / 1.055)^2.4\nL = 0.2126R + 0.7152G + 0.0722B\ncontrast = (max(L1,L2)+0.05)/(min(L1,L2)+0.05)', en: 'c ≤ 0.04045: c_linear = c / 12.92\nOtherwise: c_linear = ((c + 0.055) / 1.055)^2.4\nL = 0.2126R + 0.7152G + 0.0722B\ncontrast = (max(L1,L2)+0.05)/(min(L1,L2)+0.05)' },
      },
      {
        title: { zh: '判定门槛与显示舍入', en: 'Thresholds and display rounding' },
        paragraphs: [{ zh: 'AA 与 AAA 使用普通文字的 4.5:1 和 7:1 门槛，判断基于未格式化的比值；界面显示才保留两位小数，所以临界值不要只凭显示数字推断。当前没有 alpha 合成步骤，也不分析字号、字重、图片背景或页面其他元素。颜色解析只接受工具列出的不透明语法，得到高对比度不能推导出整页已经满足全部无障碍要求。', en: 'AA and AAA use normal-text thresholds of 4.5:1 and 7:1, checked before display rounding. The UI shows two decimals, so borderline pass/fail should not be inferred from the rounded number alone. There is no alpha compositing or analysis of text size, weight, image backgrounds or other page elements. A high ratio for accepted opaque colors does not establish full-page accessibility.' }],
      },
    ],
    example: {
      input: { zh: '颜色：#000\n背景色：#fff', en: 'Color: #000\nBackground: #fff' },
      output: { zh: 'hex: #000000\nrgb: rgb(0, 0, 0)\nhsl: hsl(0, 0%, 0%)\n对比度: 21.00:1\nAA 普通文字（≥4.5）: ✓\nAAA 普通文字（≥7）: ✓', en: 'hex: #000000\nrgb: rgb(0, 0, 0)\nhsl: hsl(0, 0%, 0%)\nContrast: 21.00:1\nAA normal text (≥4.5): ✓\nAAA normal text (≥7): ✓' },
      explanation: { zh: '黑色亮度为 0，白色为 1，公式得到 1.05÷0.05=21。这是该不透明 sRGB 模型中的最高对比度，两个普通文字门槛都通过。', en: 'Black has luminance 0 and white 1, giving 1.05÷0.05=21, the maximum contrast in this opaque sRGB model. Both normal-text thresholds pass.' },
    },
  },
  D13: {
    details: [
      {
        title: { zh: '格式转换先经过数据结构', en: 'Conversion passes through a data structure' },
        paragraphs: [{ zh: '工具不会通过替换冒号和括号把 JSON 变成 YAML。JSON 由 lossless-json 解析，递归把普通整数转换成 BigInt，再交给 yaml 序列化。反方向先构建 YAML 文档节点，使用核心类型、唯一键检查和 intAsBigInt，再转换为 JavaScript 结构。返回 JSON 前把 BigInt 包回 LosslessNumber，所以普通大整数不经过 Number 这条会舍入的路径。', en: 'Conversion does not replace colons and brackets textually. lossless-json parses JSON, plain integers are recursively converted to BigInt, and yaml serializes them. The reverse path creates YAML document nodes with core types, unique-key checking and intAsBigInt, then converts to JavaScript structures. BigInt is wrapped back into LosslessNumber before JSON output, keeping plain large integers away from Number rounding.' }],
      },
      {
        title: { zh: '检查原始数值，而非已经舍入的结果', en: 'Check original scalars, not rounded results' },
        paragraphs: [{ zh: '小数或指数写法不能仅凭解析后的数值判断是否安全：9007199254740993e0 一旦变成 Number 就已经失真。工具检查原始标量文本，规范化 YAML 的 +、.5、1. 等写法，再用 lossless-json 的安全数值检查确认十进制往返不会丢失有效数字；这不要求 0.1 在二进制中有限展开。溢出、下溢、过多有效位及 .inf/.nan 会明确报错，而不是静默变成 null。', en: 'Safety cannot be determined solely after parsing a decimal or exponent value: 9007199254740993e0 is already changed once it becomes Number. The tool checks original scalar text, normalizes YAML forms such as +, .5 and 1., then uses lossless-json’s safe-number check for decimal round-trip precision. This does not require 0.1 to have a finite binary expansion. Overflow, underflow, excess significant digits and .inf/.nan produce errors instead of silent nulls.' }],
      },
      {
        title: { zh: '别名、循环与格式信息损失', en: 'Aliases, cycles and formatting information' },
        paragraphs: [{ zh: 'YAML 的注释、锚点名称和排版不是 JSON 数据模型的一部分，因此结构转换不会完整保留这些写法。toJS() 设置 maxAliasCount: 100 限制别名扩展，随后用当前递归路径的 WeakSet 检测循环引用：共享但非循环的数据可复制成 JSON，真正回指祖先则拒绝。输入长度受限仍不等于复杂结构没有额外开销，尤其是深层递归和别名展开。', en: 'YAML comments, anchor names and layout are outside JSON’s data model and do not fully survive structural conversion. toJS() uses maxAliasCount: 100 to bound alias expansion, followed by a path-local WeakSet cycle check. Shared acyclic data can be duplicated into JSON, while references back to ancestors are rejected. Input length alone does not eliminate structural costs such as deep recursion and alias expansion.' }],
        code: { zh: '简化类型路径：\nJSON 整数文本 → BigInt → YAML 整数\nYAML 整数 → BigInt → LosslessNumber → JSON\n不安全小数/指数 → 报错，不静默舍入', en: 'Simplified type paths:\nJSON integer text → BigInt → YAML integer\nYAML integer → BigInt → LosslessNumber → JSON\nUnsafe decimal/exponent → error, not silent rounding' },
      },
    ],
    example: {
      input: { zh: '方向：JSON → YAML\n{"n":9007199254740993,"enabled":true}', en: 'Direction: JSON → YAML\n{"n":9007199254740993,"enabled":true}' },
      output: { zh: 'n: 9007199254740993\nenabled: true\n', en: 'n: 9007199254740993\nenabled: true\n' },
      explanation: { zh: '大整数和布尔值都保留数据类型，YAML 输出末尾有换行。若将数字改写成 9007199254740993e0，当前实现会报告无法保留精度；可使用普通整数写法或明确选择字符串。', en: 'The large integer and boolean retain their data types, and YAML output ends with a newline. Writing the number as 9007199254740993e0 instead triggers a precision error in this implementation; use a plain integer or explicitly choose a string.' },
    },
  },
  D14: {
    details: [
      {
        title: { zh: '词法识别为什么依赖方言', en: 'Why tokenization depends on dialect' },
        paragraphs: [{ zh: 'SQL 中相同符号可能在不同数据库里有不同意义，例如标识符引用、字符串规则和特有操作符。工具把所选 language 传给 sql-formatter，由库负责词法识别和结构化排版。字符串内部的 select 不应被当作关键字改写；注释和带引号内容也必须与语句结构分开处理。因此用简单正则给每个逗号或关键字加换行，很容易破坏原来的文字。', en: 'SQL symbols can have different meanings across databases, including identifier quoting, string rules and dialect-specific operators. The selected language is passed to sql-formatter for tokenization and structural layout. A select inside a string must not be rewritten as a keyword, and comments and quoted content must be distinguished from statement structure. Simple regex-based newline insertion can easily corrupt that content.' }],
      },
      {
        title: { zh: '固定的排版配置', en: 'The concrete formatting configuration' },
        paragraphs: [{ zh: '本工具设置 keywordCase: upper，使识别出的关键字使用大写，tabWidth: 2 控制每级缩进宽度。SELECT 列表、FROM、WHERE 和嵌套表达式如何拆行则交给库当前版本的格式规则，不承诺与某个数据库客户端逐字符一致。结果只是新的 SQL 文本，没有创建数据库连接或调用执行器。下面列出的配置对应实际调用，不是数据库查询代码。', en: 'keywordCase: upper uppercases recognized keywords, and tabWidth: 2 sets indentation width. The current library decides wrapping for SELECT lists, FROM, WHERE and nested expressions; output is not promised to match a particular database client character for character. The result is text, with no connection or executor created. The configuration below reflects the actual formatter call, not a database query.' }],
        code: { zh: 'format(input, {\n  language: selectedDialect,\n  keywordCase: "upper",\n  tabWidth: 2\n})', en: 'format(input, {\n  language: selectedDialect,\n  keywordCase: "upper",\n  tabWidth: 2\n})' },
      },
      {
        title: { zh: '格式错误与执行错误是两回事', en: 'Formatting errors versus execution errors' },
        paragraphs: [{ zh: '格式化器遇到不支持的语法可能直接抛错，也可能输出某种排版；无论哪一种，都不能证明表名存在、列类型兼容或查询逻辑正确。选错方言会改变库对输入的理解。输入最多 20 万代码单元，按需加载能减少首次打开其他工具的资源，但实际格式化仍在当前页面执行；大型复杂语句可能比普通短查询耗时更多。', en: 'Unsupported syntax may cause a formatter error or still receive a layout; neither outcome proves that tables exist, types are compatible or query logic is correct. Choosing the wrong dialect changes how the library interprets input. Input is capped at 200,000 code units. Lazy loading avoids loading the formatter for unrelated tools, but formatting still runs in the page and large complex statements can cost more than short queries.' }],
      },
    ],
    example: {
      input: { zh: 'SQL 方言：SQL\nselect id from users where id=1', en: 'Dialect: SQL\nselect id from users where id=1' },
      output: { zh: 'SELECT\n  id\nFROM\n  users\nWHERE\n  id = 1', en: 'SELECT\n  id\nFROM\n  users\nWHERE\n  id = 1' },
      explanation: { zh: '关键字变为大写，字段、表名和条件按库规则缩进，等号两侧补空格。这个输出不会查询 users 表，也不证明该表或 id 字段存在。', en: 'Keywords become uppercase, fields, tables and conditions follow the library’s indentation, and spaces appear around the equals sign. Nothing queries users or establishes that the table or id column exists.' },
    },
  },
  D15: {
    details: [
      {
        title: { zh: '五个字段如何组成日历约束', en: 'How five fields constrain the calendar' },
        paragraphs: [{ zh: '工具先按空白分隔并确认恰好五段，再由 cron-parser 解释取值、列表、区间和步长。字段依次为分、时、日、月、星期，星期日可写 0 或 7。不能把“每隔几小时”和“某些小时值命中”混为一谈：例如 */2 表示该字段中的步进取值。当前解析库在日与星期都受限制时采用命中任意一个的规则，不是强制两者同时满足。', en: 'The tool first checks for exactly five whitespace-separated fields, then cron-parser interprets values, lists, ranges and steps. The order is minute, hour, day of month, month and weekday, with Sunday as 0 or 7. A field such as */2 selects stepped values rather than measuring an interval since the last run. When day of month and weekday are both restricted, this parser uses an either-match rule rather than requiring both.' }],
      },
      {
        title: { zh: '说明文字与日期计算分工', en: 'Separate description and date engines' },
        paragraphs: [{ zh: 'cronstrue 把同一表达式转换成中英文说明，cron-parser 创建带 tz 和 currentDate 的迭代器，连续调用 next() 五次取后续时间。Luxon 最后把每个结果按指定时区输出为含 UTC 偏移的 ISO 日期。说明库并不负责真正求下一次日期，因此判断精确触发时间时应看日期列表，不能只从一句自然语言说明推测所有日历细节。', en: 'cronstrue creates the Chinese or English description. cron-parser builds an iterator with tz and currentDate, and five next() calls obtain future runs. Luxon then formats each date in the requested zone with its UTC offset. The description library does not calculate trigger dates, so precise scheduling details should be read from the date list rather than inferred from one natural-language sentence.' }],
        code: { zh: '实际调用的简化流程：\ncron = parse(expression, {tz, currentDate})\n重复 5 次：\n  date = cron.next().toDate()\n  输出 date 在 tz 中的 ISO 表示', en: 'Simplified actual flow:\ncron = parse(expression, {tz, currentDate})\nRepeat 5 times:\n  date = cron.next().toDate()\n  output date as zoned ISO in tz' },
      },
      {
        title: { zh: '时区规则和可复现性', en: 'Zone rules and reproducibility' },
        paragraphs: [{ zh: '“每天九点”约束的是当地钟表时间，跨夏令时的相邻两次运行不一定相隔 24 小时。不存在或重复的时段由解析器和时区数据处理，不能假定所有调度系统行为相同。界面每次从当时的当前时间计算，结果会随执行时刻改变；这里没有后台计时器，也不会真的运行任务。为了复现示例，下方显式固定了推算参考时刻，这不是新增表单选项。', en: '“Daily at nine” constrains local clock time, so adjacent runs across DST need not be 24 hours apart. Gaps and overlaps follow parser and zone-data rules, which can differ between schedulers. The UI calculates from the current time on each run, so results change over time; there is no background scheduler. The example fixes a reference instant for reproducibility, not as an additional form option.' }],
      },
    ],
    example: {
      input: { zh: '表达式：0 9 * * *\n时区：Asia/Shanghai\n示例参考时刻：2026-01-01T00:00:00Z', en: 'Expression: 0 9 * * *\nZone: Asia/Shanghai\nExample reference instant: 2026-01-01T00:00:00Z' },
      output: { zh: '后续运行时间：\n2026-01-01T09:00:00.000+08:00\n2026-01-02T09:00:00.000+08:00\n2026-01-03T09:00:00.000+08:00\n2026-01-04T09:00:00.000+08:00\n2026-01-05T09:00:00.000+08:00', en: 'Next runs:\n2026-01-01T09:00:00.000+08:00\n2026-01-02T09:00:00.000+08:00\n2026-01-03T09:00:00.000+08:00\n2026-01-04T09:00:00.000+08:00\n2026-01-05T09:00:00.000+08:00' },
      explanation: { zh: '参考时刻在上海是当日 08:00，所以下一次是当天 09:00。实际页面从你点击执行的时刻开始推算，日期列表通常不会与这个固定示例相同。', en: 'The reference instant is 08:00 in Shanghai, so the next run is 09:00 that same day. The live page starts from the time you run it, so its dates will generally differ from this fixed example.' },
    },
  },
  D16: {
    details: [
      {
        title: { zh: '字符引用不是 HTML 标签解析', en: 'Character references are not HTML parsing' },
        paragraphs: [{ zh: 'HTML 实体是字符的另一种写法：命名形式如 &amp;，十进制数字形式如 &#38;，十六进制形式如 &#x26; 都能指向同一个与号。工具调用 he 库识别和生成这些引用，而不是把输入装进一个 DOM 来读取 innerHTML。编码优先使用命名实体，也会根据库的字符规则生成数字引用；普通 Unicode 字符与实体之间的转换并不改变网页结构本身。', en: 'HTML references are alternate spellings of characters: &amp;, &#38; and &#x26; can all represent an ampersand. The tool uses he to recognize and generate them rather than loading input into a DOM and reading innerHTML. Encoding prefers named references and may use numeric ones according to library rules. Converting characters and references does not itself parse a page structure.' }],
      },
      {
        title: { zh: '编码选项和单次解码', en: 'Encoding options and one decoding pass' },
        paragraphs: [{ zh: 'encode() 设置 useNamedReferences: true、allowUnsafeSymbols: false、encodeEverything: false，既处理尖括号、与号、引号，也遵循库对其他字符的编码策略。decode() 执行一次实体还原，不反复解码到字符串不再变化；例如 &amp;lt; 一次后仍是 &lt;。缺分号等边界写法如何解释由 he 的默认 HTML 解码规则决定，不能把它当成严格的 XML 校验器。', en: 'encode() uses useNamedReferences: true, allowUnsafeSymbols: false and encodeEverything: false, handling brackets, ampersands, quotes and other characters according to the library’s policy. decode() performs one pass rather than decoding repeatedly until stable; &amp;lt; becomes &lt; after one pass. Edge forms such as missing semicolons follow he’s default HTML rules, not strict XML validation.' }],
        code: { zh: '单次解码示例：\n&amp;lt; → &lt;\n&lt; → <\n这些是两次独立调用，不是一次循环解码。', en: 'Single-pass decoding examples:\n&amp;lt; → &lt;\n&lt; → <\nThese are separate calls, not one repeated decoding loop.' },
      },
      {
        title: { zh: '展示安全与内容净化的区别', en: 'Safe display versus sanitization' },
        paragraphs: [{ zh: '解码可能恢复出真实的 <script> 或带事件属性的标签字符串，但结果区使用 textContent，因此这些字符只作为文字展示。这个展示策略不代表输出已经净化：若在另一个应用中直接把解码结果交给 innerHTML，仍可能改变 DOM 或执行危险内容。实体编码也只是一种上下文相关的表示处理，不等同于 JavaScript、URL 或 CSS 各自需要的转义。', en: 'Decoding can restore strings containing real <script> tags or event attributes, but the result area uses textContent so they remain visible text. That display policy is not sanitization: inserting the same decoded output through innerHTML elsewhere can still modify a DOM or create dangerous content. Entity encoding is context-specific and is not a substitute for JavaScript, URL or CSS escaping.' }],
      },
    ],
    example: {
      input: { zh: '操作：编码\n<a title="x">&', en: 'Mode: Encode\n<a title="x">&' },
      output: { zh: '&lt;a title=&quot;x&quot;&gt;&amp;', en: '&lt;a title=&quot;x&quot;&gt;&amp;' },
      explanation: { zh: '尖括号、引号和与号被写成实体，其余 ASCII 字符保留。把这份输出解码一次得到原输入，结果仍以纯文本显示，不会创建 a 元素。', en: 'Angle brackets, quotes and the ampersand become references, while the remaining ASCII stays literal. Decoding once restores the input as plain text without creating an a element.' },
    },
  },
});

for (const [id, technical] of Object.entries(technicalTextDetails)) {
  Object.assign(textPrinciples[id], technical);
}
