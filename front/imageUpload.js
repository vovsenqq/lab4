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