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
        drawSinogram(projections)
    };
    reader.readAsText(file);
}

function parseFileHeader(lines) {
    numMeasurements = parseInt(lines[1]);
    numProjections = parseInt(lines[2]);
    angularStep = parseFloat(lines[3]);
    console.log(numMeasurements, numProjections, angularStep);
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

    fetch('http://194.87.244.74:3003/dfft4', {
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

    fetch('http://194.87.244.74:3003/idfft4', {
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

    fetch('http://194.87.244.74:3003/idfft4', {
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

    fetch('http://194.87.244.74:3003/dfft4', {
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

    fetch('http://194.87.244.74:3003/dfft4', {
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
    // Добавление нулевых элементов в начало и конец массива
    const paddedArray = [
        ...new Array(padSize).fill(0),
        ...arr,
        ...new Array(padSize).fill(0)
    ];

    // Вычисление сдвига на половину длины нового массива
    const shift = Math.floor(paddedArray.length / 2);

    // Циклический сдвиг массива
    const shiftedArray = [
        ...paddedArray.slice(-shift),
        ...paddedArray.slice(0, -shift)
    ];

    return shiftedArray;
}


function applyLowPassGaussianFilter(spectrum, cutoffFrequency) {
    const size = spectrum.length;
    const sigma = cutoffFrequency;

    return spectrum.map((value, i) => {
        const distance = Math.sqrt((i - size / 2) ** 2);
        const filter = 1 / (1 + (distance / sigma) ** 2);
        return value * filter;
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

    const spectrum = synthesize2DSpectrum(transformedProjections, numProjections, angularStep);
    visualizeSpectrum(spectrum);


    // Преобразование спектра в двумерные массивы для отправки
    const N = Math.sqrt(spectrum.length);
    const realPart = Array.from({ length: N }, (_, i) => spectrum.slice(i * N, (i + 1) * N).map(point => point.re));
    const imaginaryPart = Array.from({ length: N }, (_, i) => spectrum.slice(i * N, (i + 1) * N).map(point => point.im));


    try {
        // Отправка данных спектра на сервер для восстановления сигнала
        console.log(realPart);
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

    const response = await fetch('http://194.87.244.74:3003/idfft2d4', {
        method: 'POST',
        body: formData
    });
    return response.json();
}

function roundToEven(value) {
    const floored = Math.floor(value);
    const fraction = value - floored;
    if (fraction > 0.5 || (fraction === 0.5 && (floored % 2 !== 0))) {
        return floored + 1;
    } else {
        return floored;
    }
}

function synthesize2DSpectrum(transformedProjections, numProjections, angularStep) {
    const N = transformedProjections[0].realPart.length;
    const M = numProjections;
    const dQ = angularStep;
    const N_half = Math.floor(N / 2);
    const synthesized2DSpectrum = Array.from({ length: N * N }, () => ({ re: 0, im: 0 }));

    let Q = 0;
    for (let k = 0; k < M; k++) {
        const angleRad = degToRad(Q);
        const sinTom = Math.sin(angleRad);
        const cosTom = Math.cos(angleRad);
        const realPart = transformedProjections[k].realPart;
        const imaginaryPart = transformedProjections[k].imaginaryPart;

        for (let s = 0; s < N; s++) {
            const t = s - N_half;
            const wx = t * cosTom;
            const wy = t * sinTom;
            // const i = Math.round(wx + N_half);
            // const j = Math.round(wy + N_half);
            const i = roundToEven(wx + N_half);
            const j = roundToEven(wy + N_half);

            if (i >= 0 && i < N && j >= 0 && j < N) {
                const index = i * N + j;
                synthesized2DSpectrum[index].re += realPart[s];
                synthesized2DSpectrum[index].im += imaginaryPart[s];
            }
        }

        Q += dQ;
    }

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

    // Преобразование спектра в логарифмическую шкалу
    const logScale = spectrum.map(point => Math.log(1 + Math.sqrt(point.re ** 2 + point.im ** 2)));
    let maxLogScale = -Infinity;
    let minLogScale = Infinity;

    // Нахождение минимальных и максимальных значений
    for (let i = 0; i < logScale.length; i++) {
        if (logScale[i] > maxLogScale) {
            maxLogScale = logScale[i];
        }
        if (logScale[i] < minLogScale) {
            minLogScale = logScale[i];
        }
    }

    // Создание данных изображения
    const imageData = ctx.createImageData(N, N);
    const data = imageData.data;

    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            const index = i * N + j;
            const value = logScale[index];

            // Нормализация значения в диапазон [0, 255]
            const normalizedValue = 255 * (value - minLogScale) / (maxLogScale - minLogScale);

            const pixelIndex = (i * N + j) * 4;
            data[pixelIndex] = normalizedValue;     // Red
            data[pixelIndex + 1] = 0;               // Green
            data[pixelIndex + 2] = 0;               // Blue
            data[pixelIndex + 3] = 255;             // Alpha
        }
    }

    // Отрисовка изображения на канвасе
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imageData, 0, 0);
}


function displayRestoredImage(realPart, imaginaryPart, canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const N = realPart.length;

    // Находим максимальное значение амплитуды
    let maxAmplitude = -Infinity;
    for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
            const value = Math.sqrt(realPart[x][y] ** 2 + imaginaryPart[x][y] ** 2);
            maxAmplitude = Math.max(maxAmplitude, value);
        }
    }

    const imageData = ctx.createImageData(N, N);
    const data = imageData.data;

    for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
            const value = Math.sqrt(realPart[x][y] ** 2 + imaginaryPart[x][y] ** 2);

            // Нормализуем значение в диапазоне от 0 до 255
            const normalizedValue = Math.min(255, Math.max(0, value * 255 / maxAmplitude));

            // Устанавливаем пиксельное значение (оттенок серого)
            const index = (y * N + x) * 4; // Индексация по строкам
            data[index] = normalizedValue;     // Красный канал
            data[index + 1] = 125; // Зеленый канал
            data[index + 2] = 125; // Синий канал
            data[index + 3] = 255;             // Альфа канал (непрозрачный)
        }
    }

    ctx.putImageData(imageData, 0, 0);
}


// Создание пустых графиков при загрузке страницы
window.onload = function() {
    updateChart('projectionCanvas', 'Projection', Array(200).fill(0), 200);
    updateChart('spectrumProjectionCanvas', 'Projection Spectrum', Array(200).fill(0), 200);
    updateChart('shiftedProjectionCanvas', 'Shifted Projection', Array(800).fill(0), 800);
    updateChart('shiftedSpectrumProjectionCanvas', 'Shifted Spectrum Projection', Array(800).fill(0), 800);
}



const button = document.getElementById('test');
let isAltered = false;

// Function to manipulate the image data
function manipulateImage() {
    const canvas = document.getElementById('restoredSectionCanvas');
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        if (!isAltered) {
            // Set green and blue channels to 0
            data[i + 1] = 0; // Green
            data[i + 2] = 0; // Blue
        } else {
            // Set green and blue channels to 125
            data[i + 1] = 125; // Green
            data[i + 2] = 125; // Blue
        }
    }

    context.putImageData(imageData, 0, 0);
    isAltered = !isAltered;
}

// Add event listener to the button
button.addEventListener('click', manipulateImage);


function drawSinogram(projections) {
    const canvas = document.getElementById('sinogramCanvas');
    const context = canvas.getContext('2d');

    const M = projections.length; // Number of projections
    const N = projections[0].length; // Length of each projection

    const width = 200;
    const height = 200;

    const imageData = context.createImageData(width, height);

    // Calculate vertical offset for centering the sinogram
    const verticalOffset = Math.floor((height - M) / 2);

    // Find min and max values in the projections
    let minValue = Infinity;
    let maxValue = -Infinity;
    for (const projection of projections) {
        for (const value of projection) {
            if (value < minValue) minValue = value;
            if (value > maxValue) maxValue = value;
        }
    }

    // Normalize the projections and draw the sinogram, filling empty spaces with 0
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let value = 0; // Default value for empty spaces
            if (i >= verticalOffset && i < verticalOffset + M && j < N) {
                value = projections[i - verticalOffset][j];
            }
            const scaleValue = Math.round((value - minValue) / (maxValue - minValue) * 255);
            const pixelIndex = (i * width + j) * 4;
            imageData.data[pixelIndex] = scaleValue; // Red
            imageData.data[pixelIndex + 1] = scaleValue; // Green
            imageData.data[pixelIndex + 2] = scaleValue; // Blue
            imageData.data[pixelIndex + 3] = 255; // Alpha
        }
    }

    context.putImageData(imageData, 0, 0);
}
