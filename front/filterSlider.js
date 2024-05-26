// Устанавливает текущий тип фильтра и обновляет визуализации фильтров
function setFilterType(filterType) {
    currentFilter = filterType;  // Присваивает выбранный тип фильтра глобальной переменной
    updateFilterVisualizations(); // Обновляет визуализацию фильтров на основании текущего типа
}

// Создает ядро Гауссового фильтра заданной ширины, высоты и сигмы
function createGaussianKernel(width, height, sigma) {
    const kernel = []; // Массив для хранения значений ядра
    const centerX = Math.floor(width / 2);  // Центр по оси X
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

    return kernel; // Возвращает заполненное ядро
}

// Создает ядро фильтра Баттерворта заданной ширины, высоты, частоты d0 и порядка n
function createButterworthKernel(width, height, d0, n) {
    const kernel = []; // Массив для хранения значений ядра
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

    return kernel; // Возвращает заполненное ядро
}

// Рисует заданное ядро на указанном canvas элементе с заданным цветом
function drawKernel(canvas, kernel, color) {
    const ctx = canvas.getContext('2d'); // Контекст рисования 2D
    const imageData = ctx.createImageData(canvas.width, canvas.height); // Создание пустого изображения

    // Заполнение данных изображения значениями из ядра
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4; // Индекс пикселя в массиве данных изображения
            const value = kernel[y][x] * 255; // Нормализация значения ядра для цветовой шкалы
            if (color === 'red') {
                imageData.data[index] = value; // Установка красного канала
            } else if (color === 'green') {
                imageData.data[index + 1] = value; // Установка зеленого канала
            } else if (color === 'blue') {
                imageData.data[index + 2] = value; // Установка синего канала
            }
            imageData.data[index + 3] = 255; // Установка альфа-канала (полная непрозрачность)
        }
    }

    ctx.putImageData(imageData, 0, 0); // Вывод изображения на canvas
}

// Обновляет визуализацию фильтров в зависимости от текущего типа фильтра и значения сигмы
function updateFilterVisualizations() {
    const sigma = sliderRadius.value; // Получение текущего значения сигмы из ползунка
    let redKernel, greenKernel, blueKernel;

    if (currentFilter === 1) {
        // Если выбран Гауссов фильтр
        redKernel = createGaussianKernel(redCanvas.width, redCanvas.height, sigma);
        greenKernel = createGaussianKernel(greenCanvas.width, greenCanvas.height, sigma);
        blueKernel = createGaussianKernel(blueCanvas.width, blueCanvas.height, sigma);
    } else {
        // Если выбран фильтр Баттерворта
        const d0 = sigma; // Используем сигму как частоту среза d0
        const n = 3; // Фиксированный порядок фильтра n
        redKernel = createButterworthKernel(redCanvas.width, redCanvas.height, d0, n);
        greenKernel = createButterworthKernel(greenCanvas.width, greenCanvas.height, d0, n);
        blueKernel = createButterworthKernel(blueCanvas.width, blueCanvas.height, d0, n);
    }

    // Рисуем ядра фильтров на соответствующих canvas элементах
    drawKernel(redCanvas, redKernel, 'red');
    drawKernel(greenCanvas, greenKernel, 'green');
    drawKernel(blueCanvas, blueKernel, 'blue');
}

// Инициализация ползунка для выбора значения радиуса фильтра
var sliderRadius = document.getElementById("Radius");
var output = document.getElementById("demo");
output.innerHTML = sliderRadius.value; // Отображение начального значения ползунка

// Обработчик события для обновления значения ползунка и перерисовки фильтров
sliderRadius.oninput = function() {
    output.innerHTML = this.value; // Обновление отображаемого значения
    updateFilterVisualizations(); // Обновление визуализаций фильтров
};

// Инициализация canvas элементов для каждого цветового канала
const redCanvas = document.getElementById('redCanvas');
const greenCanvas = document.getElementById('greenCanvas');
const blueCanvas = document.getElementById('blueCanvas');

// Первоначальная визуализация фильтров
updateFilterVisualizations();
