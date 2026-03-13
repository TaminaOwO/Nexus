package middleware

import (
	"crypto/subtle"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// APIKeyAuth validates the X-API-Key header against NEXUS_API_KEY env var.
func APIKeyAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		expected := os.Getenv("NEXUS_API_KEY")
		if expected == "" {
			log.Println("WARNING: NEXUS_API_KEY is not set")
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "server misconfiguration"})
			return
		}

		provided := c.GetHeader("X-API-Key")
		if provided == "" || subtle.ConstantTimeCompare([]byte(provided), []byte(expected)) != 1 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		c.Next()
	}
}
