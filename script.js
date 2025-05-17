// TAB切换功能
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// 检查设备类型
const isAndroid = /Android/i.test(navigator.userAgent);
// 特别检测华为设备
const isHuawei = /HUAWEI|HONOR/i.test(navigator.userAgent);

// 如果是安卓设备，添加安卓设备类
if (isAndroid) {
    document.body.classList.add('android-device');
    console.log('检测到安卓设备，已启用安卓兼容模式');

    if (isHuawei) {
        document.body.classList.add('huawei-device');
        console.log('检测到华为设备，已启用华为专用兼容模式');
    }
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');

        // 移除所有active类
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // 添加active类到当前选中的tab
        tab.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
    });
});

// 正片叠底合成功能
// 元素引用
const uploadArea = document.getElementById('uploadArea');
let fileInput = document.getElementById('fileInput');
const errorMessage = document.getElementById('errorMessage');
const fileInfo = document.getElementById('fileInfo');
const fileCount = document.getElementById('fileCount');
const clearBtn = document.getElementById('clearBtn');
const processBtn = document.getElementById('processBtn');
const invertColorsCheckbox = document.getElementById('invertColors');
const previewContainer = document.getElementById('previewContainer');
const processingInfo = document.getElementById('processingInfo');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');
const resultCard = document.getElementById('resultCard');
const resultTitle = document.getElementById('resultTitle');
const resultImage = document.getElementById('resultImage');
const downloadBtn = document.getElementById('downloadBtn');
const processCanvas = document.getElementById('processCanvas');
const ctx = processCanvas.getContext('2d');

// 存储选定的文件
let selectedFiles = [];
let previews = [];
let shouldInvertColors = false;

// 事件监听
uploadArea.addEventListener('click', () => {
    // 华为设备特殊处理
    if (isHuawei) {
        // 显示确认提示
        const confirmed = confirm("检测到华为设备，是否使用推荐的多选方式选择图片？(可点击提示框中的指引操作)");
        if (confirmed) {
            // 创建临时input
            const tempInput = document.createElement('input');
            tempInput.type = 'file';
            tempInput.accept = '.jpg,.jpeg,.png';
            tempInput.multiple = true;
            tempInput.setAttribute('capture', 'false');

            // 使用更合适的方式触发选择文件
            tempInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                if (files && files.length > 0) {
                    validateAndProcessFiles(files);
                }
            });

            // 触发点击
            tempInput.click();
            return;
        }
    }

    // 默认行为
    fileInput.click();
});
fileInput.addEventListener('change', handleFileSelect);
clearBtn.addEventListener('click', clearSelection);
invertColorsCheckbox.addEventListener('change', (e) => {
    shouldInvertColors = e.target.checked;
});
processBtn.addEventListener('click', () => processImages(selectedFiles));
downloadBtn.addEventListener('click', downloadResult);

// 拖放事件
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);

// 处理拖动悬停
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('drag-over');
}

// 处理拖动离开
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
}

// 处理文件拖放
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    validateAndProcessFiles(files);
}

// 处理文件选择
function handleFileSelect(e) {
    const files = Array.from(fileInput.files);
    validateAndProcessFiles(files);

    // 安卓设备兼容性处理 - 在选择完成后重置input以确保下次选择正常工作
    if (isAndroid) {
        // 华为设备特殊处理
        if (isHuawei) {
            // 保存当前所有已选文件
            const savedFiles = [...selectedFiles];

            // 延迟重置input，避免影响当前选择
            setTimeout(() => {
                // 完全删除旧的input元素并创建新的
                const oldInput = fileInput;
                const parent = oldInput.parentNode;

                // 创建一个全新的input元素
                const newInput = document.createElement('input');
                newInput.type = 'file';
                newInput.id = 'fileInput';
                newInput.accept = '.jpg,.jpeg,.png';
                newInput.multiple = true;
                newInput.className = 'hidden';
                newInput.setAttribute('capture', 'false');

                // 替换旧元素
                parent.replaceChild(newInput, oldInput);

                // 更新引用并添加事件监听
                fileInput = newInput;
                fileInput.addEventListener('change', handleFileSelect);

                // 恢复已选文件
                selectedFiles = savedFiles;
            }, 300);
        } else {
            // 其他安卓设备的处理
            const savedFiles = [...files];

            setTimeout(() => {
                const newInput = fileInput.cloneNode(true);
                newInput.addEventListener('change', handleFileSelect);
                fileInput.parentNode.replaceChild(newInput, fileInput);
                fileInput = newInput;
            }, 500);
        }
    }
}

