package handlers

import (
	"app/services"
	"encoding/json"
	"fmt"
	"net/http"
)

// Функция для парсинга JSON строки в двумерный массив float64
func parse2DFloat64Array(jsonStr string) ([][]float64, error) {
	var array [][]float64
	if err := json.Unmarshal([]byte(jsonStr), &array); err != nil {
		return nil, err
	}
	return array, nil
}

func IDFT2DHandler(w http.ResponseWriter, r *http.Request) {
	// Обработка CORS и HTTP-методов
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	if err := r.ParseMultipartForm(30 << 20); err != nil { // 30 MB
		http.Error(w, "could not parse form", http.StatusBadRequest)
		fmt.Println("Error parsing form:", err)
		return
	}

	inputReStr := r.FormValue("inputRe")
	if inputReStr == "" {
		http.Error(w, "missing inputRe data", http.StatusBadRequest)
		fmt.Println("Error: missing inputRe data")
		return
	}

	inputImStr := r.FormValue("inputIm")
	if inputImStr == "" {
		http.Error(w, "missing inputIm data", http.StatusBadRequest)
		fmt.Println("Error: missing inputIm data")
		return
	}

	inputRe, err := parse2DFloat64Array(inputReStr)
	if err != nil {
		http.Error(w, "could not decode JSON request", http.StatusBadRequest)
		fmt.Println("Error decoding JSON:", err)
		return
	}

	inputIm, err := parse2DFloat64Array(inputImStr)
	if err != nil {
		http.Error(w, "could not decode JSON request", http.StatusBadRequest)
		fmt.Println("Error decoding JSON:", err)
		return
	}

	// Применение обратного Фурье-преобразования
	resRe, resIm := services.ApplyIDFT2D(inputRe, inputIm)
	response := map[string]interface{}{
		"resRe": resRe,
		"resIm": resIm,
	}

	// Установка заголовков и отправка ответа
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "could not encode response", http.StatusInternalServerError)
		fmt.Println("Error encoding JSON response:", err)
	}
}
