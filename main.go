package main

import (
	"app/handlers"
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/dft", enableCors(handlers.DFTHandler))
	http.HandleFunc("/idft", enableCors(handlers.IDFTHandler))

	err := http.ListenAndServe(":3001", nil)
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
