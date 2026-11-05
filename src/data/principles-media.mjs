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
    limits: {
      zh: '仅支持未加密的普通 PDF；最多 10 个文件，输入和输出各最多 100 MiB、合计各最多 1000 页；拆分最多 20 组。新文件不保留数字签名有效性，表单和书签等文档结构不保证保留；取消需等待当前库操作结束。',
      en: 'Unencrypted ordinary PDFs only; up to 10 files, with input and output each limited to 100 MiB and 1000 total pages, and up to 20 split groups. Digital signatures are not preserved as valid, and document structures such as forms and bookmarks may not survive; cancellation waits for the current library operation to finish.',
    },
  },
};