// 验证和处理文件
function validateAndProcessFiles(files) {
    clearError();

    // 验证文件数量
    if (selectedFiles.length + files.length > 50) {
        showError(`请选择1-50张图片（当前选择了${selectedFiles.length + files.length}张）`);
        return;
    }

    // 验证文件格式
    const invalidFiles = files.filter(file => !file.type.match(/image\/(jpe?g|png)/i));
    if (invalidFiles.length > 0) {
        showError('只支持JPG/PNG格式的图片');
        return;
    }

    // 追加新文件到已选文件列表
    selectedFiles.push(...files);
    fileCount.textContent = `已选择 ${selectedFiles.length} 张图片`;
    fileInfo.classList.remove('hidden');

    generatePreviews(selectedFiles); // 更新为显示全部已选文件
}

// 显示错误信息
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    uploadArea.classList.add('error');
}

// 清除错误信息
function clearError() {
    errorMessage.classList.add('hidden');
    uploadArea.classList.remove('error');
}

// 生成图片预览
function generatePreviews(files) {
    // 清除现有预览
    previewContainer.innerHTML = '';

    // 释放之前的预览URL
    previews.forEach(url => URL.revokeObjectURL(url));
    previews = [];

    // 生成新的预览（最多显示8张）
    const maxPreviews = Math.min(files.length, 8);
    for (let i = 0; i < maxPreviews; i++) {
        const url = URL.createObjectURL(files[i]);
        previews.push(url);

        const img = document.createElement('img');
        img.src = url;
        img.alt = `预览图 ${i + 1}`;
        img.className = 'preview-image';
        previewContainer.appendChild(img);
    }

    if (files.length > 8) {
        const message = document.createElement('p');
        message.textContent = `...还有${files.length - 8}张图片未显示`;
        message.style.gridColumn = '1 / -1';
        message.style.textAlign = 'center';
        message.style.color = '#666';
        previewContainer.appendChild(message);
    }
}

// 清除选择
function clearSelection() {
    fileInput.value = '';
    selectedFiles = [];

    // 释放预览URL
    previews.forEach(url => URL.revokeObjectURL(url));
    previews = [];

    fileInfo.classList.add('hidden');
    clearError();
    previewContainer.innerHTML = '';
    processingInfo.classList.add('hidden');
    resultCard.classList.add('hidden');
}

// 加载图像为 Image 对象
function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`无法加载图片: ${file.name}`));
        img.src = URL.createObjectURL(file);
    });
}

// 正片叠底算法实现 - 增强版
function multiplyBlend(baseColor, overlayColor) {
    // 增强的正片叠底算法，提高亮度保留
    return {
        r: Math.min(255, Math.max(5, Math.round((baseColor.r * overlayColor.r) / 200))), // 除以200而不是255，提高亮度
        g: Math.min(255, Math.max(5, Math.round((baseColor.g * overlayColor.g) / 200))), // 除以200而不是255，提高亮度
        b: Math.min(255, Math.max(5, Math.round((baseColor.b * overlayColor.b) / 200))), // 除以200而不是255，提高亮度
        a: Math.max(baseColor.a, overlayColor.a) // 保留较高的透明度
    };
}

// 色彩反转算法实现
function invertColor(color) {
    return {
        r: 255 - color.r,
        g: 255 - color.g,
        b: 255 - color.b,
        a: color.a
    };
}

