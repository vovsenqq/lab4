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

// // Обработчик событий для кнопки добавления шума
// document.getElementById('add-unipolar').addEventListener('click', function() {
//     var canvas = document.createElement('canvas');
//     var imageCopy = globalImage.cloneNode(true);
//     imageCopy.onload = function() {
//         canvas.width = imageCopy.width;
//         canvas.height = imageCopy.height;
//         var ctx = canvas.getContext('2d');
//         ctx.drawImage(imageCopy, 0, 0, imageCopy.width, imageCopy.height);
//         var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

//         var noisePercent = document.getElementById('myRange').value;
//         var noisyImageData = addUnipolarNoise(imageData, noisePercent);

//         ctx.putImageData(noisyImageData, 0, 0);
//         document.getElementById('original-image').src = canvas.toDataURL();

//         var noisyImage = new Image();
//         noisyImage.onload = function() {
//             imageToChannels(noisyImage); // обновляем изображения, разбитые по каналам
//         };
//         noisyImage.src = canvas.toDataURL();
//     }
// });


// // Обработчик событий для кнопки добавления биполярного шума
// document.getElementById('add-bipolar').addEventListener('click', function() {
//     var canvas = document.createElement('canvas');
//     var imageCopy = globalImage.cloneNode(true);
//     imageCopy.onload = function() {
//         canvas.width = imageCopy.width;
//         canvas.height = imageCopy.height;
//         var ctx = canvas.getContext('2d');
//         ctx.drawImage(imageCopy, 0, 0, imageCopy.width, imageCopy.height);
//         var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

//         var noisePercent = document.getElementById('myRange').value;
//         var noisyImageData = addBipolarNoise(imageData, noisePercent);

//         ctx.putImageData(noisyImageData, 0, 0);
//         document.getElementById('original-image').src = canvas.toDataURL();

//         var noisyImage = new Image();
//         noisyImage.onload = function() {
//             imageToChannels(noisyImage); // обновляем изображения, разбитые по каналам
//         };
//         noisyImage.src = canvas.toDataURL();
//     }
// });