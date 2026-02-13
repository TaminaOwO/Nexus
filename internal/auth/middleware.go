package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Check X-API-Key header
		if key := c.GetHeader("X-API-Key"); key != "" {
			if validateAPIKey(key) {
				c.Next()
				return
			}
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid api key"})
			return
		}

		// 2. Check session cookie (JWT)
		cookie, err := c.Cookie(cookieName)
		if err == nil {
			if _, err := validateJWT(cookie); err == nil {
				c.Next()
				return
			}
		}

		// 3. No valid credentials
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
	}
}