// 处理图像
async function processImages(files) {
    if (!files || files.length === 0) {
        showError('请先选择图片');
        return;
    }

    try {
        processingInfo.classList.remove('hidden');

        // 设置标题和进度文字
        if (shouldInvertColors) {
            resultTitle.textContent = '正片叠底+色彩反转结果';
        } else {
            resultTitle.textContent = '正片叠底结果';
        }

        updateProgress('正在加载图片...', 10);

        // 加载所有图像
        const images = [];
        for (let i = 0; i < files.length; i++) {
            updateProgress(`加载图片 ${i + 1}/${files.length}...`, 10 + (20 * i / files.length));

            try {
                const image = await loadImage(files[i]);
                images.push(image);
            } catch (error) {
                console.error(`处理图片 ${i + 1} 时出错:`, error);
                throw new Error(`加载图片 ${i + 1} 失败: ${error.message || '未知错误'}`);
            }
        }

        if (images.length === 0) {
            throw new Error('无法加载任何图片，请检查图片格式是否正确');
        }

        updateProgress('正在检查图像尺寸...', 30);

        // 检查所有图像尺寸是否相同
        const width = images[0].width;
        const height = images[0].height;

        for (let i = 1; i < images.length; i++) {
            if (images[i].width !== width || images[i].height !== height) {
                throw new Error('所有图片的尺寸必须相同');
            }
        }

        // 设置Canvas尺寸
        processCanvas.width = width;
        processCanvas.height = height;

        updateProgress('开始正片叠底处理...', 40);

        // 绘制第一张图片到canvas
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(images[0], 0, 0);
        let imgData = ctx.getImageData(0, 0, width, height);
        let pixelData = imgData.data;

        // 判断是否有透明通道
        let hasTransparency = false;
        for (let i = 3; i < pixelData.length; i += 4) {
            if (pixelData[i] < 255) {
                hasTransparency = true;
                break;
            }
        }

        // 逐一处理每张图片
        for (let i = 1; i < images.length; i++) {
            updateProgress(`正在处理第 ${i + 1}/${images.length} 张图片...`, 40 + (40 * i / images.length));

            // 绘制叠加图像到临时canvas
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(images[i], 0, 0);
            const overlayData = ctx.getImageData(0, 0, width, height).data;

            // 像素级正片叠底处理
            for (let j = 0; j < pixelData.length; j += 4) {
                const baseColor = {
                    r: pixelData[j],
                    g: pixelData[j + 1],
                    b: pixelData[j + 2],
                    a: pixelData[j + 3]
                };

                const overlayColor = {
                    r: overlayData[j],
                    g: overlayData[j + 1],
                    b: overlayData[j + 2],
                    a: overlayData[j + 3]
                };

                // 改进的像素处理逻辑
                // 如果两个像素都不完全透明，则进行正片叠底
                if (baseColor.a > 0 && overlayColor.a > 0) {
                    // 计算透明度混合系数
                    const baseAlpha = baseColor.a / 255;
                    const overlayAlpha = overlayColor.a / 255;
                    const resultAlpha = baseAlpha + overlayAlpha * (1 - baseAlpha);

                    // 亮度增强处理
                    // 如果两个像素中有一个亮度较高，保留更多亮度信息
                    const baseBrightness = (baseColor.r + baseColor.g + baseColor.b) / 3;
                    const overlayBrightness = (overlayColor.r + overlayColor.g + overlayColor.b) / 3;

                    // 如果任一图层亮度高于阈值，使用亮度保留模式
                    if (baseBrightness > 200 || overlayBrightness > 200) {
                        // 亮度保留模式 - 取两者中较亮的部分
                        pixelData[j] = Math.max(baseColor.r, overlayColor.r);
                        pixelData[j + 1] = Math.max(baseColor.g, overlayColor.g);
                        pixelData[j + 2] = Math.max(baseColor.b, overlayColor.b);
                    }
                    // 如果两个像素都有颜色值且不是纯黑，使用增强的正片叠底
                    else if ((baseColor.r > 10 || baseColor.g > 10 || baseColor.b > 10) &&
                        (overlayColor.r > 10 || overlayColor.g > 10 || overlayColor.b > 10)) {
                        const resultColor = multiplyBlend(baseColor, overlayColor);

                        // 确保颜色值不会太暗
                        pixelData[j] = Math.max(10, resultColor.r);
                        pixelData[j + 1] = Math.max(10, resultColor.g);
                        pixelData[j + 2] = Math.max(10, resultColor.b);
                    } else {
                        // 如果其中一个像素接近黑色，使用加法混合而不是乘法
                        pixelData[j] = Math.min(255, baseColor.r + overlayColor.r);
                        pixelData[j + 1] = Math.min(255, baseColor.g + overlayColor.g);
                        pixelData[j + 2] = Math.min(255, baseColor.b + overlayColor.b);
                    }

                    // 设置透明度
                    pixelData[j + 3] = Math.round(resultAlpha * 255);
                }
                // 如果基础像素透明但叠加像素不透明，使用叠加像素
                else if (baseColor.a === 0 && overlayColor.a > 0) {
                    pixelData[j] = overlayColor.r;
                    pixelData[j + 1] = overlayColor.g;
                    pixelData[j + 2] = overlayColor.b;
                    pixelData[j + 3] = overlayColor.a;
                }
                // 如果叠加像素透明但基础像素不透明，保持基础像素不变
                // 如果两个像素都透明，则保持透明
            }
        }

        // 最终亮度提升 - 对整体结果进行亮度增强
        for (let i = 0; i < pixelData.length; i += 4) {
            if (pixelData[i + 3] > 0) {  // 只处理不透明的像素
                // 计算当前像素的亮度
                const brightness = (pixelData[i] + pixelData[i + 1] + pixelData[i + 2]) / 3;

                // 如果亮度低于阈值，提升亮度
                if (brightness < 100) {
                    const boost = 1.5;  // 亮度提升系数
                    pixelData[i] = Math.min(255, Math.round(pixelData[i] * boost));
                    pixelData[i + 1] = Math.min(255, Math.round(pixelData[i + 1] * boost));
                    pixelData[i + 2] = Math.min(255, Math.round(pixelData[i + 2] * boost));
                }
            }
        }

        // 如果选择了色彩反转，在正片叠底完成后应用
        if (shouldInvertColors) {
            updateProgress('正在反转色彩...', 85);

            for (let i = 0; i < pixelData.length; i += 4) {
                // 只反转不透明的像素
                if (pixelData[i + 3] > 0) {
                    pixelData[i] = 255 - pixelData[i];         // R
                    pixelData[i + 1] = 255 - pixelData[i + 1]; // G
                    pixelData[i + 2] = 255 - pixelData[i + 2]; // B
                }
            }
        }

        updateProgress('生成结果图片...', 95);

        // 将处理后的图像数据放回canvas
        ctx.putImageData(imgData, 0, 0);

        // 新增水印绘制
        addWatermark(ctx, width, height);

        // 生成结果图像的数据URL，如果有透明通道则使用PNG格式
        const format = hasTransparency ? 'image/png' : 'image/jpeg';
        const base64 = processCanvas.toDataURL(format);

        // 显示结果
        resultImage.src = base64;
        resultCard.classList.remove('hidden');

        updateProgress('处理完成！', 100);
        setTimeout(() => {
            processingInfo.classList.add('hidden');
        }, 1000);

    } catch (error) {
        console.error('处理图片时出错:', error);
        processingInfo.classList.add('hidden');
        showError(error.message || '处理图片时发生错误');
    }
}

