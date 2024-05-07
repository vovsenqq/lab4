var globalImage;

document.getElementById('image-upload').addEventListener('change', function(e) {
    var reader = new FileReader();
    reader.onload = function(event) {
        var img = new Image();
        img.onload = function() {
            globalImage = img;
            imageToChannels(img); // вызываем функцию обработки изображения

            // Устанавливаем источник изображения равным данным изображения
            document.getElementById('original-image').src = img.src;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});


// Функция для сброса изображения
function resetImage() {
    // Создаем новый элемент canvas
    var canvas = document.createElement('canvas');
    // Устанавливаем ширину и высоту canvas равными ширине и высоте изображения
    canvas.width = globalImage.width;
    canvas.height = globalImage.height;

    // Получаем контекст 2D для рисования на canvas
    var ctx = canvas.getContext('2d');
    // Рисуем изображение на canvas
    ctx.drawImage(globalImage, 0, 0, globalImage.width, globalImage.height);

    // Обновляем источник изображения для 'original-image'
    document.getElementById('original-image').src = canvas.toDataURL();
}


// Обработчик событий для кнопки сброса
document.getElementById('reset-button').addEventListener('click', function() {
    resetImage();
    imageToChannels(globalImage); // обновляем изображения, разбитые по каналам
});

// Функция для создания функции добавления шума с состоянием
function createNoiseFunction() {
    var callCount = 0;

    return function addUnipolarNoise(imageData, noisePercent) {
        var data = imageData.data;
        var noisePixels = Math.floor((data.length / 4) * (noisePercent / 100));
        var noiseValue = callCount % 2 === 0 ? 255 : 0; // чередуем белый и черный шум

        for (var i = 0; i < noisePixels; i++) {
            var randIndex = Math.floor(Math.random() * (data.length / 4)) * 4;
            data[randIndex] = data[randIndex + 1] = data[randIndex + 2] = noiseValue;
            data[randIndex + 3] = 255;
        }

        callCount++;
        return imageData;
    };
}

// Создаем функцию добавления шума с состоянием
var addUnipolarNoise = createNoiseFunction();


// Обработчик событий для кнопки добавления шума
document.getElementById('add-unipolar').addEventListener('click', function() {
    var canvas = document.createElement('canvas');
    var imageCopy = globalImage.cloneNode(true);
    imageCopy.onload = function() {
        canvas.width = imageCopy.width;
        canvas.height = imageCopy.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(imageCopy, 0, 0, imageCopy.width, imageCopy.height);
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        var noisePercent = document.getElementById('myRange').value;
        var noisyImageData = addUnipolarNoise(imageData, noisePercent);

        ctx.putImageData(noisyImageData, 0, 0);
        document.getElementById('original-image').src = canvas.toDataURL();

        var noisyImage = new Image();
        noisyImage.onload = function() {
            imageToChannels(noisyImage); // обновляем изображения, разбитые по каналам
        };
        noisyImage.src = canvas.toDataURL();
    }
});


// Функция для добавления биполярного шума
function addBipolarNoise(imageData, noisePercent) {
    var data = imageData.data;
    var noisePixels = Math.floor((data.length / 4) * (noisePercent / 100));
    for (var i = 0; i < noisePixels; i++) {
        var randIndex = Math.floor(Math.random() * (data.length / 4)) * 4;
        var noiseValue = Math.random() < 0.5 ? 0 : 255; // случайно выбираем белый или черный шум
        data[randIndex] = data[randIndex + 1] = data[randIndex + 2] = noiseValue;
        data[randIndex + 3] = 255;
    }
    return imageData;
}

// Обработчик событий для кнопки добавления биполярного шума
document.getElementById('add-bipolar').addEventListener('click', function() {
    var canvas = document.createElement('canvas');
    var imageCopy = globalImage.cloneNode(true);
    imageCopy.onload = function() {
        canvas.width = imageCopy.width;
        canvas.height = imageCopy.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(imageCopy, 0, 0, imageCopy.width, imageCopy.height);
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        var noisePercent = document.getElementById('myRange').value;
        var noisyImageData = addBipolarNoise(imageData, noisePercent);

        ctx.putImageData(noisyImageData, 0, 0);
        document.getElementById('original-image').src = canvas.toDataURL();

        var noisyImage = new Image();
        noisyImage.onload = function() {
            imageToChannels(noisyImage); // обновляем изображения, разбитые по каналам
        };
        noisyImage.src = canvas.toDataURL();
    }
});



function convertToBlob(imageBlob) {
    return new Promise((resolve, reject) => {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            canvas.width = this.width;
            canvas.height = this.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(this, 0, 0);
            canvas.toBlob(resolve, 'image/png');
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(imageBlob);
    });
}

document.getElementById('send-arithmetic-mean').addEventListener('click', function() {
    var img = document.getElementById('original-image');
    var formData = new FormData();
    fetch(img.src)
        .then(response => response.blob())
        .then(image => {
            return convertToBlob(image);  // Преобразуем изображение в PNG
        })
        .then(pngImage => {
            formData.append('image', pngImage);
            formData.append('kernel_size', slider2.value);
            formData.append('filter_type', "arithmetic");

            fetch('http://localhost:3000/filter_arithmetic_mean', {
                method: 'POST',
                body: formData
            })
            .then(response => response.blob())
            .then(image => {
                var urlCreator = window.URL || window.webkitURL;
                var imageUrl = urlCreator.createObjectURL(image);
                var processedImage = new Image();
                processedImage.onload = function() {
                    document.getElementById('second-image').src = imageUrl;
                    imageToChannels(processedImage, 2); // обновляем изображения, разбитые по каналам
                };
                processedImage.src = imageUrl;
            })
            .catch(error => console.error('Error:', error));
        });
});


document.getElementById('send-contrharmonic-mean').addEventListener('click', function() {
    var img = document.getElementById('original-image');
    var formData = new FormData();
    fetch(img.src)
        .then(response => response.blob())
        .then(image => {
            return convertToBlob(image);  // Преобразуем изображение в PNG
        })
        .then(pngImage => {
            formData.append('image', pngImage);
            formData.append('kernel_size', slider2.value);
            formData.append('noise_type', document.getElementById('noise-type').value);

            fetch('http://localhost:3000/filter_contr_harmonic_mean', {
                method: 'POST',
                body: formData
            })
            .then(response => response.blob())
            .then(image => {
                var urlCreator = window.URL || window.webkitURL;
                var imageUrl = urlCreator.createObjectURL(image);
                var processedImage = new Image();
                processedImage.onload = function() {
                    document.getElementById('second-image').src = imageUrl;
                    imageToChannels(processedImage, 2); // обновляем изображения, разбитые по каналам
                };
                processedImage.src = imageUrl;
            })
            .catch(error => console.error('Error:', error));
        });
});

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


// Добавление шума в изображение

var slider = document.getElementById("myRange");
var output = document.getElementById("demo");
output.innerHTML = slider.value;
slider.oninput = function() {
    output.innerHTML = this.value;  
};



// Отрисовка маски в зависимости от параметра слайдера

const slider2 = document.getElementById('slider_mask');
const grid = document.getElementById('grid');

function createGrid(size) {
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.innerHTML = '';
    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        grid.appendChild(cell);
    }
}

slider2.addEventListener('input', function() {
    createGrid(this.value);
});

createGrid(slider2.value);