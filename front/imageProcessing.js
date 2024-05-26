var currentFilter = 1;


// Функция imageToChannels принимает изображение в качестве аргумента
function imageToChannels(img, container) {
    // Создаем новый элемент canvas
    var canvas = document.createElement('canvas');
    // Устанавливаем ширину и высоту canvas равными ширине и высоте изображения
    canvas.width = img.width;
    canvas.height = img.height;

    // Получаем контекст 2D для рисования на canvas
    var ctx = canvas.getContext('2d');
    // Рисуем изображение на canvas
    ctx.drawImage(img, 0, 0, img.width, img.height);

    // Получаем данные изображения с canvas
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Получаем массив данных пикселей изображения
    var data = imageData.data;

    if (container === 2) {
        var container = document.getElementById('second-image-container');
    } else {
        var container = document.getElementById('image-container')
    }
    // Получаем элемент контейнера изображения
    
    // Очищаем контейнер изображения
    container.innerHTML = '';

    // Проходим по каждому цветовому каналу (красный, зеленый, синий)
    ['red', 'green', 'blue'].forEach(function(color, index) {
        // Создаем новый массив данных пикселей
        var colorData = new Uint8ClampedArray(data);

        // Проходим по каждому пикселю изображения
        for (var i = 0; i < colorData.length; i += 4) {
            // Если текущий цветовой канал - красный
            if (color === 'red') {
                // Обнуляем зеленый и синий каналы
                colorData[i + 1] = 0;
                colorData[i + 2] = 0;
            } 
            // Если текущий цветовой канал - зеленый
            else if (color === 'green') {
                // Обнуляем красный и синий каналы
                colorData[i] = 0;
                colorData[i + 2] = 0;
            } 
            // Если текущий цветовой канал - синий
            else if (color === 'blue') {
                // Обнуляем красный и зеленый каналы
                colorData[i] = 0;
                colorData[i + 1] = 0;
            }
        }

        // Создаем новые данные изображения с обновленными данными пикселей
        var colorImageData = new ImageData(colorData, canvas.width, canvas.height);
        // Создаем новый элемент canvas
        var colorCanvas = document.createElement('canvas');
        // Устанавливаем ширину и высоту canvas равными ширине и высоте изображения
        colorCanvas.width = canvas.width;
        colorCanvas.height = canvas.height;
        // Получаем контекст 2D для рисования на canvas
        var colorCtx = colorCanvas.getContext('2d');
        // Рисуем данные изображения на canvas
        colorCtx.putImageData(colorImageData, 0, 0);

        // Создаем новый элемент изображения
        var imageElement = document.createElement('img');
        // Устанавливаем источник изображения равным данным изображения с canvas
        imageElement.src = colorCanvas.toDataURL();
        // Добавляем элемент изображения в контейнер изображения
        container.appendChild(imageElement);
    });
}


