package handlers

import (
	"app/services"
	"bytes"
	"encoding/json"
	"image"
	"io"
	"net/http"
)

// DFTHandler обрабатывает HTTP-запросы для применения Фурье-преобразования к изображению
func DFTHandler(w http.ResponseWriter, r *http.Request) {
	// Разбор многокомпонентной формы
	err := r.ParseMultipartForm(30 << 20)
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

	// Применение Фурье-преобразования
	// redRe, redIm, greenRe, greenIm, blueRe, blueIm, redImage, greenImage, blueImage := services.ApplyDFT(img)
	redRe, redIm, greenRe, greenIm, blueRe, blueIm := services.ApplyDFT(img)

	response := map[string]interface{}{
		"redRe":   redRe,
		"redIm":   redIm,
		"greenRe": greenRe,
		"greenIm": greenIm,
		"blueRe":  blueRe,
		"blueIm":  blueIm,
		// "redImage":   bufRed.Bytes(),
		// "greenImage": bufGreen.Bytes(),
		// "blueImage":  bufBlue.Bytes(),
	}

	// Установка заголовков и отправка ответа
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
