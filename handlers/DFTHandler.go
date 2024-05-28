package handlers

import (
	"app/services" // Предполагается, что у вас есть пакет services с функцией ApplyDFT
	"encoding/json"
	"fmt"
	"net/http"
)

func DFTHandler(w http.ResponseWriter, r *http.Request) {
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
		http.Error(w, "missing inputRe data", http.StatusBadRequest)
		fmt.Println("Error: missing inputRe data")
		return
	}

	var inputRe []float64
	if err := json.Unmarshal([]byte(inputReStr), &inputRe); err != nil {
		http.Error(w, "could not decode JSON request", http.StatusBadRequest)
		fmt.Println("Error decoding JSON:", err)
		return
	}

	var inputIm []float64
	if err := json.Unmarshal([]byte(inputImStr), &inputIm); err != nil {
		http.Error(w, "could not decode JSON request", http.StatusBadRequest)
		fmt.Println("Error decoding JSON:", err)
		return
	}

	// fmt.Println("Received data:", inputRe)

	// Применение Фурье-преобразования
	resRe, resIm := services.ApplyDFT(inputRe, inputIm)
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
