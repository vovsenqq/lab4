package handlers

import (
	"app/services"
	"bytes"
	"fmt"
	"image"
	"image/draw"
	"image/png"
	"io"
	"net/http"
	"strconv"
)

// FilterHandler обрабатывает HTTP-запросы для применения фильтра к изображению
func FilterHandler(w http.ResponseWriter, r *http.Request) {
	// Разбор многокомпонентной формы
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "could not parse multipart form", http.StatusBadRequest)
		return
	}

	// Получение файла изображения из формы
	file, _, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "could not get image file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Чтение данных изображения
	imgData, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "could not read image data", http.StatusBadRequest)
		return
	}

	// Декодирование изображения
	img, _, err := image.Decode(bytes.NewReader(imgData))
	if err != nil {
		http.Error(w, "could not decode image", http.StatusBadRequest)
		return
	}

	// Создание нового изображения с прямоугольниками RGBA
	bmpImg := image.NewRGBA(img.Bounds())
	draw.Draw(bmpImg, bmpImg.Bounds(), img, img.Bounds().Min, draw.Src)

	// Получение размера ядра из формы
	number := r.FormValue("kernel_size")
	fmt.Println("Received number: ", number)

	// Преобразование размера ядра в целое число
	size, err := strconv.Atoi(number)
	if err != nil {
		panic(err)
	}

	// Получение типа шума и типа фильтра из формы
	noiseType := r.FormValue("noise_type")
	filterType := r.FormValue("filter_type")
	var filteredImg image.Image

	// Применение фильтра к изображению
	if filterType == "arithmetic" {
		filteredImg = services.ApplyFilter(bmpImg, "arithmetic", size)
	} else {
		filteredImg = services.ApplyFilter(bmpImg, "contraharmonic_"+noiseType, size)
	}

	// Создание нового изображения PNG
	pngImg := image.NewRGBA(filteredImg.Bounds())
	draw.Draw(pngImg, pngImg.Bounds(), filteredImg, filteredImg.Bounds().Min, draw.Src)

	// Установка заголовка ответа и кодирование изображения в PNG
	w.Header().Set("Content-Type", "image/png")
	err = png.Encode(w, pngImg)
	if err != nil {
		http.Error(w, "could not encode image", http.StatusInternalServerError)
		return
	}
}
