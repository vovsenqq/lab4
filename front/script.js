let data = [];
let projections = [];
let numMeasurements = 0;
let numProjections = 0;
let angularStep = 0;
let charts = {};

document.getElementById('fileInput').addEventListener('change', loadData);
const numberInput = document.getElementById("cutOffFrequency");
let cutOffFrequency = numberInput.value;

numberInput.addEventListener("change", (event) => {
    cutOffFrequency = event.target.value;
});

function loadData(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const lines = event.target.result.split('\n');
        if (lines.length < 6) {
            alert('Invalid file format');
            return;
        }

        parseFileHeader(lines);
        projections = parseProjections(lines.slice(5));
    };
    reader.readAsText(file);
}

function parseFileHeader(lines) {
    numMeasurements = parseInt(lines[1]);
    numProjections = parseInt(lines[2]);
    angularStep = parseFloat(lines[3]);
}

function parseProjections(lines) {
    const projections = [];
    let currentProjection = [];
    let valueCount = 0;

    for (let i = 0; i < lines.length; i++) {
        if (valueCount === 200) {
            projections.push(currentProjection);
            currentProjection = [];
            valueCount = 0;
            i++; // Skip one line
            if (i >= lines.length) {
                break;
            }
        }

        const values = lines[i].trim().split(/\s+/).map(parseFloat).filter(v => !isNaN(v));
        currentProjection.push(...values);
        valueCount += values.length;
    }

    if (currentProjection.length > 0) {
        projections.push(currentProjection);
    }

    return projections;
}

function showProjection() {
    const projectionNumber = parseInt(document.getElementById('projectionNumber').value);
    if (projectionNumber < 1 || projectionNumber > projections.length) {
        alert('Invalid projection number');
        return;
    }

    const projectionData = projections[projectionNumber - 1];
    updateChart('projectionCanvas', `Projection ${projectionNumber}`, projectionData, numMeasurements);
    processProjectionData(projectionData);
}

function processProjectionData(projectionData) {
    sendProjectionData(projectionData, (data) => {
        const realPart = data.resRe;
        const imaginaryPart = data.resIm;
        const isFilterProjectionsChecked = document.getElementById('filterProjections').checked;

        let processedRealPart, processedImaginaryPart, spectrum;

        if (isFilterProjectionsChecked) {
            processedRealPart = applyLowPassGaussianFilter(realPart, cutOffFrequency);
            processedImaginaryPart = applyLowPassGaussianFilter(imaginaryPart, cutOffFrequency);
        } else {
            processedRealPart = realPart;
            processedImaginaryPart = imaginaryPart;
        }
    
        spectrum = computeSpectrum(processedRealPart, processedImaginaryPart);
        updateChart('spectrumProjectionCanvas', 'Projection Spectrum', spectrum, spectrum.length);
        sendFilteredProjectionData(processedRealPart, processedImaginaryPart, false);

    });
}

