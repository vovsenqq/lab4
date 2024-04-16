package main

import (
	"app/handlers"
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/filteram", enableCors(handlers.FilterHandler))
	err := http.ListenAndServe(":8080", nil)
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
