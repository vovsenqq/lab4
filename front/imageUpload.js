var globalImage;
var redRe, redIm, greenRe, greenIm, blueRe, blueIm;

document.getElementById('image-upload').addEventListener('change', function(e) {
    var reader = new FileReader();
    reader.onload = function(event) {
        var img = new Image();
        img.onload = function() {
            globalImage = img;
            imageToChannels(img); // вызываем функцию обработки изображения
            // Устанавливаем источник изображения равным данным изображения
            document.getElementById('original-image').src = img.src;
            uploadImage(event.target.result);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});


function uploadImage(imageData) {
    var img = new Image();
    img.onload = function() {
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Преобразование изображения в blob перед отправкой
        canvas.toBlob(function(blob) {
            var formData = new FormData();
            formData.append('image', blob);

            fetch('http://localhost:3001/dft', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                redRe = data.redRe;
                redIm = data.redIm;
                greenRe = data.greenRe;
                greenIm = data.greenIm;
                blueRe = data.blueRe;
                blueIm = data.blueIm;

                displaySpectrums(createSpectrumImage(redRe, redIm, 'red'), 
                                 createSpectrumImage(greenRe, greenIm, 'green'), 
                                 createSpectrumImage(blueRe, blueIm, 'blue'));
            })
            .catch(error => console.error('Error:', error));
        }, 'image/png');
    };
    img.src = imageData;
}