// Добавляет обработчик событий на кнопку с id 'gaussian', который будет выполнять фильтрацию Гауссовым фильтром при нажатии
document.getElementById('gaussian').addEventListener('click', function() {
    setFilterType(1); // Устанавливает тип фильтра как Гауссовый (1)

    const sigma = sliderRadius.value; // Получает значение радиуса фильтра из ползунка

    // Применяет Гауссов фильтр к каждому цветовому каналу изображения (реальная и мнимая части)
    const filteredRed = applyGaussianFilter(redRe, redIm, sigma);
    const filteredGreen = applyGaussianFilter(greenRe, greenIm, sigma);
    const filteredBlue = applyGaussianFilter(blueRe, blueIm, sigma);

    // Отображает спектры для каждого цветового канала после фильтрации
    displaySpectrums(
        createSpectrumImage(filteredRed.real, filteredRed.imaginary, 'red'), 
        createSpectrumImage(filteredGreen.real, filteredGreen.imaginary, 'green'), 
        createSpectrumImage(filteredBlue.real, filteredBlue.imaginary, 'blue'), 
        1
    );

    const originalRedEnergy = calculateEnergy(redRe, redIm);
    const filteredRedEnergy = calculateEnergy(filteredRed.real, filteredRed.imaginary);
    const redEnergyPercentage = (filteredRedEnergy / originalRedEnergy) * 100;
    console.log(`Energy percentage for red channel after filtering: ${redEnergyPercentage.toFixed(2)}%`);
    
    const originalGreenEnergy = calculateEnergy(greenRe, greenIm);
    const filteredGreenEnergy = calculateEnergy(filteredGreen.real, filteredGreen.imaginary);
    const greenEnergyPercentage = (filteredGreenEnergy / originalGreenEnergy) * 100;
    console.log(`Energy percentage for green channel after filtering: ${greenEnergyPercentage.toFixed(2)}%`);
    
    const originalBlueEnergy = calculateEnergy(blueRe, blueIm);
    const filteredBlueEnergy = calculateEnergy(filteredBlue.real, filteredBlue.imaginary);
    const blueEnergyPercentage = (filteredBlueEnergy / originalBlueEnergy) * 100;
    console.log(`Energy percentage for blue channel after filtering: ${blueEnergyPercentage.toFixed(2)}%`);

    // Вставляем проценты энергии в HTML элементы
    document.getElementById('red-energy').textContent = `Red Channel Energy: ${redEnergyPercentage.toFixed(2)}%`;
    document.getElementById('green-energy').textContent = `Green Channel Energy: ${greenEnergyPercentage.toFixed(2)}%`;
    document.getElementById('blue-energy').textContent = `Blue Channel Energy: ${blueEnergyPercentage.toFixed(2)}%`;

    // Создает объект FormData для отправки отфильтрованных данных на сервер
    const formData = new FormData();
    formData.append('redRe', JSON.stringify(filteredRed.real));
    formData.append('redIm', JSON.stringify(filteredRed.imaginary));
    formData.append('greenRe', JSON.stringify(filteredGreen.real));
    formData.append('greenIm', JSON.stringify(filteredGreen.imaginary));
    formData.append('blueRe', JSON.stringify(filteredBlue.real));
    formData.append('blueIm', JSON.stringify(filteredBlue.imaginary));

    // Выполняет запрос на сервер для обратного преобразования Фурье (IDFT)
    fetch('http://localhost:3001/idft', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.blob(); // Преобразует ответ в Blob объект
    })
    .then(blob => {
        var img = new Image(); // Создает новый элемент Image
        img.onload = () => {
            var canvas = document.createElement('canvas'); // Создает элемент canvas
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0); // Рисует изображение на canvas
            imageToChannels(img, 2); // Разделяет изображение на каналы
            document.getElementById('second-image').src = URL.createObjectURL(blob); // Устанавливает источник для отображения изображения
        };
        img.src = URL.createObjectURL(blob); // Устанавливает источник для изображения
    })
    .catch(error => console.error('Error:', error)); // Логирует ошибку в случае возникновения
});

// Функция для применения Гауссового фильтра к данным изображения (реальная и мнимая части)
function applyGaussianFilter(real, imaginary, sigma) {
    const height = real.length; // Высота изображения
    const width = real[0].length; // Ширина изображения
    
    // Создаем ядро Гауссовского фильтра
    const kernel = [];
    const centerX = Math.floor(width / 2); // Центр по оси X
    const centerY = Math.floor(height / 2); // Центр по оси Y
    const sigmaSquared = sigma * sigma; // Квадрат сигмы для вычислений

    // Заполнение ядра значениями по Гауссовой функции
    for (let y = 0; y < height; y++) {
        kernel[y] = [];
        for (let x = 0; x < width; x++) {
            const offsetX = x - centerX; // Смещение по X относительно центра
            const offsetY = y - centerY; // Смещение по Y относительно центра
            // Вычисление значения Гауссовой функции для данной точки
            kernel[y][x] = Math.exp(-(offsetX * offsetX + offsetY * offsetY) / (2 * sigmaSquared));
        }
    }

    // Применение фильтра к реальной и мнимой частям изображения
    const newReal = Array.from(Array(height), () => new Array(width).fill(0)); // Новая матрица для реальной части
    const newImaginary = Array.from(Array(height), () => new Array(width).fill(0)); // Новая матрица для мнимой части
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            newReal[y][x] = real[y][x] * kernel[y][x]; // Фильтрация реальной части
            newImaginary[y][x] = imaginary[y][x] * kernel[y][x]; // Фильтрация мнимой части
        }
    }

    return { real: newReal, imaginary: newImaginary }; // Возвращает отфильтрованные данные
}