function sendProjectionData(projectionData, callback) {
    const formData = new FormData();
    let array = new Array(projectionData.length).fill(0);
    formData.append('inputRe', JSON.stringify(projectionData));
    formData.append('inputIm', JSON.stringify(array));

    fetch('http://localhost:3002/dfft', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(callback)
    .catch(error => console.error('Error:', error));
}

function sendFilteredProjectionData2(realInput, imInput, callback) {
    const formData = new FormData();
    formData.append('inputRe', JSON.stringify(realInput));
    formData.append('inputIm', JSON.stringify(imInput));

    fetch('http://localhost:3002/idfft', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(callback)
    .catch(error => console.error('Error:', error));
}

function sendFilteredProjectionData(realInput, imInput, restore) {
    const formData = new FormData();
    formData.append('inputRe', JSON.stringify(realInput));
    formData.append('inputIm', JSON.stringify(imInput));

    fetch('http://localhost:3002/idfft', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const realPart = data.resRe;
        const imaginaryPart = data.resIm;

        if (restore === false)  {
            const resultArrayRe = padAndShiftArray(realPart, 300);
            const resultArrayIm = padAndShiftArray(imaginaryPart, 300);
            updateChart('shiftedProjectionCanvas', 'Shifted Projection', resultArrayRe, resultArrayRe.length);
            sendShiftedProjectionData(resultArrayRe, resultArrayIm, false);
        }
    })
    .catch(error => console.error('Error:', error));
}

function sendShiftedProjectionData2(realInput, imInput, callback) {
    const formData = new FormData();
    formData.append('inputRe', JSON.stringify(realInput));
    formData.append('inputIm', JSON.stringify(imInput));

    fetch('http://localhost:3002/dfft', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(callback)
    .catch(error => console.error('Error:', error));
}

function sendShiftedProjectionData(realInput, imInput, restore) {
    const formData = new FormData();
    formData.append('inputRe', JSON.stringify(realInput));
    formData.append('inputIm', JSON.stringify(imInput));

    fetch('http://localhost:3002/dfft', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const realPart = data.resRe;
        const imaginaryPart = data.resIm;
        if (restore  === false)   {
            const spectrum = computeSpectrum(realPart, imaginaryPart);
            updateChart('shiftedSpectrumProjectionCanvas', 'Shifted Spectrum Projection', spectrum, spectrum.length);
        }

    })
    .catch(error => console.error('Error:', error));
}

function computeSpectrum(realPart, imaginaryPart) {
    return realPart.map((re, i) => Math.sqrt(re ** 2 + imaginaryPart[i] ** 2));
}

function padAndShiftArray(arr, padSize) {
    const paddedArray = [
        ...new Array(padSize).fill(0),
        ...arr,
        ...new Array(padSize).fill(0)
    ];

    const shift = Math.floor((padSize * 2 + arr.length) / 2) % paddedArray.length;
    return [
        ...paddedArray.slice(-shift),
        ...paddedArray.slice(0, -shift)
    ];
}

function applyLowPassGaussianFilter(spectrum, cutoffFrequency) {
    const size = spectrum.length;
    const sigma = cutoffFrequency;

    return spectrum.map((value, i) => {
        const distance = i - size / 2;
        const gaussianLowPass = Math.exp(-0.5 * (distance / sigma) ** 2);
        return value * gaussianLowPass;
    });
}

function updateChart(canvasId, label, data, xMax) {
    if (charts[canvasId]) {
        charts[canvasId].data.labels = Array.from({ length: xMax }, (_, i) => i);
        charts[canvasId].data.datasets[0].data = data;
        charts[canvasId].data.datasets[0].label = label;
        charts[canvasId].update();
    } else {
        const ctx = document.getElementById(canvasId).getContext('2d');
        charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({ length: xMax }, (_, i) => i),
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    fill: false
                }]
            },
            options: {
                scales: {
                    x: {
                        beginAtZero: true,
                        max: xMax - 1
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

function sendProjectionDataAsync(projectionData) {
    return new Promise((resolve, reject) => {
        sendProjectionData(projectionData, resolve, reject);
    });
}

function sendFilteredProjectionDataAsync(realInput, imInput) {
    return new Promise((resolve, reject) => {
        sendFilteredProjectionData2(realInput, imInput, resolve, reject);
    });
}

function sendShiftedProjectionDataAsync(realInput, imInput) {
    return new Promise((resolve, reject) => {
        sendShiftedProjectionData2(realInput, imInput, resolve, reject);
    });
}

async function restore() {
    let transformedProjections = [];

    for (const [index, projectionData] of projections.entries()) {
        try {
            const fftData = await sendProjectionDataAsync(projectionData);
            let realPart = fftData.resRe;
            let imaginaryPart = fftData.resIm;

            if (document.getElementById('filterProjections').checked) {
                realPart = applyLowPassGaussianFilter(realPart, cutOffFrequency);
                imaginaryPart = applyLowPassGaussianFilter(imaginaryPart, cutOffFrequency);
            }

            const ifftData = await sendFilteredProjectionDataAsync(realPart, imaginaryPart);
            const paddedRealPart = padAndShiftArray(ifftData.resRe, 300);
            const paddedImaginaryPart = padAndShiftArray(ifftData.resIm, 300);
            const finalFftData = await sendShiftedProjectionDataAsync(paddedRealPart, paddedImaginaryPart);

            transformedProjections.push({
                projectionNumber: index + 1,
                realPart: finalFftData.resRe,
                imaginaryPart: finalFftData.resIm
            });
        } catch (error) {
            console.error(`Error processing projection ${index + 1}:`, error);
        }
    }

    const spectrum = synthesize2DSpectrum(transformedProjections);
    visualizeSpectrum(spectrum);


    // // Генерация синтезированного спектра
    // const spectrum = synthesize2DSpectrum(transformedProjections);

    // Преобразование спектра в двумерные массивы для отправки
    const N = Math.sqrt(spectrum.length);
    const realPart = Array.from({ length: N }, (_, i) => spectrum.slice(i * N, (i + 1) * N).map(point => point.re));
    const imaginaryPart = Array.from({ length: N }, (_, i) => spectrum.slice(i * N, (i + 1) * N).map(point => point.im));

    try {
        // Отправка данных спектра на сервер для восстановления сигнала
        const restoredData = await sendSpectrumDataAsync(realPart, imaginaryPart);
        const restoredReal = restoredData.resRe;
        const restoredImaginary = restoredData.resIm;
        console.log(restoredReal);
        // Отображение восстановленного сигнала на canvas
        displayRestoredImage(restoredReal, restoredImaginary, 'restoredSectionCanvas');
    } catch (error) {
        console.error('Error restoring signal:', error);
    }
}
async function sendSpectrumDataAsync(realPart, imaginaryPart) {
    const formData = new FormData();
    formData.append('inputRe', JSON.stringify(realPart));
    formData.append('inputIm', JSON.stringify(imaginaryPart));

    const response = await fetch('http://localhost:3002/idfft2d', {
        method: 'POST',
        body: formData
    });
    return response.json();
}
function synthesize2DSpectrum(transformedProjections) {
    const N = numMeasurements;
    const M = numProjections;
    const dQ = angularStep;
    let Q = 0;
    const synthesized2DSpectrum = new Array(N * N).fill().map(() => ({ re: 0, im: 0 }));
    for (let k = 0; k < M; k++) {
        const sinTom = Math.sin(degToRad(Q));
        const cosTom = Math.cos(degToRad(Q));
        const realPart = transformedProjections[k].realPart;
        const imaginaryPart = transformedProjections[k].imaginaryPart;

        for (let s = 0; s < N; s++) {
            const t = s - Math.floor(N / 2);
            const wx = t * cosTom;
            const wy = t * sinTom;
            const i = Math.round(wx + Math.floor(N / 2));
            const j = Math.round(wy + Math.floor(N / 2));

            if (i >= 0 && i < N && j >= 0 && j < N) {
                const index = i * N + j;
                synthesized2DSpectrum[index].re = realPart[s];
                synthesized2DSpectrum[index].im = imaginaryPart[s];
            }
        }

        Q += dQ;
    }
    console.log(synthesized2DSpectrum)
    return synthesized2DSpectrum;
}

function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

function visualizeSpectrum(spectrum) {
    const canvasId = 'spectrumCanvas';
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');

    const N = Math.sqrt(spectrum.length);
    if (N % 1 !== 0) {
        console.error('Spectrum length is not a perfect square.');
        return;
    }

    const logScale = spectrum.map(point => Math.log(1 + Math.sqrt(point.re ** 2 + point.im ** 2)));
    const maxLogScale = Math.max(...logScale);
    const minLogScale = Math.min(...logScale);

    // Create a higher resolution canvas
    const highResCanvas = document.createElement('canvas');
    const highResCtx = highResCanvas.getContext('2d');
    highResCanvas.width = N * 2; // For example, doubling the resolution
    highResCanvas.height = N * 2;

    const highResImageData = highResCtx.createImageData(highResCanvas.width, highResCanvas.height);
    const highResData = highResImageData.data;

    for (let i = 0; i < highResCanvas.height; i++) {
        for (let j = 0; j < highResCanvas.width; j++) {
            const x = Math.floor(i / 2); // Mapping high resolution to original resolution
            const y = Math.floor(j / 2);
            const index = x * N + y;
            const value = logScale[index];

            // Normalize value to [0, 255]
            const normalizedValue = 255 * (value - minLogScale) / (maxLogScale - minLogScale);

            // Set pixel color (red)
            const pixelIndex = (i * highResCanvas.width + j) * 4;
            highResData[pixelIndex] = normalizedValue;     // Red
            highResData[pixelIndex + 1] = 0;               // Green
            highResData[pixelIndex + 2] = 0;               // Blue
            highResData[pixelIndex + 3] = 255;             // Alpha
        }
    }

    // Clear original canvas before drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the high resolution image data on the high resolution canvas
    highResCtx.putImageData(highResImageData, 0, 0);

    // Scale the high resolution canvas down to the original canvas size
    ctx.drawImage(highResCanvas, 0, 0, canvas.width, canvas.height);
}

async function restoreAndDisplay() {
    // Генерация синтезированного спектра
    const spectrum = synthesize2DSpectrum(transformedProjections);

    // Преобразование спектра в двумерные массивы для отправки
    const N = Math.sqrt(spectrum.length);
    const realPart = Array.from({ length: N }, (_, i) => spectrum.slice(i * N, (i + 1) * N).map(point => point.re));
    const imaginaryPart = Array.from({ length: N }, (_, i) => spectrum.slice(i * N, (i + 1) * N).map(point => point.im));

    try {
        // Отправка данных спектра на сервер для восстановления сигнала
        const restoredData = await sendSpectrumDataAsync(realPart, imaginaryPart);
        const restoredReal = restoredData.resRe;
        const restoredImaginary = restoredData.resIm;
        // Отображение восстановленного сигнала на canvas
        displayRestoredImage(restoredReal, restoredImaginary, 'restoredSectionCanvas');
    } catch (error) {
        console.error('Error restoring signal:', error);
    }
}

function displayRestoredImage(realPart, imaginaryPart, canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const N = realPart.length;

    const imageData = ctx.createImageData(N, N);
    const data = imageData.data;

    for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
            const i = x * N + y;
            const value = Math.sqrt(realPart[x][y] ** 2 + imaginaryPart[x][y] ** 2);

            // Нормализуем значение в диапазоне от 0 до 255
            const normalizedValue = Math.min(255, Math.max(0, value * 255 / Math.max(...realPart.flat(), ...imaginaryPart.flat())));

            // Устанавливаем пиксельное значение (оттенок серого)
            const index = (x * N + y) * 4;
            data[index] = normalizedValue;     // Красный канал
            data[index + 1] = normalizedValue; // Зеленый канал
            data[index + 2] = normalizedValue; // Синий канал
            data[index + 3] = 255;             // Альфа канал (непрозрачный)
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

// Создание пустых графиков при загрузке страницы
window.onload = function() {
    // updateChart('sinogramCanvas', 'Sinogram Model', Array(200).fill(0), 200);
    updateChart('projectionCanvas', 'Projection', Array(200).fill(0), 200);
    updateChart('spectrumProjectionCanvas', 'Projection Spectrum', Array(200).fill(0), 200);
    updateChart('shiftedProjectionCanvas', 'Shifted Projection', Array(800).fill(0), 800);
    updateChart('shiftedSpectrumProjectionCanvas', 'Shifted Spectrum Projection', Array(800).fill(0), 800);
    // updateChart('spectrumCanvas', 'Synthesized Section Spectrum', Array(200).fill(0), 200);
    // updateChart('restoredSectionCanvas', 'Restored Section', Array(200).fill(0), 200);
}