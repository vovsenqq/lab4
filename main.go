package main

import (
	"app/handlers"
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/dfft", enableCors(handlers.DFTHandler))
	http.HandleFunc("/idfft", enableCors(handlers.IDFTHandler))
	http.HandleFunc("/idfft2d", enableCors(handlers.IDFT2DHandler))

	err := http.ListenAndServe(":3003", nil)
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