// Функция для применения фильтра Баттерворта к данным изображения (реальная и мнимая части)
function applyButterworthFilter(real, imaginary, d0, n) {
    const height = real.length; // Высота изображения
    const width = real[0].length; // Ширина изображения
    
    // Создаем ядро фильтра Баттерворта
    const kernel = [];
    const centerX = Math.floor(width / 2); // Центр по оси X
    const centerY = Math.floor(height / 2); // Центр по оси Y

    // Заполнение ядра значениями по функции Баттерворта
    for (let y = 0; y < height; y++) {
        kernel[y] = [];
        for (let x = 0; x < width; x++) {
            const offsetX = x - centerX; // Смещение по X относительно центра
            const offsetY = y - centerY; // Смещение по Y относительно центра
            const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY); // Расстояние до центра
            // Вычисление значения функции Баттерворта для данной точки
            kernel[y][x] = 1 / (1 + Math.pow(distance / d0, 2 * n));
        }
    }

    // Применение фильтра к реальной и мнимой частям изображения
    const newReal = Array.from(Array(height), () => new Array(width).fill(0)); // Новая матрица для реальной части
    const newImaginary = Array.from(Array(height), () => new Array(width).fill(0)); // Новая матрица для мнимой части
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            newReal[y][x] = real[y][x] * kernel[y][x]; // Фильтрация реальной части
            newImaginary[y][x] = imaginary[y][x] * kernel[y][x]; // Фильтрация мнимой части
        }
    }

    return { real: newReal, imaginary: newImaginary }; // Возвращает отфильтрованные данные
}

// Пример использования функции фильтра Баттерворта
document.getElementById('butterworth').addEventListener('click', function() {
    setFilterType(2); // Устанавливает тип фильтра как Баттерворт (2)
    
    const d0 = sliderRadius.value; // Получает значение радиуса фильтра из ползунка
    const n = 3; // Порядок фильтра (фиксированное значение)

    // Применяет фильтр Баттерворта к каждому цветовому каналу изображения (реальная и мнимая части)
    const filteredRed = applyButterworthFilter(redRe, redIm, d0, n);
    const filteredGreen = applyButterworthFilter(greenRe, greenIm, d0, n);
    const filteredBlue = applyButterworthFilter(blueRe, blueIm, d0, n);

    // Отображает спектры для каждого цветового канала после фильтрации
    displaySpectrums(
        createSpectrumImage(filteredRed.real, filteredRed.imaginary, 'red'), 
        createSpectrumImage(filteredGreen.real, filteredGreen.imaginary, 'green'), 
        createSpectrumImage(filteredBlue.real, filteredBlue.imaginary, 'blue'), 
        1
    );

    const originalRedEnergy = calculateEnergy(redRe, redIm);
    const filteredRedEnergy = calculateEnergy(filteredRed.real, filteredRed.imaginary);
    const redEnergyPercentage = (filteredRedEnergy / originalRedEnergy) * 100;
    
    const originalGreenEnergy = calculateEnergy(greenRe, greenIm);
    const filteredGreenEnergy = calculateEnergy(filteredGreen.real, filteredGreen.imaginary);
    const greenEnergyPercentage = (filteredGreenEnergy / originalGreenEnergy) * 100;
    
    const originalBlueEnergy = calculateEnergy(blueRe, blueIm);
    const filteredBlueEnergy = calculateEnergy(filteredBlue.real, filteredBlue.imaginary);
    const blueEnergyPercentage = (filteredBlueEnergy / originalBlueEnergy) * 100;

    // Вставляем проценты энергии в HTML элементы
    document.getElementById('red-energy').textContent = `Red Channel Energy: ${redEnergyPercentage.toFixed(2)}%`;
    document.getElementById('green-energy').textContent = `Green Channel Energy: ${greenEnergyPercentage.toFixed(2)}%`;
    document.getElementById('blue-energy').textContent = `Blue Channel Energy: ${blueEnergyPercentage.toFixed(2)}%`;

    // Создает объект FormData для отправки отфильтрованных данных на сервер
    const formData = new FormData();
    formData.append('redRe', JSON.stringify(filteredRed.real));
    formData.append('redIm', JSON.stringify(filteredRed.imaginary));
    formData.append('greenRe', JSON.stringify(filteredGreen.real));
    formData.append('greenIm', JSON.stringify(filteredGreen.imaginary));
    formData.append('blueRe', JSON.stringify(filteredBlue.real));
    formData.append('blueIm', JSON.stringify(filteredBlue.imaginary));

    // Выполняет запрос на сервер для обратного преобразования Фурье (IDFT)
    fetch('http://localhost:3001/idft', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.blob(); // Преобразует ответ в Blob объект
    })
    .then(blob => {
        var img = new Image(); // Создает новый элемент Image
        img.onload = () => {
            var canvas = document.createElement('canvas'); // Создает элемент canvas
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0); // Рисует изображение на canvas
            imageToChannels(img, 2); // Разделяет изображение на каналы
            document.getElementById('second-image').src = URL.createObjectURL(blob); // Устанавливает источник для отображения изображения
        };
        img.src = URL.createObjectURL(blob); // Устанавливает источник для изображения
    })
    .catch(error => console.error('Error:', error)); // Логирует ошибку в случае возникновения
});


