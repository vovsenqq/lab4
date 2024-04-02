package main

import (
	"fmt"
	"myapp/handlers"
	"net/http"
)

func main() {
	http.HandleFunc("/noise", handlers.NoiseHandler)
	http.HandleFunc("/filter", handlers.FilterHandler)
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		fmt.Println("Server failed to start:", err)
	}
}
