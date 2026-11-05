export const mediaPrinciples = {
  I01: {
    summary: {
      zh: '通过缩小像素尺寸并重新编码图片，在画质、尺寸和文件大小之间取得平衡。',
      en: 'Resize and re-encode images to balance visual quality, dimensions and file size.',
    },
    steps: [
      {
        zh: '读取文件头，检查实际格式、动画标记和尺寸，再按照片方向解码图片。',
        en: 'Read the file headers to check the actual format, animation flags and dimensions, then decode the image using its photo orientation.',
      },
      {
        zh: '按最大边长等比缩小图片，不放大小图；选择 JPEG 时先填充指定底色。',
        en: 'Scale down proportionally to the maximum edge without enlarging smaller images; fill the chosen background first when exporting JPEG.',
      },
      {
        zh: '逐张编码为所选格式，核对输出类型，并展示原图与结果的大小、尺寸和变化比例。',
        en: 'Encode each image in sequence, verify the output type, and show the original and output sizes, dimensions and percentage change.',
      },
    ],
    implementation: {
      zh: 'Canvas 2D 的 drawImage 绘制缩放后的像素，toBlob 按所选 MIME 类型生成文件，并将质量值传给 JPEG / WebP 编码器。输出扩展名依据实际 Blob 类型确定，不用改文件名冒充格式转换。',
      en: 'Canvas 2D drawImage renders the resized pixels, and toBlob creates a file with the selected MIME type, passing the quality setting to the JPEG / WebP encoder. The extension follows the actual Blob type, so conversion does not merely rename the file.',
    },
    details: [
      {
        title: { zh: '压缩文件与解码像素是两种数据', en: 'Encoded files and decoded pixels are different data' },
        paragraphs: [
          {
            zh: '输入的 JPEG、PNG、WebP 是压缩字节流，不能直接当作像素缩放。工具先用 ArrayBuffer 检查签名与格式块，再交给 createImageBitmap 解码；失败时回退到 Image。解码采用照片方向，因此后续宽高以浏览器显示方向为准，而不是只取文件头中的未旋转尺寸。',
            en: 'JPEG, PNG and WebP inputs are encoded byte streams, which cannot be resized as pixels directly. The tool inspects signatures and format chunks through an ArrayBuffer, then decodes with createImageBitmap, falling back to Image if needed. Decoding applies photo orientation, so subsequent dimensions follow the displayed orientation rather than just the unrotated header dimensions.',
          },
          {
            zh: '小文件也可能解码成很大的像素面。以常见的每像素四字节 RGBA 估算，4000×3000 的单份像素约占 48 MB，位图、画布和编码器还可能各有缓冲区；这解释了为何同时限制文件大小、像素数和边长。浏览器实际内存布局可能不同。',
            en: 'A small file can decode into a large pixel surface. At a common four bytes per RGBA pixel, one 4000×3000 surface is about 48 MB, and bitmaps, canvases and encoders may each need buffers. This is why file size, pixel count and edge length are all limited; actual browser memory layouts can differ.',
          },
        ],
      },
      {
        title: { zh: '等比缩小与有损编码各做什么', en: 'What proportional resizing and lossy encoding each do' },
        paragraphs: [
          {
            zh: '缩放系数取最大边长与原图最长边之比，并限制在 1 以内；宽高分别四舍五入且至少保留一个像素。drawImage 将源像素重采样到输出画布，页面没有指定自定义插值核，缩放细节由浏览器的 Canvas 实现决定。',
            en: 'The scale factor is the maximum edge divided by the source’s longest side, capped at 1. Each dimension is rounded and kept at least one pixel. drawImage resamples source pixels onto the output canvas; the page does not specify a custom interpolation kernel, so the browser’s Canvas implementation determines the details.',
          },
          {
            zh: 'toBlob 接收滑块值除以 100 得到的质量参数。概念上，JPEG 的变换与量化可舍弃细节，PNG 则无损保存重采样后的像素；这些编解码步骤由浏览器执行，站点没有设置量化表、色度采样或 WebP 内部模式，质量 80 也不表示保留 80% 字节。',
            en: 'toBlob receives the slider value divided by 100 as its quality argument. Conceptually, JPEG transforms and quantization can discard detail, while PNG losslessly represents the resampled pixels. The browser performs these codec operations; the site does not set quantization tables, chroma subsampling or internal WebP modes, and quality 80 does not mean retaining 80% of the bytes.',
          },
        ],
        code: {
          zh: 's = min(1, 最大边长 / max(W, H))\n输出宽 = max(1, round(W × s))\n输出高 = max(1, round(H × s))\n变化率 = (输出字节数 / 输入字节数 - 1) × 100%',
          en: 's = min(1, maxEdge / max(W, H))\noutputWidth = max(1, round(W × s))\noutputHeight = max(1, round(H × s))\nchange = (outputBytes / inputBytes - 1) × 100%',
        },
      },
      {
        title: { zh: '顺序处理与结果校验', en: 'Sequential processing and output checks' },
        paragraphs: [
          {
            zh: '一批图片按顺序解码、绘制和编码，后续图片使用完即关闭位图，输出画布缩回 1×1，替换结果时释放预览 URL。首张预览及已生成文件仍可能占用内存；顺序执行降低峰值，但不是流式编码或固定内存保证。取消标志在操作间检查，不强行中断浏览器正在执行的编码。',
            en: 'A batch is decoded, rendered and encoded in sequence. Later bitmaps are closed after use, output canvases are reset to 1×1, and preview URLs are released when results are replaced. The first preview and completed files can still occupy memory. Sequential work lowers peaks but is not streaming or a fixed-memory guarantee; cancellation is checked between operations rather than interrupting an active browser encode.',
          },
        ],
      },
    ],
    example: {
      input: { zh: '方向已应用的原图为 4000×3000 px，最大边长设为 1600 px，输出 WebP，质量 80。', en: 'The oriented source is 4000×3000 px; maximum edge is 1600 px, output is WebP, and quality is 80.' },
      output: { zh: '输出尺寸为 1600×1200 px，编码质量参数为 0.8；具体字节数须编码后读取。', en: 'Output dimensions are 1600×1200 px and the encoder quality argument is 0.8; the byte size is read after encoding.' },
      explanation: { zh: 's=1600/4000=0.4，所以宽高均乘以 0.4；像素数从 1200 万降到 192 万，但文件大小不会按同一比例确定。', en: 's=1600/4000=0.4, so both dimensions are multiplied by 0.4. Pixel count falls from 12 million to 1.92 million, but file size does not follow a guaranteed matching ratio.' },
    },
    limits: {
      zh: '仅支持静态 JPEG、PNG、WebP；单张最多 25 MiB、2400 万像素、单边 8192 px，一批最多 10 张、输入和输出各最多 100 MiB。PNG 忽略质量设置，结果不保证更小；重新编码通常不保留 EXIF。取消会在当前解码或编码操作结束后生效。',
      en: 'Static JPEG, PNG and WebP only; each image is limited to 25 MiB, 24 million pixels and 8192 px per side, with up to 10 images and 100 MiB each for total input and output. PNG ignores the quality setting, output may be larger, and re-encoding usually does not retain EXIF. Cancellation takes effect after the current decode or encode operation.',
    },
  },
  I02: {
    summary: {
      zh: '先从图片中选取一个矩形区域，再把它缩放到需要的宽度和高度。',
      en: 'Select a rectangular region of an image, then resize it to the width and height you need.',
    },
    steps: [
      {
        zh: '按照片方向解码原图，以预览左上角为原点，用原图像素表示裁剪坐标。',
        en: 'Decode the image using its photo orientation, then express crop coordinates in source pixels from the top-left corner of the preview.',
      },
      {
        zh: '输入 X、Y、裁剪宽高，或用固定比例生成居中的裁剪区域，并检查矩形是否超出原图。',
        en: 'Enter X, Y, crop width and crop height, or create a centered crop with an aspect-ratio preset, then check that the rectangle stays inside the image.',
      },
      {
        zh: '将选区绘制到指定大小的输出画布；锁定比例时，修改一边会自动计算另一边，再编码下载。',
        en: 'Draw the selected region onto a canvas of the requested size; with aspect ratio locked, changing one side recalculates the other, then encode the result for download.',
      },
    ],
    implementation: {
      zh: 'createImageBitmap 使用 from-image 方向解码，Canvas drawImage 的源矩形和目标矩形参数完成裁剪与缩放。预览中的遮罩标示选区，最终使用完整分辨率的源图绘制，并通过 toBlob 输出。',
      en: 'createImageBitmap decodes with from-image orientation, and the source and destination rectangles of Canvas drawImage perform cropping and resizing. A mask marks the crop in the preview; the final render uses the full-resolution source and is exported through toBlob.',
    },
    details: [
      {
        title: { zh: '原图坐标与预览坐标', en: 'Source coordinates versus preview coordinates' },
        paragraphs: [
          {
            zh: '裁剪的 X、Y 从方向已应用的原图左上角起算，单位是原图像素。工具先验证坐标为非负整数、宽高为正整数，并要求 X+裁剪宽≤原图宽、Y+裁剪高≤原图高，防止浏览器默默裁去越界部分后产生意外结果。',
            en: 'Crop X and Y are measured in source pixels from the top-left corner after orientation is applied. The tool requires nonnegative integer coordinates, positive integer dimensions, X+cropWidth≤sourceWidth and Y+cropHeight≤sourceHeight, preventing unexpected results from a browser silently clipping an out-of-bounds rectangle.',
          },
          {
            zh: '预览用 min(1,800/W,500/H) 缩小显示，裁剪框和遮罩也乘以该系数。这个缩略画布只辅助定位；最终绘制重新使用完整源位图，因此预览缩小不会把下载结果限制成 800×500，也不能把预览坐标直接填入原图坐标框。',
            en: 'The preview uses min(1,800/W,500/H) as its display scale, and the crop rectangle and mask use the same factor. This thumbnail canvas is only a positioning aid. Final rendering uses the full source bitmap, so the preview does not restrict downloads to 800×500, and preview coordinates cannot be entered directly as source coordinates.',
          },
        ],
      },
      {
        title: { zh: '一次 drawImage 完成裁剪和缩放', en: 'One drawImage call crops and resizes' },
        paragraphs: [
          {
            zh: '九参数 drawImage 指定源矩形 (sx,sy,sw,sh) 和目标矩形 (0,0,dw,dh)。只将选区映射到输出画布，横向比例为 dw/sw，纵向为 dh/sh；两者不等时发生拉伸。锁定比例只是替用户计算另一边尺寸，不改变裁剪边界，也不添加留白。',
            en: 'The nine-argument drawImage call specifies a source rectangle (sx,sy,sw,sh) and destination rectangle (0,0,dw,dh). It maps only the selected region to the output canvas, using horizontal scale dw/sw and vertical scale dh/sh. Different scales cause stretching. Aspect lock calculates the other dimension; it does not change the crop bounds or add padding.',
          },
          {
            zh: '修改输出宽度时，锁定模式用 round(输出宽×裁剪高/裁剪宽) 计算高度，反向亦然。整数像素会产生至多取整级别的比例误差；Canvas 的重采样会综合附近像素，放大只能生成插值结果，不能恢复原图未记录的细节。',
            en: 'When output width changes with the ratio locked, height is round(outputWidth×cropHeight/cropWidth), and conversely for height changes. Integer pixels introduce rounding-level ratio differences. Canvas resampling combines neighboring pixels; enlarging creates interpolated samples rather than recovering details absent from the source.',
          },
        ],
        code: {
          zh: 'drawImage(图像, sx, sy, sw, sh, 0, 0, dw, dh)\n源点 (x,y) → ((x-sx)×dw/sw, (y-sy)×dh/sh)',
          en: 'drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh)\nsource point (x,y) → ((x-sx)×dw/sw, (y-sy)×dh/sh)',
        },
      },
      {
        title: { zh: '固定比例与输出缓冲区', en: 'Aspect presets and the output buffer' },
        paragraphs: [
          {
            zh: '固定比例预设先尝试占满原图宽度，若高度超出则改为占满高度，再用 floor((原尺寸−选区尺寸)/2) 居中。输出画布独立分配像素，因此即使只截取很小区域，选择巨大的输出尺寸仍会消耗大量内存；尺寸上限同时应用于源图和输出，编码后才得到实际文件大小。',
            en: 'An aspect preset first attempts to fill the source width; if its height would exceed the source, it fills the height instead. It centers the rectangle with floor((sourceSize−cropSize)/2). The output canvas allocates a separate pixel surface, so a tiny crop with a huge output size can still use substantial memory. Dimension limits apply to both source and output; actual file size is known only after encoding.',
          },
        ],
      },
    ],
    example: {
      input: { zh: '4000×3000 px 原图，选择 1:1 裁剪比例，锁定输出比例，将输出宽设为 600 px。', en: 'Use a 4000×3000 px source, choose the 1:1 crop preset, lock the output ratio, and set output width to 600 px.' },
      output: { zh: '裁剪区域为 X=500、Y=0、宽=3000、高=3000；下载图片尺寸为 600×600 px。', en: 'The crop is X=500, Y=0, width=3000 and height=3000; the downloaded image is 600×600 px.' },
      explanation: { zh: '正方形受原图高度限制，水平方向两侧各去掉 500 px；选区随后以横纵相同的 0.2 倍比例映射到输出。', en: 'The source height limits the square crop, removing 500 px from each horizontal side. The region is then mapped to the output at the same 0.2 scale on both axes.' },
    },
    limits: {
      zh: '每次处理一张静态 JPEG、PNG 或 WebP；输入最多 25 MiB，输入和输出均不得超过 2400 万像素或单边 8192 px。坐标和尺寸必须是有效整数；解锁比例可能拉伸图片，放大不会增加原始细节。',
      en: 'Process one static JPEG, PNG or WebP at a time; input is limited to 25 MiB, and both input and output must stay within 24 million pixels and 8192 px per side. Coordinates and dimensions must be valid integers; unlocking the aspect ratio can stretch the image, and enlarging it cannot add original detail.',
    },
  },
  I03: {
    summary: {
      zh: '把图片解码成像素，再使用浏览器支持的另一种图片格式重新编码。',
      en: 'Decode an image into pixels, then re-encode it in another image format supported by the browser.',
    },
    steps: [
      {
        zh: '从文件内容识别 JPEG、PNG 或 WebP，检查是否为静态图片，并按照片方向解码。',
        en: 'Identify JPEG, PNG or WebP from the file contents, check that the image is static, and decode it using its photo orientation.',
      },
      {
        zh: '保持解码后的像素尺寸，将图片绘制到画布；转为 JPEG 前，用所选底色填充透明区域。',
        en: 'Keep the decoded pixel dimensions and draw the image onto a canvas; before exporting JPEG, fill transparent areas with the selected background color.',
      },
      {
        zh: '按目标格式和质量生成文件，核对实际 MIME 类型，再提供匹配扩展名的下载文件。',
        en: 'Generate a file with the target format and quality, check its actual MIME type, and offer a download with the matching extension.',
      },
    ],
    implementation: {
      zh: 'Canvas drawImage 负责像素绘制，toBlob 调用浏览器的 JPEG、PNG 或 WebP 编码器。JPEG 不支持透明通道，PNG 和 WebP 可保留透明像素；若编码器返回的类型与所选格式不符，工具会报告不支持。',
      en: 'Canvas drawImage renders the pixels, and toBlob invokes the browser’s JPEG, PNG or WebP encoder. JPEG has no alpha channel, while PNG and WebP can retain transparent pixels; the tool reports an unsupported format if the encoder returns a different type.',
    },
    details: [
      {
        title: { zh: '转码经过像素，不是更换后缀', en: 'Transcoding passes through pixels, not filename changes' },
        paragraphs: [
          {
            zh: '源格式由实际字节识别：PNG 检查签名与 IHDR，JPEG 查找 SOF 尺寸段，WebP 解析 RIFF 容器内的图像块；动画标记会导致拒绝处理。通过检查后，浏览器把压缩数据解码成可绘制图像，drawImage 再将完整图像写入同尺寸 Canvas，最后以目标格式重新编码。',
            en: 'The actual bytes identify the source: PNG uses its signature and IHDR, JPEG uses SOF dimension segments, and WebP uses image chunks inside its RIFF container. Animation flags cause rejection. After validation, the browser decodes the compressed data into a drawable image, drawImage writes the full image to a same-sized Canvas, and the target encoder creates a new file.',
          },
          {
            zh: '页面向 toBlob 提交 image/jpeg、image/png 或 image/webp，并检查返回 Blob.type 完全一致。某些浏览器遇到未知编码类型会退回 PNG，工具把这种情况当作不支持，而不会生成内容是 PNG、后缀却是 .webp 的文件。空的编码结果也会作为失败处理。',
            en: 'The page submits image/jpeg, image/png or image/webp to toBlob and checks that the returned Blob.type matches exactly. Some browsers fall back to PNG for an unknown encoder type; the tool treats that as unsupported rather than producing PNG contents with a .webp extension. An empty encoding result is also treated as failure.',
          },
        ],
      },
      {
        title: { zh: '透明通道怎样合成到底色', en: 'How alpha is composited onto a background' },
        paragraphs: [
          {
            zh: 'PNG 和支持透明度的 WebP 可以表达颜色之外的 alpha 通道。JPEG 没有这个通道，所以工具先以不透明的所选颜色填满画布，再按默认 source-over 规则绘制图片；半透明边缘与底色混合，全透明位置显示底色，而不是依赖编码器自行选择黑色或白色。',
            en: 'PNG and alpha-capable WebP can represent transparency alongside color. JPEG cannot, so the tool first fills the canvas with the selected opaque background, then draws the image using the default source-over rule. Semitransparent edges blend with that background, and fully transparent areas reveal it instead of relying on the encoder to choose black or white.',
          },
          {
            zh: '逐通道的简化混合公式是 C=α×源色+(1−α)×底色；实际颜色空间转换和舍入由浏览器处理。选择 PNG 或 WebP 时不预填底色，画布保留可用的透明度。透明区域也可能参与压缩，保留透明通道不代表文件必定更大或更小。',
            en: 'A simplified per-channel blend is C=α×source+(1−α)×background; the browser handles actual color-space conversion and rounding. PNG and WebP outputs are not prefilled, allowing the canvas to retain transparency. Transparent regions can also affect compression, so retaining alpha does not imply a guaranteed increase or decrease in size.',
          },
        ],
        code: {
          zh: '若目标为 JPEG：\n  fillRect(底色, 整个画布)\ndrawImage(解码图像, 整个画布)\nBlob = toBlob(目标 MIME, 质量/100)\n要求 Blob.type === 目标 MIME',
          en: 'if target is JPEG:\n  fillRect(background, entire canvas)\ndrawImage(decodedImage, entire canvas)\nBlob = toBlob(targetMIME, quality/100)\nrequire Blob.type === targetMIME',
        },
      },
      {
        title: { zh: '无损编码不等于恢复原图', en: 'Lossless encoding does not restore lost detail' },
        paragraphs: [
          {
            zh: 'PNG 的无损性针对进入编码器的画布像素：从有损 JPEG 转为 PNG 不能恢复先前量化丢失的信息。JPEG 再转 JPEG 还会经历新一轮有损编码；质量参数只是浏览器编码器的提示，不固定压缩策略。转码也没有直接复制原文件的 EXIF、ICC 等段，因此像素、元数据与原始字节不能混为一谈。',
            en: 'PNG is lossless with respect to the canvas pixels entering its encoder: converting a lossy JPEG to PNG cannot restore information previously lost through quantization. JPEG-to-JPEG conversion adds another lossy encoding pass, and the quality argument is a browser encoder hint rather than a fixed compression strategy. The tool also does not directly copy source EXIF or ICC segments, so pixels, metadata and original bytes must be distinguished.',
          },
        ],
      },
    ],
    example: {
      input: { zh: '800×600 px 的透明 PNG，输出选择 JPEG，底色为 #336699。', en: 'An 800×600 px transparent PNG is converted to JPEG with background #336699.' },
      output: { zh: '结果为 800×600 px、MIME 为 image/jpeg、扩展名为 .jpg 的不透明图片。', en: 'The result is an opaque 800×600 px image with MIME image/jpeg and extension .jpg.' },
      explanation: { zh: '尺寸不变；全透明区域在编码前的画布上被底色替代。JPEG 有损编码后的具体颜色值和字节数取决于编码器，不保证与画布值逐字节相同。', en: 'Dimensions stay unchanged, and fully transparent areas reveal the background on the canvas before encoding. Exact color values and byte size after lossy JPEG encoding depend on the encoder and are not guaranteed to match the canvas byte for byte.' },
    },
    limits: {
      zh: '每次一张，最多 25 MiB、2400 万像素、单边 8192 px；不处理动画、SVG、HEIC 或 RAW。PNG 不受质量滑块影响，转换不保证减小体积，也不保证保留原有 EXIF 或色彩配置。',
      en: 'One image at a time, up to 25 MiB, 24 million pixels and 8192 px per side; animated images, SVG, HEIC and RAW are not supported. PNG ignores the quality slider, conversion may increase file size, and original EXIF or color profiles may not be retained.',
    },
  },
  I04: {
    summary: {
      zh: '把文字或图片按指定位置和不透明度叠加到原图上，生成带水印的新图片。',
      en: 'Overlay text or an image at the chosen position and opacity to create a new watermarked image.',
    },
    steps: [
      {
        zh: '解码原图并按原尺寸绘制到画布；输出 JPEG 时先铺设所选底色。',
        en: 'Decode the source and draw it onto a canvas at its original dimensions; lay down the selected background first for JPEG output.',
      },
      {
        zh: '按原图宽度百分比计算水印大小：文字测量宽度后调整字号，图片则保持自身比例缩放。',
        en: 'Size the watermark as a percentage of the source width: measure text to choose its font size, or scale an image while preserving its aspect ratio.',
      },
      {
        zh: '根据四角或居中锚点和边距计算坐标，以所选不透明度叠加水印，再编码下载。',
        en: 'Calculate coordinates from a corner or center anchor and the margins, apply the chosen opacity, then encode the watermarked result for download.',
      },
    ],
    implementation: {
      zh: 'Canvas 2D 的 measureText、fillText 或 drawImage 绘制水印，globalAlpha 控制叠加时的不透明度。位置计算使用水印的实际宽高，绘制完成后通过 toBlob 生成所选格式的文件。',
      en: 'Canvas 2D uses measureText, fillText or drawImage to render the watermark, while globalAlpha controls its opacity. Position calculations use the watermark’s actual width and height, and toBlob exports the finished canvas in the selected format.',
    },
    details: [
      {
        title: { zh: '宽度比例转换为实际水印尺寸', en: 'Turning a width percentage into watermark dimensions' },
        paragraphs: [
          {
            zh: '画布保持原图尺寸 W×H，边距 d=round(min(W,H)×0.025)。水印目标宽度是图宽百分比与 W−2d 中的较小值；图片水印再用宽度限制和 H−2d 高度限制中较小的缩放系数，等比得到实际宽高。缩放和位移直接通过 drawImage 的目标矩形完成，没有旋转或平铺变换。',
            en: 'The canvas keeps the source dimensions W×H, with margin d=round(min(W,H)×0.025). Target watermark width is the smaller of the requested percentage of W and W−2d. An image watermark uses the smaller scale allowed by that width and height H−2d, preserving its ratio. drawImage’s destination rectangle performs scaling and translation directly; no rotation or tiling transform is applied.',
          },
          {
            zh: '文字先以 100 px 的 system-ui 字体测量宽度，再按目标宽度调整字号，并限制字号不超过图高的 80%。measureText 使用当前设备字体，所以相同文字在不同设备上不一定占相同宽度；纵向定位以字号近似文字高度，而不是逐字形计算精确包围盒。',
            en: 'Text width is first measured at 100 px in system-ui, then the font size is scaled to the target width and capped at 80% of image height. measureText uses device fonts, so identical text can have different widths across devices. Vertical positioning approximates text height with the font size rather than calculating an exact glyph bounding box.',
          },
        ],
      },
      {
        title: { zh: '锚点计算与透明度叠加', en: 'Anchor coordinates and alpha compositing' },
        paragraphs: [
          {
            zh: '右下角锚点使用 x=W−水印宽−d、y=H−水印高−d；居中则用两者尺寸差的一半，左上角直接使用边距。坐标被限制为非负，绘制前设置 globalAlpha=不透明度/100。图片自带的透明通道仍然参与混合，其有效 alpha 是原 alpha 与 globalAlpha 的乘积。',
            en: 'A bottom-right anchor uses x=W−markWidth−d and y=H−markHeight−d; centering uses half the dimension differences, while top-left uses the margins directly. Coordinates are clamped to nonnegative values and globalAlpha is set to opacity/100 before rendering. An image’s existing alpha still participates, with effective alpha equal to source alpha multiplied by globalAlpha.',
          },
          {
            zh: '文字还会绘制轻微阴影以帮助辨认；随后恢复 globalAlpha，避免污染后续画布操作。这里的不透明度控制的是水印对已有底图的贡献，不是把整张输出图片一起淡化，也不是修改水印原文件中的像素。',
            en: 'Text also receives a subtle shadow for readability, and globalAlpha is restored afterward so it cannot affect subsequent canvas work. Opacity controls the watermark’s contribution over the existing image; it does not fade the entire output or modify pixels in the original watermark file.',
          },
        ],
        code: {
          zh: 'd = round(min(W,H) × 0.025)\n目标宽 = min(W × 宽度百分比/100, W - 2d)\nk = min(目标宽/水印原宽, (H-2d)/水印原高)\n右下角 = (W-水印原宽×k-d, H-水印原高×k-d)',
          en: 'd = round(min(W,H) × 0.025)\ntargetWidth = min(W × widthPercent/100, W - 2d)\nk = min(targetWidth/markWidth, (H-2d)/markHeight)\nbottomRight = (W-markWidth×k-d, H-markHeight×k-d)',
        },
      },
      {
        title: { zh: '输出是合成后的像素', en: 'The output contains flattened pixels' },
        paragraphs: [
          {
            zh: '原图与水印共用同一输出画布，toBlob 编码的是最终合成结果，没有独立的文字、图层或可回退编辑记录。原图像素尺寸不变，但 JPEG / WebP 编码仍可能有损；半透明图片水印还需要额外解码缓冲区。工具在绘制完成后关闭水印位图，并释放临时输出画布以减少峰值占用。',
            en: 'The source and watermark share one output canvas, and toBlob encodes the final composite without separate text, layers or reversible edit history. Source pixel dimensions stay unchanged, but JPEG / WebP encoding can still be lossy. An image watermark also requires another decode buffer; the tool closes its bitmap after rendering and releases the temporary output canvas to reduce peak usage.',
          },
        ],
      },
    ],
    example: {
      input: { zh: '原图 1200×800 px，图片水印 400×200 px，宽度设为 25%，位置右下，不透明度 60%。', en: 'Source: 1200×800 px; image watermark: 400×200 px; width: 25%; position: bottom-right; opacity: 60%.' },
      output: { zh: '水印绘制为 300×150 px，左上角坐标 (880,630)，globalAlpha=0.6；输出仍为 1200×800 px。', en: 'The watermark is drawn at 300×150 px with top-left coordinates (880,630) and globalAlpha=0.6; output remains 1200×800 px.' },
      explanation: { zh: '边距为 20 px，缩放系数为 300/400=0.75，因此位置为 (1200−300−20,800−150−20)。水印中原本 alpha=0.5 的像素以有效 alpha=0.3 参与合成。', en: 'The margin is 20 px and scale is 300/400=0.75, giving position (1200−300−20,800−150−20). A watermark pixel with original alpha=0.5 participates with effective alpha=0.3.' },
    },
    limits: {
      zh: '原图和图片水印均仅支持静态 JPEG、PNG、WebP，单个文件最多 25 MiB、2400 万像素、单边 8192 px。水印会合入像素，下载后无法作为独立图层编辑；文字外观取决于设备字体，重新编码也可能改变画质与元数据。',
      en: 'Both the source and image watermark must be static JPEG, PNG or WebP, with each file limited to 25 MiB, 24 million pixels and 8192 px per side. The watermark is flattened into the pixels and cannot be edited as a separate layer in the download; text appearance depends on device fonts, and re-encoding may change image quality and metadata.',
    },
  },
  I05: {
    summary: {
      zh: '结合文件本身的信息与可解析的 EXIF，查看图片的尺寸、格式及拍摄相关数据。',
      en: 'Combine basic file information with readable EXIF to inspect image dimensions, format and capture details.',
    },
    steps: [
      {
        zh: '读取文件名和字节数，从文件头识别实际格式，并解码取得按照片方向显示的尺寸。',
        en: 'Read the filename and byte size, identify the actual format from the file headers, and decode the image to obtain its dimensions in photo orientation.',
      },
      {
        zh: '解析原始文件中可读取的元数据，例如相机型号、曝光参数、拍摄时间或 GPS 坐标。',
        en: 'Parse readable metadata in the original file, such as camera model, exposure settings, capture time or GPS coordinates.',
      },
      {
        zh: '将基本信息和解析结果整理为 JSON，供查看或下载；没有可读 EXIF 时明确提示。',
        en: 'Combine the basic information and parsed fields into JSON for viewing or download, and indicate when no readable EXIF is found.',
      },
    ],
    implementation: {
      zh: '工具按需加载 exifr，调用 parse 读取原始文件中的元数据；尺寸则来自浏览器解码结果。查看操作不重新编码图片，也不修改或移除原图中的元数据。',
      en: 'The tool loads exifr on demand and calls parse to read metadata from the original file; dimensions come from browser decoding. Inspection does not re-encode the image or modify or remove its metadata.',
    },
    details: [
      {
        title: { zh: '基本信息与 EXIF 来自不同位置', en: 'Basic information and EXIF have different sources' },
        paragraphs: [
          {
            zh: '文件名和字节数直接取自浏览器 File 对象；MIME 来自文件头识别，而非上传时声明的类型或后缀。PNG 的 IHDR、JPEG 的 SOF、WebP 的图像块提供结构尺寸用于预先校验；最终展示的宽高则取浏览器解码后的图像对象。因此文件体积、像素数量和元数据中的尺寸字段可能不是同一概念。',
            en: 'Filename and byte size come directly from the browser File object. MIME comes from header inspection rather than the declared upload type or extension. PNG IHDR, JPEG SOF and WebP image chunks provide structural dimensions for preflight checks, while displayed dimensions come from the decoded image object. File size, pixel count and dimension fields inside metadata therefore represent different things.',
          },
          {
            zh: 'EXIF 常以 TIFF 结构存放在图片容器中，例如 JPEG 的 APP1 段。字段具有标签编号、数据类型、数量和偏移，整数还涉及字节序；exifr 负责定位结构、读取引用并把支持的标签转为可读字段。工具没有通过图片视觉内容推断相机型号、拍摄时间或位置。',
            en: 'EXIF commonly stores TIFF structures inside an image container, such as a JPEG APP1 segment. Fields have tag identifiers, types, counts and offsets, and integer values depend on byte order. exifr locates these structures, follows references and turns supported tags into readable fields. The tool does not infer camera model, capture time or location from visual image content.',
          },
        ],
      },
      {
        title: { zh: '方向标签与像素尺寸的关系', en: 'Orientation tags versus pixel dimensions' },
        paragraphs: [
          {
            zh: '方向标签可要求旋转或镜像显示，而不必重排原文件的像素。例如存储尺寸 4000×3000、方向要求旋转 90° 的照片，按方向显示后宽高会交换。工具请求 createImageBitmap 的 from-image 行为，失败时采用 Image 解码，并以实际得到的宽高处理预览；这不是工具自行用 EXIF 标签再次旋转。',
            en: 'An orientation tag can request rotation or mirroring without rearranging the stored pixels. For example, a photo stored as 4000×3000 with a 90° orientation displays with width and height swapped. The tool requests createImageBitmap’s from-image behavior, falls back to Image decoding if needed, and uses the resulting dimensions for the preview; it does not apply a second rotation from the EXIF tag itself.',
          },
          {
            zh: '元数据仍从原始文件解析，因此其中的方向或原始尺寸可能与预览方向不同，两者并不矛盾。这个查看流程只读取数据，既不会 toBlob 重新编码，也不会把方向归一化后写回文件；下载的是信息 JSON，而不是清除过元数据的图片。',
            en: 'Metadata is still parsed from the original file, so its orientation or stored dimensions can differ from the preview without contradiction. Inspection only reads data: it neither re-encodes with toBlob nor writes a normalized orientation back into the file. The download is information JSON, not an image with metadata removed.',
          },
        ],
      },
      {
        title: { zh: '解析结果的表示与边界', en: 'Representing parsed results and their limits' },
        paragraphs: [
          {
            zh: 'exifr 按需加载，解析失败时保留基本图片信息并给出提示；无可用结果时 exif 为 null。JSON.stringify 将 BigInt 转为十进制字符串以避免序列化报错，结果填入只读文本框而不作为 HTML 执行。标签可以缺失、被编辑或缺少时区，解析器也不保证支持所有厂商扩展，因此字段值不构成真实性鉴定。',
            en: 'exifr is loaded on demand; if parsing fails, basic image information remains available with a notice, and exif is null when there is no usable result. JSON.stringify converts BigInt values to decimal strings to avoid serialization errors, and the result is placed in a read-only text area rather than executed as HTML. Tags can be missing, edited or lack timezone information, and vendor extensions may be unsupported, so values are not an authenticity assessment.',
          },
        ],
        code: {
          zh: '基本信息 = { name: File.name, bytes: File.size,\n  mime: 文件头识别结果, width: 解码宽, height: 解码高 }\n元数据 = await exifr.parse(原始 File)\nJSON.stringify({ ...基本信息, exif: 元数据 || null })',
          en: 'basic = { name: File.name, bytes: File.size,\n  mime: detectedHeaderMIME, width: decodedWidth, height: decodedHeight }\nmetadata = await exifr.parse(originalFile)\nJSON.stringify({ ...basic, exif: metadata || null })',
        },
      },
    ],
    example: {
      input: { zh: '文件名 sample.png，实际为 PNG，File.size=2048，按方向解码后尺寸为 640×480 px。', en: 'The file is named sample.png, its contents are PNG, File.size=2048, and its oriented decoded dimensions are 640×480 px.' },
      output: { zh: '基本信息字段为 name="sample.png"、mime="image/png"、bytes=2048、width=640、height=480。', en: 'Basic fields are name="sample.png", mime="image/png", bytes=2048, width=640 and height=480.' },
      explanation: { zh: '名称和体积来自 File，类型来自字节签名，尺寸来自解码结果；是否另有 EXIF 字段必须解析原文件后确定，不能由这些基本字段推断。', en: 'Name and size come from File, type comes from the byte signature, and dimensions come from decoding. Any additional EXIF fields must be determined by parsing the original file and cannot be inferred from these basic fields.' },
    },
    limits: {
      zh: '仅接受静态 JPEG、PNG、WebP，单张最多 25 MiB、2400 万像素、单边 8192 px。只展示库能解析且文件实际包含的字段，缺失或解析失败不代表图片从未含有元数据；EXIF 值也不能证明拍摄信息真实。GPS 字段可能包含位置信息。',
      en: 'Static JPEG, PNG and WebP only, up to 25 MiB, 24 million pixels and 8192 px per side. Only fields present in the file and readable by the library are shown; missing fields or parsing failures do not mean the image never contained metadata, and EXIF values do not prove capture details are authentic. GPS fields may reveal location information.',
    },
  },
  F02: {
    summary: {
      zh: '把已有 PDF 页面复制到新文档中，按需要完成合并、选页、重排或分组拆分。',
      en: 'Copy existing PDF pages into new documents to merge, extract, reorder or split them into groups.',
    },
    steps: [
      {
        zh: '检查 PDF 文件头、加密状态和页数，并读取所选文件的页面结构。',
        en: 'Check PDF headers, encryption status and page counts, then read the page structure of the selected files.',
      },
      {
        zh: '合并时使用文件列表顺序；选页时将 1 起始页码转为页面索引，保留指定顺序和重复页；拆分时按分号划分输出组。',
        en: 'For merging, follow the file list order; for extraction, turn page numbers starting at 1 into page indices while preserving the requested order and duplicates; for splitting, use semicolons to separate output groups.',
      },
      {
        zh: '将对应页面依次复制到新 PDF，检查输出页数和文件大小，再保存为一个或多个可下载文件。',
        en: 'Copy the selected pages into new PDFs in sequence, check output page counts and file sizes, then save one or more downloadable files.',
      },
    ],
    implementation: {
      zh: '按需加载 pdf-lib，使用 PDFDocument.load 读取文档、copyPages 和 addPage 复制与排列页面，再调用 save 生成真实 PDF 字节。处理的是页面对象，不将页面栅格化为图片，也不进行 OCR 文字识别。',
      en: 'The tool loads pdf-lib on demand, reads documents with PDFDocument.load, copies and orders pages with copyPages and addPage, then calls save to generate actual PDF bytes. It works with page objects without rasterizing pages into images or performing OCR.',
    },
    details: [
      {
        title: { zh: '复制页面对象，不生成页面截图', en: 'Copying page objects rather than page screenshots' },
        paragraphs: [
          {
            zh: 'PDF 页面不是单一图片，而是页面字典、绘制指令内容流及字体、图片等资源引用的组合。工具检查前 1024 字节中的 %PDF- 标识，再由 PDFDocument.load 解析；页数和加密检查通过后，copyPages 负责把页面及相关引用复制到新文档的对象环境中，addPage 决定其排列顺序。',
            en: 'A PDF page is not necessarily one image: it combines a page dictionary, content streams of drawing instructions and references to resources such as fonts and images. The tool checks for %PDF- within the first 1024 bytes, then parses with PDFDocument.load. After page-count and encryption checks, copyPages imports pages and their related references into the new document’s object context, and addPage sets their order.',
          },
          {
            zh: '因此文字和矢量图形不会被主动截图成固定分辨率的位图；原本只有扫描图片的页面也不会凭空出现文字层。库负责对象引用与序列化，但页面复制不等于完整复制文档目录结构，表单、书签、签名等跨页面或文档级关系仍可能改变。',
            en: 'Text and vector graphics are therefore not deliberately captured into fixed-resolution bitmaps, while a scanned image page does not gain a text layer. The library handles object references and serialization, but page copying is not a complete copy of document-level structure: relationships involving forms, bookmarks, signatures or multiple pages can still change.',
          },
        ],
      },
      {
        title: { zh: '页码语法转换成有序索引', en: 'Converting page-range syntax into ordered indices' },
        paragraphs: [
          {
            zh: '页面输入从 1 开始，库的数组索引从 0 开始。解析器按逗号拆项，将 a-b 展开为含两端的递增序列，再把每项减 1；它不排序也不去重，因此可以重排和重复页面。零页码、倒序区间、空项及超出原文件页数的值会被拒绝，重复页也计入输出页数上限。',
            en: 'User page numbers start at 1, whereas library array indices start at 0. The parser splits comma-separated items, expands a-b into an inclusive ascending sequence, and subtracts 1 from each page. It neither sorts nor deduplicates, allowing reordering and repetition. Zero, descending ranges, empty items and values beyond the source page count are rejected; repeated pages count toward the output limit.',
          },
          {
            zh: '合并模式忽略页码框，逐个使用文件列表中的完整页序。拆分模式只接受一个源文件，先按分号建立多个范围组，再对每组创建独立 PDF；各组可以重叠，但总输出页数和总输出字节仍共同受限。',
            en: 'Merge mode ignores the ranges field and uses each listed file’s complete page order. Split mode accepts one source, divides semicolon-separated range groups, and creates an independent PDF for each group. Groups can overlap, but their combined output pages and bytes still share the limits.',
          },
        ],
        code: {
          zh: '"3,1-2,2" → 页码 [3,1,2,2] → 索引 [2,0,1,1]\n复制页 = await 输出.copyPages(源文档, 索引)\n按顺序执行 输出.addPage(复制页[i])\n字节 = await 输出.save()',
          en: '"3,1-2,2" → pages [3,1,2,2] → indices [2,0,1,1]\npages = await output.copyPages(source, indices)\ncall output.addPage(pages[i]) in order\nbytes = await output.save()',
        },
      },
      {
        title: { zh: '序列化、内存和取消边界', en: 'Serialization, memory and cancellation boundaries' },
        paragraphs: [
          {
            zh: 'save 生成新的完整 PDF 字节，而不是拼接原文件字节或流式写盘。解析对象、复制后的对象和序列化缓冲区可能同时驻留，100 MiB 文件限制并不等于 100 MiB 内存占用。工具在文件与组之间让出执行机会，并在库操作前后检查取消；输出大小在序列化后才能确定，超过限制便不提供该结果。',
            en: 'save generates a complete new PDF byte sequence rather than concatenating source bytes or streaming to disk. Parsed objects, copied objects and serialization buffers can coexist, so a 100 MiB file limit is not a 100 MiB memory limit. The tool yields between files and groups and checks cancellation around library operations. Output size is known after serialization; an oversized result is not offered.',
          },
        ],
      },
    ],
    example: {
      input: { zh: '一个四页 PDF，按原始页序将页面记为 A、B、C、D；选页输入 3,1-2,2。', en: 'A four-page PDF has source pages A, B, C and D in that order; the extraction input is 3,1-2,2.' },
      output: { zh: '新 PDF 有四页，顺序为 C、A、B、B；传给 copyPages 的索引为 [2,0,1,1]。', en: 'The new PDF has four pages ordered C, A, B, B; the indices passed to copyPages are [2,0,1,1].' },
      explanation: { zh: '区间 1-2 包含第 1 和第 2 页，末尾的 2 仍保留，因此 B 出现两次。若改用拆分输入 1-2;3-4，则分别得到两页的 A、B 文件与两页的 C、D 文件，文件字节数取决于资源与序列化。', en: 'Range 1-2 includes pages 1 and 2, and the final 2 is retained, so B appears twice. Split input 1-2;3-4 instead produces a two-page A, B file and a two-page C, D file; byte sizes depend on resources and serialization.' },
    },
    limits: {
      zh: '仅支持未加密的普通 PDF；最多 10 个文件，输入和输出各最多 100 MiB、合计各最多 1000 页；拆分最多 20 组。新文件不保留数字签名有效性，表单和书签等文档结构不保证保留；取消需等待当前库操作结束。',
      en: 'Unencrypted ordinary PDFs only; up to 10 files, with input and output each limited to 100 MiB and 1000 total pages, and up to 20 split groups. Digital signatures are not preserved as valid, and document structures such as forms and bookmarks may not survive; cancellation waits for the current library operation to finish.',
    },
  },
};
