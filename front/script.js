document.getElementById('image-upload').addEventListener('change', function(e) {
    var reader = new FileReader();
    reader.onload = function(event) {
        var img = new Image();
        img.onload = function() {
            document.getElementById('original-image').src = event.target.result;

            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, img.width, img.height);
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imageData.data;

            var container = document.getElementById('image-container');
            container.innerHTML = '';

            ['red', 'green', 'blue'].forEach(function(color, index) {
                var colorData = new Uint8ClampedArray(data);
                for (var i = 0; i < colorData.length; i += 4) {
                    if (color === 'red') {
                        colorData[i + 1] = 0;
                        colorData[i + 2] = 0;
                    } else if (color === 'green') {
                        colorData[i] = 0;
                        colorData[i + 2] = 0;
                    } else if (color === 'blue') {
                        colorData[i] = 0;
                        colorData[i + 1] = 0;
                    }
                }

                var colorImageData = new ImageData(colorData, canvas.width, canvas.height);
                var colorCanvas = document.createElement('canvas');
                colorCanvas.width = canvas.width;
                colorCanvas.height = canvas.height;
                var colorCtx = colorCanvas.getContext('2d');
                colorCtx.putImageData(colorImageData, 0, 0);

                var imageElement = document.createElement('img');
                imageElement.src = colorCanvas.toDataURL();
                container.appendChild(imageElement);
            });
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

document.getElementById('send-request').addEventListener('click', function() {
    var img = document.getElementById('original-image');
    var formData = new FormData();
    formData.append('image', img.src);
    formData.append('param1', 'bipolar');
    formData.append('param2', 'unipolar');
    formData.append('number1', 1);
    formData.append('number2', 2);

    fetch('http://localhost:3000/someroute', {
        method: 'POST',
        body: formData
    })
    .then(response => response.blob())
    .then(image => {
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL(image);
        document.getElementById('second-image').src = imageUrl;
        // Здесь вы можете добавить код для обработки каналов изображения
    })
    .catch(error => console.error('Error:', error));
});