// 更新进度
function updateProgress(text, percent) {
    progressText.textContent = text;
    progressBar.style.width = `${percent}%`;
}

// 下载结果图像
function downloadResult() {
    if (!resultImage.src) return;

    const link = document.createElement('a');
    link.href = resultImage.src;

    // 根据是否反转色彩设置下载文件名和格式
    const fileExt = resultImage.src.startsWith('data:image/png') ? 'png' : 'jpg';
    if (shouldInvertColors) {
        link.download = `正片叠底-色彩反转结果.${fileExt}`;
    } else {
        link.download = `正片叠底结果.${fileExt}`;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 图像分割功能
const splitUploadArea = document.getElementById('splitUploadArea');
let splitFileInput = document.getElementById('splitFileInput');
const splitErrorMessage = document.getElementById('splitErrorMessage');
const splitFileInfo = document.getElementById('splitFileInfo');
const splitPreviewImage = document.getElementById('splitPreviewImage');
const fragmentSizeRange = document.getElementById('fragmentSizeRange');
const fragmentSizeValue = document.getElementById('fragmentSizeValue');
const piecesRange = document.getElementById('piecesRange');
const piecesValue = document.getElementById('piecesValue');
const splitInvertColors = document.getElementById('splitInvertColors');
const splitBtn = document.getElementById('splitBtn');
const splitClearBtn = document.getElementById('splitClearBtn');
const splitProcessingInfo = document.getElementById('splitProcessingInfo');
const splitProgressText = document.getElementById('splitProgressText');
const splitProgressBar = document.getElementById('splitProgressBar');
const splitResultCard = document.getElementById('splitResultCard');
const splitResultCount = document.getElementById('splitResultCount');
const totalFragmentsCount = document.getElementById('totalFragmentsCount');
const splitResultContainer = document.getElementById('splitResultContainer');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const splitCanvas = document.getElementById('splitCanvas');
const splitCtx = splitCanvas.getContext('2d');

// 存储分割选项和结果
let splitFiles = [];        // 修改为数组，存储多张图片
let splitPreviewUrls = [];  // 修改为数组，存储多张图片的预览URL
let splitResults = [];
let numPieces = 8;        // 分割成多少张图片
let fragmentSize = 30;    // 碎片大小，单位为px
let bgColor = 'white';    // 底片颜色，默认为白色
let shouldInvertSplitColors = true;  // 默认勾选分割后反转色彩

// 更新范围滑块的值显示
fragmentSizeRange.addEventListener('input', () => {
    fragmentSize = parseInt(fragmentSizeRange.value);
    fragmentSizeValue.textContent = fragmentSize;
});

piecesRange.addEventListener('input', () => {
    numPieces = parseInt(piecesRange.value);
    piecesValue.textContent = numPieces;
});

splitInvertColors.addEventListener('change', (e) => {
    shouldInvertSplitColors = e.target.checked;
});

// 背景颜色单选框事件
document.querySelectorAll('input[name="bgColor"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        bgColor = e.target.value;
    });
});

// 事件监听
splitUploadArea.addEventListener('click', () => {
    // 华为设备特殊处理
    if (isHuawei) {
        // 显示确认提示
        const confirmed = confirm("检测到华为设备，是否使用推荐的多选方式选择图片？(可点击提示框中的指引操作)");
        if (confirmed) {
            // 创建临时input
            const tempInput = document.createElement('input');
            tempInput.type = 'file';
            tempInput.accept = '.jpg,.jpeg,.png';
            tempInput.multiple = true;
            tempInput.setAttribute('capture', 'false');

            // 使用更合适的方式触发选择文件
            tempInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                if (files && files.length > 0) {
                    validateSplitFiles(files);
                }
            });

            // 触发点击
            tempInput.click();
            return;
        }
    }

    // 默认行为
    splitFileInput.click();
});
splitFileInput.addEventListener('change', handleSplitFileSelect);
splitBtn.addEventListener('click', splitImage);
splitClearBtn.addEventListener('click', clearSplitSelection);
downloadAllBtn.addEventListener('click', downloadAllSplitImages);

