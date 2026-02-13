package auth

import (
	"crypto/subtle"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var (
	oauthConfig  *oauth2.Config
	jwtSecret    []byte
	ownerEmail   string
	apiKey       string
	isProduction bool
)

func Init() {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	ownerEmail = os.Getenv("OWNER_EMAIL")
	apiKey = os.Getenv("NEXUS_API_KEY")
	secret := os.Getenv("JWT_SECRET")

	if clientID == "" || clientSecret == "" || ownerEmail == "" || apiKey == "" || secret == "" {
		log.Println("⚠️  Auth env vars not fully configured — auth will reject all requests")
		log.Println("   Required: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OWNER_EMAIL, NEXUS_API_KEY, JWT_SECRET")
	}

	jwtSecret = []byte(secret)
	isProduction = os.Getenv("GIN_MODE") == "release"

	oauthConfig = &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
		// RedirectURL set dynamically per request
	}
}

func getOAuthConfig(host string) *oauth2.Config {
	scheme := "https"
	if !isProduction {
		scheme = "http"
	}
	cfg := *oauthConfig
	cfg.RedirectURL = fmt.Sprintf("%s://%s/api/auth/callback", scheme, host)
	return &cfg
}

func generateJWT(email string) (string, error) {
	claims := jwt.MapClaims{
		"email": email,
		"exp":   time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat":   time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func validateJWT(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})
	if err != nil {
		return "", err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return "", fmt.Errorf("invalid token")
	}

	email, ok := claims["email"].(string)
	if !ok {
		return "", fmt.Errorf("email claim missing")
	}

	return email, nil
}

func validateAPIKey(key string) bool {
	if apiKey == "" || key == "" {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(key), []byte(apiKey)) == 1
}
