package main

import (
	"app/handlers"
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/filter_arithmetic_mean", enableCors(handlers.FilterHandler))
	http.HandleFunc("/filter_contr_harmonic_mean", enableCors(handlers.FilterHandler))

	err := http.ListenAndServe(":3000", nil)
	if err != nil {
		fmt.Println("Server failed to start:", err)
	}
}

func enableCors(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		next(w, r)
	}
}