// 拖放事件
splitUploadArea.addEventListener('dragover', handleSplitDragOver);
splitUploadArea.addEventListener('dragleave', handleSplitDragLeave);
splitUploadArea.addEventListener('drop', handleSplitDrop);

function handleSplitDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    splitUploadArea.classList.add('drag-over');
}

function handleSplitDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    splitUploadArea.classList.remove('drag-over');
}

function handleSplitDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    splitUploadArea.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        validateSplitFiles(files);
    }
}

function handleSplitFileSelect(e) {
    const files = Array.from(splitFileInput.files);
    validateSplitFiles(files);

    // 安卓设备兼容性处理
    if (isAndroid) {
        // 华为设备特殊处理
        if (isHuawei) {
            // 保存当前所有已选文件
            const savedFiles = [...selectedFiles];

            // 延迟重置input
            setTimeout(() => {
                // 完全删除旧的input元素并创建新的
                const oldInput = splitFileInput;
                const parent = oldInput.parentNode;

                // 创建一个全新的input元素
                const newInput = document.createElement('input');
                newInput.type = 'file';
                newInput.id = 'splitFileInput';
                newInput.accept = '.jpg,.jpeg,.png';
                newInput.multiple = true;
                newInput.className = 'hidden';
                newInput.setAttribute('capture', 'false');

                // 替换旧元素
                parent.replaceChild(newInput, oldInput);

                // 更新引用并添加事件监听
                splitFileInput = newInput;
                splitFileInput.addEventListener('change', handleSplitFileSelect);

                // 如果当前处理过程中失去了文件引用，则恢复它们
                if (splitFiles.length === 0 && savedFiles.length > 0) {
                    splitFiles = savedFiles;
                }
            }, 300);
        } else {
            // 其他安卓设备的处理
            const savedFiles = [...files];

            setTimeout(() => {
                const newInput = splitFileInput.cloneNode(true);
                newInput.addEventListener('change', handleSplitFileSelect);
                splitFileInput.parentNode.replaceChild(newInput, splitFileInput);
                splitFileInput = newInput;
            }, 500);
        }
    }
}

function validateSplitFiles(files) {
    clearSplitError();

    // 验证文件格式
    const invalidFiles = files.filter(file => !file.type.match(/image\/(jpe?g|png)/i));
    if (invalidFiles.length > 0) {
        showSplitError('只支持JPG/PNG格式的图片');
        return;
    }

    // 存储文件并显示预览
    splitFiles = files;

    // 清除之前的预览URL
    splitPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    splitPreviewUrls = [];

    // 创建预览区域
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';

    // 最多显示8张预览
    const maxPreviews = Math.min(files.length, 8);
    for (let i = 0; i < maxPreviews; i++) {
        const previewUrl = URL.createObjectURL(files[i]);
        splitPreviewUrls.push(previewUrl);

        const img = document.createElement('img');
        img.src = previewUrl;
        img.alt = `预览图 ${i + 1}`;
        img.className = 'preview-image';
        previewContainer.appendChild(img);
    }

    if (files.length > 8) {
        const message = document.createElement('p');
        message.textContent = `...还有${files.length - 8}张图片未显示`;
        message.style.gridColumn = '1 / -1';
        message.style.textAlign = 'center';
        message.style.color = '#666';
        previewContainer.appendChild(message);
    }

    // 替换原有的单图预览区域
    const oldPreviewContainer = document.querySelector('#splitFileInfo .preview-container');
    oldPreviewContainer.parentNode.replaceChild(previewContainer, oldPreviewContainer);

    splitFileInfo.classList.remove('hidden');
}

function showSplitError(message) {
    splitErrorMessage.textContent = message;
    splitErrorMessage.classList.remove('hidden');
    splitUploadArea.classList.add('error');
}

function clearSplitError() {
    splitErrorMessage.classList.add('hidden');
    splitUploadArea.classList.remove('error');
}

function clearSplitSelection() {
    splitFileInput.value = '';
    splitFiles = [];

    // 清除所有预览URL
    splitPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    splitPreviewUrls = [];

    splitFileInfo.classList.add('hidden');
    clearSplitError();
    splitProcessingInfo.classList.add('hidden');
    splitResultCard.classList.add('hidden');

    // 清除结果
    splitResults.forEach(result => URL.revokeObjectURL(result.url));
    splitResults = [];
    splitResultContainer.innerHTML = '';
}

function updateSplitProgress(text, percent) {
    splitProgressText.textContent = text;
    splitProgressBar.style.width = `${percent}%`;
}