// Функция для отображения спектров изображений
function displaySpectrums(redImage, greenImage, blueImage, container) {
    // Определяем, какой контейнер использовать для отображения
    if (container === 1) {
        var imageContainer = document.getElementById('second-image-container-spec');
    } else { 
        var imageContainer = document.getElementById('image-container-spec');
    }

    imageContainer.innerHTML = ''; // Очищаем контейнер

    // Создаем и добавляем изображение для красного канала
    var redImg = new Image();
    redImg.src = redImage.toDataURL();
    imageContainer.appendChild(redImg);

    // Создаем и добавляем изображение для зеленого канала
    var greenImg = new Image();
    greenImg.src = greenImage.toDataURL();
    imageContainer.appendChild(greenImg);

    // Создаем и добавляем изображение для синего канала
    var blueImg = new Image();
    blueImg.src = blueImage.toDataURL();
    imageContainer.appendChild(blueImg);
}


// Функция для создания изображения спектра на основе реальной и мнимой частей
function createSpectrumImage(real, imaginary, color) {
    const width = real[0].length; // Ширина изображения
    const height = real.length; // Высота изображения
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Находим максимальную амплитуду для нормализации
    let maxMagnitude = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const magnitude = Math.sqrt(real[y][x] * real[y][x] + imaginary[y][x] * imaginary[y][x]);
            if (magnitude > maxMagnitude) {
                maxMagnitude = magnitude;
            }
        }
    }

    // Создаем изображение спектра
    const imageData = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const magnitude = Math.sqrt(real[y][x] * real[y][x] + imaginary[y][x] * imaginary[y][x]);
            // Нормализуем значение амплитуды и применяем логарифмическую шкалу
            const normalized = Math.log(1 + magnitude) * 255 / Math.log(1 + maxMagnitude);
            const index = (y * width + x) * 4;

            // Устанавливаем цвет в зависимости от заданного канала
            imageData.data[index] = (color === 'red') ? normalized : 0; // Красный канал
            imageData.data[index + 1] = (color === 'green') ? normalized : 0; // Зеленый канал
            imageData.data[index + 2] = (color === 'blue') ? normalized : 0; // Синий канал
            imageData.data[index + 3] = 255; // Прозрачность (Alpha)
        }
    }
    ctx.putImageData(imageData, 0, 0); // Помещаем изображение на канвас

    return canvas; // Возвращаем канвас
}

// Функция для вычисления энергии изображения по каналу
function calculateEnergy(real, imaginary) {
    let energy = 0;
    const height = real.length;
    const width = real[0].length;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            energy += real[y][x] * real[y][x] + imaginary[y][x] * imaginary[y][x];
        }
    }

    return energy;
}

// Функция для вычисления энергии в процентах после фильтрации
function calculateEnergyPercentage(originalReal, originalImaginary, filteredReal, filteredImaginary) {
    const originalEnergy = calculateEnergy(originalReal, originalImaginary);
    const filteredEnergy = calculateEnergy(filteredReal, filteredImaginary);

    const energyPercentage = (filteredEnergy / originalEnergy) * 100;

    return energyPercentage;
}


