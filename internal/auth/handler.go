package auth

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

const cookieName = "nexus_session"
const cookieMaxAge = 7 * 24 * 60 * 60 // 7 days in seconds

func LoginHandler(c *gin.Context) {
	state := generateState()
	cfg := getOAuthConfig(c.Request.Host)
	url := cfg.AuthCodeURL(state)

	// Store state in a short-lived cookie for CSRF protection
	c.SetCookie("oauth_state", state, 300, "/", "", isProduction, true)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func CallbackHandler(c *gin.Context) {
	// Verify state
	stateCookie, err := c.Cookie("oauth_state")
	if err != nil || stateCookie != c.Query("state") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid state"})
		return
	}
	// Clear state cookie
	c.SetCookie("oauth_state", "", -1, "/", "", isProduction, true)

	// Exchange code for token
	cfg := getOAuthConfig(c.Request.Host)
	token, err := cfg.Exchange(c.Request.Context(), c.Query("code"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to exchange token"})
		return
	}

	// Get user info from Google
	client := cfg.Client(c.Request.Context(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user info"})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read user info"})
		return
	}

	var userInfo struct {
		Email string `json:"email"`
	}
	if err := json.Unmarshal(body, &userInfo); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse user info"})
		return
	}

	// Check if email matches owner
	if userInfo.Email != ownerEmail {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized email"})
		return
	}

	// Generate JWT
	jwtToken, err := generateJWT(userInfo.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate session"})
		return
	}

	// Set HTTP-Only cookie
	c.SetCookie(cookieName, jwtToken, cookieMaxAge, "/", "", isProduction, true)
	c.Redirect(http.StatusTemporaryRedirect, "/")
}

func MeHandler(c *gin.Context) {
	cookie, err := c.Cookie(cookieName)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"authenticated": false})
		return
	}

	email, err := validateJWT(cookie)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"authenticated": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"authenticated": true,
		"email":         email,
	})
}

func LogoutHandler(c *gin.Context) {
	c.SetCookie(cookieName, "", -1, "/", "", isProduction, true)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

func generateState() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}