// 加载分割图像
async function loadSplitImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`无法加载图片: ${file.name}`));
        img.src = URL.createObjectURL(file);
    });
}

// 创建碎片分布
function createFragments(width, height, fragmentSize, numPieces) {
    // 计算图像可以容纳的碎片数量
    const cols = Math.floor(width / fragmentSize);
    const rows = Math.floor(height / fragmentSize);

    // 创建所有可能的碎片位置
    const allPositions = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            allPositions.push({
                x: x * fragmentSize,
                y: y * fragmentSize,
                width: fragmentSize,
                height: fragmentSize
            });
        }
    }

    // 随机打乱位置
    shuffleArray(allPositions);

    // 将碎片分配到不同的图片中
    const fragments = [];
    for (let i = 0; i < allPositions.length; i++) {
        const pieceIndex = i % numPieces;
        if (!fragments[pieceIndex]) {
            fragments[pieceIndex] = [];
        }
        fragments[pieceIndex].push(allPositions[i]);
    }

    return fragments;
}

// 打乱数组的辅助函数
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 生成分割后的图像
async function generateSplitImages(img, fragments, numPieces, bgColor, invert) {
    const results = [];

    for (let i = 0; i < numPieces; i++) {
        updateSplitProgress(`正在生成第 ${i + 1}/${numPieces} 张碎片图...`, 30 + (60 * i / numPieces));

        // 清除Canvas
        splitCtx.clearRect(0, 0, splitCanvas.width, splitCanvas.height);

        // 设置背景色
        if (bgColor === 'white') {
            splitCtx.fillStyle = '#ffffff';
            splitCtx.fillRect(0, 0, splitCanvas.width, splitCanvas.height);
        } else if (bgColor === 'black') {
            splitCtx.fillStyle = '#000000';
            splitCtx.fillRect(0, 0, splitCanvas.width, splitCanvas.height);
        }
        // 透明背景不需要额外处理

        // 绘制该图片的碎片
        const pieceFragments = fragments[i] || [];
        for (const fragment of pieceFragments) {
            splitCtx.drawImage(
                img,
                fragment.x, fragment.y, fragment.width, fragment.height,
                fragment.x, fragment.y, fragment.width, fragment.height
            );
        }

        // 如果需要反转颜色
        if (invert) {
            const imageData = splitCtx.getImageData(0, 0, splitCanvas.width, splitCanvas.height);
            const data = imageData.data;

            for (let j = 0; j < data.length; j += 4) {
                // 只反转不透明的像素
                if (data[j + 3] > 0) {
                    data[j] = 255 - data[j];         // R
                    data[j + 1] = 255 - data[j + 1]; // G
                    data[j + 2] = 255 - data[j + 2]; // B
                }
            }

            splitCtx.putImageData(imageData, 0, 0);
        }

        // 添加水印
        addWatermark(splitCtx, splitCanvas.width, splitCanvas.height);

        // 生成图像URL
        const format = bgColor === 'transparent' ? 'image/png' : 'image/jpeg';
        const dataURL = splitCanvas.toDataURL(format, 0.9);

        results.push({
            dataURL,
            fragmentCount: pieceFragments.length
        });
    }

    return results;
}

