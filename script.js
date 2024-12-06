document.addEventListener('DOMContentLoaded', function() {
    // 首先检查压缩库是否正确加载
    if (typeof imageCompression === 'undefined') {
        console.error('图片压缩库未加载成功');
        alert('页面加载出错，请检查网络连接后刷新页面重试！');
        return;
    }

    // 获取页面元素
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');
    const compressionSection = document.querySelector('.compression-section');
    const debugInfo = document.querySelector('.debug-info');
    
    let originalFile = null;
    let compressedBlob = null;

    // 处理文件拖放
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#007AFF';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#E5E5E5';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#E5E5E5';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // 点击上传区域触发文件选择
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // 处理图片压缩
    async function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件！');
            return;
        }

        try {
            originalFile = file;
            displayFileSize(file.size, 'originalSize');
            await displayImage(file, 'originalPreview');
            compressionSection.style.display = 'block';
            await compressImage();
        } catch (error) {
            console.error('处理文件失败:', error);
            alert('处理文件时出错，请重试！');
        }
    }

    // 压缩质量滑块变化时重新压缩
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value + '%';
        if (originalFile) {
            compressImage();
        }
    });

    // 图片压缩函数
    async function compressImage() {
        if (!originalFile) return;

        const options = {
            maxSizeMB: 10,
            maxWidthOrHeight: 1920,
            useWebWorker: false,  // 禁用 WebWorker 以避免可能的问题
            quality: qualitySlider.value / 100,
            fileType: originalFile.type  // 保持原始文件类型
        };

        try {
            debugInfo.textContent = '开始压缩...';
            const previewImg = document.getElementById('compressedPreview');
            previewImg.parentElement.classList.add('loading');

            console.log('压缩选项:', options);
            compressedBlob = await imageCompression(originalFile, options);
            
            console.log('压缩结果:', compressedBlob);
            displayFileSize(compressedBlob.size, 'compressedSize');
            await displayImage(compressedBlob, 'compressedPreview');
            
            previewImg.parentElement.classList.remove('loading');
            
            const ratio = ((1 - compressedBlob.size / originalFile.size) * 100).toFixed(1);
            debugInfo.textContent = `压缩完成！压缩率: ${ratio}%`;

        } catch (error) {
            console.error('压缩失败:', error);
            document.getElementById('compressedSize').textContent = '压缩失败';
            document.getElementById('compressedPreview').parentElement.classList.remove('loading');
            debugInfo.textContent = `压缩失败: ${error.message}`;
            alert('图片压缩失败，请重试！');
        }
    }

    // 下载压缩后的图片
    downloadBtn.addEventListener('click', () => {
        if (!compressedBlob) return;
        
        const url = URL.createObjectURL(compressedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'compressed_' + originalFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // 辅助函数：显示文件大小
    function displayFileSize(bytes, elementId) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        let i = 0;
        let size = bytes;
        while (size >= 1024 && i < sizes.length - 1) {
            size /= 1024;
            i++;
        }
        document.getElementById(elementId).textContent = 
            size.toFixed(2) + ' ' + sizes[i];
    }

    // 辅助函数：显示图片预览
    function displayImage(file, elementId) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.getElementById(elementId);
                img.src = e.target.result;
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('图片加载失败'));
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}); 