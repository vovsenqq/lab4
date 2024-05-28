package main

import (
	"app/handlers"
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/dfft4", enableCors(handlers.DFTHandler))
	http.HandleFunc("/idfft4", enableCors(handlers.IDFTHandler))
	http.HandleFunc("/idfft2d4", enableCors(handlers.IDFT2DHandler))

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