// 显示分割结果
function displaySplitResults(results, totalFragments) {
    splitResults = results.map(r => ({ url: r.dataURL, fragmentCount: r.fragmentCount }));

    // 更新结果计数
    splitResultCount.textContent = results.length;
    totalFragmentsCount.textContent = totalFragments;

    // 清除现有结果
    splitResultContainer.innerHTML = '';

    // 添加每个结果图像
    results.forEach((result, index) => {
        const card = document.createElement('div');
        card.className = 'split-image-card';

        const img = document.createElement('img');
        img.src = result.dataURL;
        img.className = 'split-image';
        img.alt = `碎片图 ${index + 1}`;

        const info = document.createElement('div');
        info.className = 'split-image-info';
        info.textContent = `碎片图 ${index + 1} (${result.fragmentCount}个碎片)`;

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn';
        downloadBtn.textContent = `下载 ${index + 1}`;
        downloadBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.href = result.dataURL;
            const ext = bgColor === 'transparent' ? 'png' : 'jpg';
            link.download = `碎片图_${index + 1}_碎片数${result.fragmentCount}.${ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        card.appendChild(img);
        card.appendChild(info);
        card.appendChild(downloadBtn);

        splitResultContainer.appendChild(card);
    });

    // 显示结果卡片
    splitResultCard.classList.remove('hidden');
}

// 分割图像主函数
async function splitImage() {
    if (splitFiles.length === 0) {
        showSplitError('请先选择图片');
        return;
    }

    try {
        splitProcessingInfo.classList.remove('hidden');
        updateSplitProgress('正在准备分割...', 5);

        // 清除之前的结果
        splitResults.forEach(result => URL.revokeObjectURL(result.url));
        splitResults = [];

        // 加载图像
        const img = await loadImage(splitFiles[0]);

        // 设置Canvas尺寸
        splitCanvas.width = img.width;
        splitCanvas.height = img.height;

        // 计算碎片数量
        const imgArea = img.width * img.height;
        const fragmentArea = fragmentSize * fragmentSize;
        const totalFragments = Math.floor(imgArea / fragmentArea);

        updateSplitProgress('正在计算碎片分布...', 15);

        // 创建碎片分布
        const fragments = createFragments(img.width, img.height, fragmentSize, numPieces);

        updateSplitProgress('正在生成碎片图像...', 30);

        // 生成碎片图像
        const results = await generateSplitImages(img, fragments, numPieces, bgColor, shouldInvertSplitColors);

        // 显示结果
        displaySplitResults(results, fragments.flat().length);

        updateSplitProgress('分割完成！', 100);
        setTimeout(() => {
            splitProcessingInfo.classList.add('hidden');
        }, 1000);

    } catch (error) {
        console.error('分割图片时出错:', error);
        splitProcessingInfo.classList.add('hidden');
        showSplitError(error.message || '分割图片时发生错误');
    }
}

// 新增水印绘制函数
function addWatermark(context, width, height) {
    const text = "© 拼图 公众号：蓝友畅言吧";
    const fontSize = Math.max(12, width * 0.02); // 根据图片尺寸动态调整字号
    const padding = 5;

    // 测量文本宽度
    context.font = `${fontSize}px Arial`;
    const textWidth = context.measureText(text).width;

    // 计算水印位置（右下角）
    const x = width - textWidth - padding * 2;
    const y = height - fontSize - padding;

    // 绘制白色背景
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    context.fillRect(x - padding, y - padding, textWidth + padding * 2, fontSize + padding * 2);

    // 绘制黑色文字
    context.fillStyle = '#000';
    context.fillText(text, x, y + fontSize);
}

// 下载所有分割图像
function downloadAllSplitImages() {
    if (splitResults.length === 0) {
        alert('没有可下载的图片');
        return;
    }

    // 创建一个ZIP文件
    const zip = new JSZip();

    // 只有在浏览器支持时才使用JSZip
    if (typeof JSZip === 'undefined') {
        // 如果JSZip不可用，退回到逐个下载
        splitResults.forEach((result, index) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = result.url;
                // 根据底片颜色决定文件扩展名
                const ext = bgColor === 'transparent' ? 'png' : 'jpg';
                link.download = `碎片图_${index + 1}_碎片数${result.fragmentCount}.${ext}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, index * 500); // 每个下载间隔500毫秒，避免浏览器阻止多次下载
        });
        return;
    }

    // 显示进度信息
    splitProcessingInfo.classList.remove('hidden');
    updateSplitProgress('正在准备下载...', 0);

    // 创建图片文件夹
    const imgFolder = zip.folder("分割图片");

    // 添加所有图片到zip
    let count = 0;
    splitResults.forEach((result, index) => {
        // 去除Data URL前缀，获取base64数据
        let base64Data;
        if (bgColor === 'transparent') {
            base64Data = result.url.replace(/^data:image\/png;base64,/, "");
        } else {
            base64Data = result.url.replace(/^data:image\/jpeg;base64,/, "");
        }

        // 根据底片颜色决定文件扩展名
        const ext = bgColor === 'transparent' ? 'png' : 'jpg';
        imgFolder.file(`碎片图_${index + 1}_碎片数${result.fragmentCount}.${ext}`, base64Data, { base64: true });

        // 更新进度
        count++;
        const percent = Math.round((count / splitResults.length) * 80);
        updateSplitProgress(`正在打包图片 ${count}/${splitResults.length}...`, percent);
    });

    // 生成ZIP文件并下载
    updateSplitProgress('正在生成ZIP文件...', 90);
    zip.generateAsync({ type: "blob" }).then(function (content) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "分割图片.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 完成下载
        updateSplitProgress('下载完成!', 100);
        setTimeout(() => {
            splitProcessingInfo.classList.add('hidden');
        }, 1000);
    });
}

// 历史记录功能
// 元素引用
const historyContainer = document.getElementById('historyContainer');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const historyModal = document.getElementById('historyModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTitle = document.getElementById('modalTitle');
const modalImage = document.getElementById('modalImage');
const modalTime = document.getElementById('modalTime');
const modalType = document.getElementById('modalType');
const modalSize = document.getElementById('modalSize');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');

// 历史记录存储键名
const HISTORY_STORAGE_KEY = 'pinhaotu_history';

// 初始化历史记录
let imageHistory = [];

// 加载历史记录
function loadHistory() {
    try {
        const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (storedHistory) {
            imageHistory = JSON.parse(storedHistory);
            displayHistory();
        }
    } catch (error) {
        console.error('加载历史记录失败:', error);
    }
}

// 保存历史记录
function saveHistory() {
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(imageHistory));
    } catch (error) {
        console.error('保存历史记录失败:', error);
    }
}

