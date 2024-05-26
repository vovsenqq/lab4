package handlers

import (
	"app/services"
	"bytes"
	"encoding/json"
	"image/png"
	"log"
	"net/http"
)

// IDFTHandler обрабатывает HTTP-запросы для применения обратного преобразования Фурье
func IDFTHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	if err := r.ParseMultipartForm(30 << 20); err != nil { // 30 MB
		http.Error(w, "could not parse form", http.StatusBadRequest)
		return
	}

	redRe := parseFormArray(r.FormValue("redRe"))
	redIm := parseFormArray(r.FormValue("redIm"))
	greenRe := parseFormArray(r.FormValue("greenRe"))
	greenIm := parseFormArray(r.FormValue("greenIm"))
	blueRe := parseFormArray(r.FormValue("blueRe"))
	blueIm := parseFormArray(r.FormValue("blueIm"))

	reconstructedImg := services.ApplyIDFT(redRe, redIm, greenRe, greenIm, blueRe, blueIm)

	var buf bytes.Buffer
	if err := png.Encode(&buf, reconstructedImg); err != nil {
		http.Error(w, "could not encode image", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "image/png")
	w.Write(buf.Bytes())
}

func parseFormArray(value string) [][]float64 {
	var array [][]float64
	if err := json.Unmarshal([]byte(value), &array); err != nil {
		log.Printf("Error parsing form array: %v", err)
	}
	return array
}
