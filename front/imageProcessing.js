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



document.getElementById('send-gaussian').addEventListener('click', function() {
    // var img = document.getElementById('original-image');
    // var formData = new FormData();
    // fetch(img.src)
    //     .then(response => response.blob())
    //     .then(image => {
    //         return convertToBlob(image);  // Преобразуем изображение в PNG
    //     })
    //     .then(pngImage => {
    //         formData.append('image', pngImage);
    //         formData.append('kernel_size', slider2.value);
    //         formData.append('filter_type', "arithmetic");

    //         fetch('http://localhost:3000/filter_arithmetic_mean', {
    //             method: 'POST',
    //             body: formData
    //         })
    //         .then(response => response.blob())
    //         .then(image => {
    //             var urlCreator = window.URL || window.webkitURL;
    //             var imageUrl = urlCreator.createObjectURL(image);
    //             var processedImage = new Image();
    //             processedImage.onload = function() {
    //                 document.getElementById('second-image').src = imageUrl;
    //                 imageToChannels(processedImage, 2); // обновляем изображения, разбитые по каналам
    //             };
    //             processedImage.src = imageUrl;
    //         })
    //         .catch(error => console.error('Error:', error));
    //     });
});


document.getElementById('send-butterworth').addEventListener('click', function() {
    // var img = document.getElementById('original-image');
    // var formData = new FormData();
    // fetch(img.src)
    //     .then(response => response.blob())
    //     .then(image => {
    //         return convertToBlob(image);  // Преобразуем изображение в PNG
    //     })
    //     .then(pngImage => {
    //         formData.append('image', pngImage);
    //         formData.append('kernel_size', slider2.value);
    //         formData.append('noise_type', document.getElementById('noise-type').value);

    //         fetch('http://localhost:3000/filter_contr_harmonic_mean', {
    //             method: 'POST',
    //             body: formData
    //         })
    //         .then(response => response.blob())
    //         .then(image => {
    //             var urlCreator = window.URL || window.webkitURL;
    //             var imageUrl = urlCreator.createObjectURL(image);
    //             var processedImage = new Image();
    //             processedImage.onload = function() {
    //                 document.getElementById('second-image').src = imageUrl;
    //                 imageToChannels(processedImage, 2); // обновляем изображения, разбитые по каналам
    //             };
    //             processedImage.src = imageUrl;
    //         })
    //         .catch(error => console.error('Error:', error));
    //     });
});