// 添加历史记录
function addToHistory(imageData, type) {
    // 创建历史记录项
    const historyItem = {
        id: Date.now(), // 使用时间戳作为唯一ID
        date: new Date().toLocaleString(),
        type: type,
        imageData: imageData,
        // 获取图片尺寸
        width: 0,
        height: 0
    };

    // 加载图片以获取尺寸
    const img = new Image();
    img.onload = function () {
        historyItem.width = img.width;
        historyItem.height = img.height;

        // 将新记录添加到历史记录开头
        imageHistory.unshift(historyItem);

        // 限制历史记录数量，最多保存20条
        if (imageHistory.length > 20) {
            imageHistory = imageHistory.slice(0, 20);
        }

        // 保存到本地存储
        saveHistory();

        // 如果当前在历史记录标签页，则更新显示
        if (document.getElementById('history-tab').classList.contains('active')) {
            displayHistory();
        }
    };
    img.src = imageData;
}

// 显示历史记录
function displayHistory() {
    historyContainer.innerHTML = '';

    if (imageHistory.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-history">
                <i class="fa-solid fa-folder-open"></i>
                <p>暂无历史记录</p>
            </div>
        `;
        return;
    }

    imageHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.dataset.id = item.id;

        historyItem.innerHTML = `
            <img src="${item.imageData}" alt="历史图片" class="history-image">
            <div class="history-info">
                <div class="history-date">${formatDate(item.date)}</div>
                <div class="history-type">${item.type}</div>
            </div>
        `;

        historyItem.addEventListener('click', () => {
            showHistoryDetail(item);
        });

        historyContainer.appendChild(historyItem);
    });
}

// 格式化日期显示
function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        // 如果是已经格式化的字符串，直接返回
        return dateString;
    }

    return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 显示历史记录详情
function showHistoryDetail(item) {
    modalTitle.textContent = `图片详情 (${formatDate(item.date)})`;
    modalImage.src = item.imageData;
    modalTime.textContent = item.date;
    modalType.textContent = item.type;
    modalSize.textContent = item.width && item.height ? `${item.width} × ${item.height} 像素` : '未知';

    // 设置下载按钮
    modalDownloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.href = item.imageData;
        link.download = `拼好图_${item.type}_${formatDateForFilename(item.date)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 显示弹窗
    historyModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // 防止背景滚动
}

// 格式化日期用于文件名
function formatDateForFilename(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        // 如果解析失败，使用当前时间
        return new Date().toISOString().replace(/[:.]/g, '-');
    }

    return date.toISOString().replace(/[:.]/g, '-');
}

// 关闭弹窗
function closeModal() {
    historyModal.classList.remove('active');
    document.body.style.overflow = ''; // 恢复背景滚动
}

// 清除所有历史记录
function clearAllHistory() {
    if (confirm('确定要清除所有历史记录吗？此操作不可恢复。')) {
        imageHistory = [];
        saveHistory();
        displayHistory();
    }
}

// 修改处理图像函数，添加保存历史记录功能
const originalProcessImages = processImages;
processImages = async function (files) {
    await originalProcessImages(files);

    // 如果处理成功且有结果图像，则添加到历史记录
    if (!resultCard.classList.contains('hidden') && resultImage.src) {
        const type = shouldInvertColors ? '正片叠底+色彩反转' : '正片叠底';
        addToHistory(resultImage.src, type);
    }
};

// 修改分割图像函数，添加保存历史记录功能
const originalSplitImage = splitImage;
splitImage = async function () {
    await originalSplitImage();

    // 如果分割成功且有结果，则添加每个分割结果到历史记录
    if (splitResults.length > 0) {
        splitResults.forEach(result => {
            const type = `图像分割 (${result.index}/${splitResults.length})`;
            addToHistory(result.url, type);
        });
    }
};

// 事件监听
clearHistoryBtn.addEventListener('click', clearAllHistory);
closeModalBtn.addEventListener('click', closeModal);

// 点击弹窗背景关闭弹窗
historyModal.addEventListener('click', (e) => {
    if (e.target === historyModal) {
        closeModal();
    }
});

// ESC键关闭弹窗
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && historyModal.classList.contains('active')) {
        closeModal();
    }
});

// 初始化加载历史记录
document.addEventListener('DOMContentLoaded', function () {
    loadHistory();

    // 初始化分图功能的默认值
    bgColor = document.querySelector('input[name="bgColor"]:checked').value || 'white';
    shouldInvertSplitColors = document.getElementById('splitInvertColors').checked;
});