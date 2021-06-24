package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"

	"github.com/clocklear/pirelayserver/cmd/pirelayserver/internal"
	"github.com/clocklear/pirelayserver/cmd/pirelayserver/internal/auth"
	"github.com/clocklear/pirelayserver/cmd/pirelayserver/internal/eventer"
	"github.com/clocklear/pirelayserver/ui"
	"github.com/go-kit/kit/log"

	jwtmiddleware "github.com/auth0/go-jwt-middleware"
	"github.com/coreos/go-oidc"
	"github.com/dgrijalva/jwt-go"
	"github.com/gorilla/mux"
	uuid "github.com/satori/go.uuid"
)

type authExchangeResponse struct {
	IDToken     string                 `json:"idToken"`
	AccessToken string                 `json:"accessToken"`
	Profile     map[string]interface{} `json:"profile"`
}

func okResponse(w http.ResponseWriter, payload interface{}) error {
	if payload != nil {
		return jsonResponse(w, http.StatusOK, payload)
	}
	return jsonResponse(w, http.StatusNoContent, payload)
}

func jsonResponse(w http.ResponseWriter, status int, payload interface{}) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if payload != nil {
		b, err := json.Marshal(payload)
		if err != nil {
			return err
		}
		w.Write(b)
	}
	return nil
}

func errorResponse(w http.ResponseWriter, err error) error {
	return errorResponseWithCode(w, err, http.StatusInternalServerError)
}

func errorResponseWithCode(w http.ResponseWriter, err error, code int) error {
	b := errResponse{
		Error: err.Error(),
	}
	return jsonResponse(w, code, b)
}

func cacheHeaders(paths []string, cacheTime uint32, h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hd := w.Header()
		match := false
		for _, v := range paths {
			if strings.HasPrefix(r.URL.Path, v) {
				hd.Add("Cache-Control", fmt.Sprintf("max-age=%v", cacheTime))
				match = true
				break
			}
		}
		if !match {
			hd.Add("Cache-Control", "no-cache")
		}
		h.ServeHTTP(w, r)
	})
}

func withScope(scope string, next func(http.ResponseWriter, *http.Request)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract claims, check required scope
		user, ok := r.Context().Value("user").(*jwt.Token)
		if !ok {
			http.Error(w, "unauthorized", http.StatusForbidden)
			return
		}
		rawPermissions, ok := user.Claims.(jwt.MapClaims)["permissions"].([]interface{})
		if !ok {
			http.Error(w, "unauthorized", http.StatusForbidden)
			return
		}

		hasScope := false
		if ok && user.Valid {
			for i := range rawPermissions {
				if rawPermissions[i].(string) == scope {
					hasScope = true
				}
			}
		}

		if !hasScope {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}

		next(w, r)
	}
}

// func jwtError(w http.ResponseWriter, r *http.Request, err string) {
// 	http.Error(w, err, http.StatusForbidden)
// }

func getHandler(cfger internal.Configurer, ctrl internal.RelayController, el eventer.Eventer, l log.Logger) http.Handler {
	r := mux.NewRouter()
	r.HandleFunc("/oauth/exchange", getOAuthExchangeHandler(l)).Methods(http.MethodGet)

	// Set up router for api routes
	apiRouter := r.PathPrefix("/api").Subrouter()
	apiRouter.HandleFunc("/relays", withScope(internal.ReadRelays, relayStatusHandler(ctrl))).Methods(http.MethodGet)
	apiRouter.HandleFunc("/relays/{relay}/toggle", withScope(internal.WriteRelayToggle, toggleRelayHandler(ctrl))).Methods(http.MethodPost)
	apiRouter.HandleFunc("/config/schedules", withScope(internal.ReadConfig, getScheduleHandler(cfger))).Methods(http.MethodGet)
	apiRouter.HandleFunc("/config/schedules", withScope(internal.WriteConfig, addScheduleHandler(cfger, ctrl))).Methods(http.MethodPost)
	apiRouter.HandleFunc("/config/schedules/{id}", withScope(internal.WriteConfig, removeScheduleHandler(cfger, ctrl))).Methods(http.MethodDelete)
	apiRouter.HandleFunc("/config/relay/{relay}/name", withScope(internal.WriteRelayName, setRelayNameHandler(cfger, ctrl))).Methods(http.MethodPost)
	apiRouter.HandleFunc("/config/keys", withScope(internal.WriteConfig, createAPIKeyHandler(cfger, ctrl))).Methods(http.MethodPost)
	apiRouter.HandleFunc("/config/keys", withScope(internal.ReadConfig, getAPIKeysHandler(cfger, ctrl))).Methods(http.MethodGet)
	apiRouter.HandleFunc("/config/keys/{id}", withScope(internal.WriteConfig, removeAPIKeyHandler(cfger, ctrl))).Methods(http.MethodDelete)
	apiRouter.HandleFunc("/events", withScope(internal.ReadEvents, getEventsHandler(el))).Methods(http.MethodGet)
	apiRouter.HandleFunc("/me", withScope(internal.ReadMe, getMeHandler())).Methods(http.MethodGet)

	// Apply JWT middleware to all the API routes
	jwtMiddleware := jwtmiddleware.New(jwtmiddleware.Options{
		// ErrorHandler: jwtError,
		Extractor: jwtmiddleware.FromFirst(jwtmiddleware.FromAuthHeader,
			jwtmiddleware.FromParameter("auth_code")),
		ValidationKeyGetter: func(token *jwt.Token) (interface{}, error) {
			// Verify 'aud' claim
			aud := os.Getenv("AUTH0_AUDIENCE")
			checkAud := token.Claims.(jwt.MapClaims).VerifyAudience(aud, false)
			if !checkAud {
				return token, errors.New("invalid audience")
			}
			// Verify 'iss' claim
			iss := fmt.Sprintf("https://%v/", os.Getenv("AUTH0_DOMAIN"))
			checkIss := token.Claims.(jwt.MapClaims).VerifyIssuer(iss, false)
			if !checkIss {
				return token, errors.New("invalid issuer")
			}

			cert, err := getPemCert(token)
			if err != nil {
				panic(err.Error())
			}

			result, _ := jwt.ParseRSAPublicKeyFromPEM([]byte(cert))
			return result, nil
		},
		// When set, the middleware verifies that tokens are signed with the specific signing algorithm
		// If the signing method is not constant the ValidationKeyGetter callback can be used to implement additional checks
		// Important to avoid security issues described here: https://auth0.com/blog/2015/03/31/critical-vulnerabilities-in-json-web-token-libraries/
		SigningMethod: jwt.SigningMethodRS256,
	})
	apiRouter.Use(jwtMiddleware.Handler)

	// Set up handler for web ui
	cachedPaths := []string{"/static"}
	r.PathPrefix("/").Handler(
		cacheHeaders(cachedPaths, 31536000, ui.Handler()),
	)

	return r
}

// this is basically just a JWT parser.  we won't make it here if the token isn't present and valid due to our jwt middleware.
func getMeHandler() func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		user := r.Context().Value("user").(*jwt.Token)
		if user == nil {
			jsonResponse(w, http.StatusUnauthorized, nil)
			return
		}
		json.NewEncoder(w).Encode(user.Claims)
	}
}

func getOAuthExchangeHandler(l log.Logger) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {

		authenticator, err := auth.NewAuthenticator()
		if err != nil {
			l.Log("err", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		token, err := authenticator.Config.Exchange(context.TODO(), r.URL.Query().Get("code"))
		if err != nil {
			l.Log("err", err)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		rawIDToken, ok := token.Extra("id_token").(string)
		if !ok {
			l.Log("err", "No id_token field in oauth2 token.")
			http.Error(w, "No id_token field in oauth2 token.", http.StatusInternalServerError)
			return
		}

		oidcConfig := &oidc.Config{
			ClientID: os.Getenv("AUTH0_CLIENT_ID"),
		}

		idToken, err := authenticator.Provider.Verifier(oidcConfig).Verify(context.TODO(), rawIDToken)

		if err != nil {
			l.Log("err", err)
			http.Error(w, "Failed to verify ID Token: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Getting now the userInfo
		var profile map[string]interface{}
		if err := idToken.Claims(&profile); err != nil {
			l.Log("err", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Create response
		resp := authExchangeResponse{
			IDToken:     rawIDToken,
			AccessToken: token.AccessToken,
			Profile:     profile,
		}

		// Return it
		okResponse(w, resp)
	}
}

func getEventsHandler(el eventer.Eventer) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		e, err := el.ListAll()
		if err != nil {
			errorResponse(w, err)
			return
		}
		// Clone the slice
		b := make([]eventer.Event, len(e))
		copy(b, e)
		// Reverse the slice
		for i := len(b)/2 - 1; i >= 0; i-- {
			opp := len(b) - 1 - i
			b[i], b[opp] = b[opp], b[i]
		}
		okResponse(w, b)
	}
}

type setRelayNameRequest struct {
	RelayName string `json:"relayName"`
}

func setRelayNameHandler(cfger internal.Configurer, ctrl internal.RelayController) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		stridx := vars["relay"]
		idx, err := strconv.ParseUint(stridx, 10, 8)
		if err != nil {
			errorResponse(w, err)
			return
		}
		if !ctrl.IsValidRelay(uint8(idx)) {
			errorResponse(w, fmt.Errorf("%v is an invalid relay", idx))
			return
		}

		decoder := json.NewDecoder(r.Body)
		var req setRelayNameRequest
		err = decoder.Decode(&req)
		if err != nil {
			errorResponse(w, err)
			return
		}

		cfg, err := cfger.Get()
		if err != nil {
			errorResponse(w, err)
			return
		}

		if cfg.RelayNames == nil {
			cfg.RelayNames = make(map[uint8]string)
		}
		cfg.RelayNames[uint8(idx)] = req.RelayName
		err = cfger.Set(cfg)
		if err != nil {
			errorResponse(w, err)
			return
		}

		okResponse(w, nil)
	}
}

func removeScheduleHandler(cfger internal.Configurer, ctrl internal.RelayController) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["id"]

		// Find this schedule in the config
		cfg, err := cfger.Get()
		if err != nil {
			errorResponse(w, err)
			return
		}

		idx := -1
		for k, v := range cfg.Schedules {
			if v.ID == id {
				idx = k
			}
		}

		// Not found?
		if idx == -1 {
			jsonResponse(w, http.StatusNotFound, nil)
			return
		}

		// Splice this item out of the schedules
		cfg.Schedules = append(cfg.Schedules[:idx], cfg.Schedules[idx+1:]...)

		// Apply config, see if errors arise
		err = ctrl.ApplyConfig(cfg)
		if err != nil {
			errorResponse(w, err)
			return
		}

		// No errors?  Save the config
		err = cfger.Set(cfg)
		if err != nil {
			errorResponse(w, err)
			return
		}

		// Good to go!
		okResponse(w, nil)
	}
}

func getScheduleHandler(cfger internal.Configurer) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		cfg, err := cfger.Get()
		if err != nil {
			errorResponse(w, err)
			return
		}
		okResponse(w, cfg.Schedules)
	}
}

func addScheduleHandler(cfger internal.Configurer, ctrl internal.RelayController) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		decoder := json.NewDecoder(r.Body)
		var s internal.Schedule
		err := decoder.Decode(&s)
		if err != nil {
			errorResponse(w, err)
			return
		}

		// Load current config
		cfg, err := cfger.Get()
		if err != nil {
			errorResponse(w, err)
			return
		}

		if s.ID == "" {
			// New schedule
			// Set random ID on this schedule
			u := uuid.NewV4()
			s.ID = u.String()

			// Store this in the current config
			cfg.Schedules = append(cfg.Schedules, s)
		} else {
			// Existing schedule
			found := false
			idx := -1
			for k, v := range cfg.Schedules {
				if v.ID == s.ID {
					idx = k
					found = true
					break
				}
			}
			// Did we find this thing?  If not, 404.
			if !found {
				jsonResponse(w, http.StatusNotFound, nil)
				return
			}
			// Store this in the current config
			cfg, err = cfger.Get()
			if err != nil {
				errorResponse(w, err)
				return
			}
			// Replace the existing item in the cfg with our new one
			cfg.Schedules = append(cfg.Schedules[:idx], cfg.Schedules[idx+1:]...)
			cfg.Schedules = append(cfg.Schedules, s)
		}

		// Apply config, see if errors arise
		err = ctrl.ApplyConfig(cfg)
		if err != nil {
			errorResponse(w, err)
			return
		}

		// No errors?  Save the config
		err = cfger.Set(cfg)
		if err != nil {
			errorResponse(w, err)
			return
		}

		// Good to go!
		jsonResponse(w, http.StatusCreated, s)
	}
}

func relayStatusHandler(ctrl internal.RelayController) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		s, err := ctrl.Status()
		if err != nil {
			errorResponse(w, err)
			return
		}
		okResponse(w, s)
	}
}

func toggleRelayHandler(ctrl internal.RelayController) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		stridx := vars["relay"]
		idx, err := strconv.ParseUint(stridx, 10, 8)
		if err != nil {
			errorResponse(w, err)
			return
		}
		err = ctrl.Toggle(uint8(idx))
		if err != nil {
			errorResponse(w, err)
			return
		}

		status, err := ctrl.Status()
		if err != nil {
			errorResponse(w, err)
			return
		}

		okResponse(w, status)
	}
}

type createAPIKeyRequest struct {
	Desc string `json:"desc"`
}

type createAPIKeyResponse struct {
	Key string `json:"key"`
}

func getSubjectFromToken(tok *jwt.Token) (string, error) {
	if tok == nil {
		return "", fmt.Errorf("missing jwt token")
	}
	claims, ok := tok.Claims.(jwt.MapClaims)
	if !ok {
		return "", fmt.Errorf("invalid user claims")
	}
	rawSubject, ok := claims["sub"]
	if !ok {
		return "", fmt.Errorf("error determining subject")
	}
	subject, ok := rawSubject.(string)
	if !ok {
		return "", fmt.Errorf("error casting subject to string")
	}
	return subject, nil
}

func createAPIKeyHandler(cfger internal.Configurer, ctrl internal.RelayController) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		// Read the user, determine subject
		user := r.Context().Value("user").(*jwt.Token)
		if user == nil {
			jsonResponse(w, http.StatusUnauthorized, nil)
			return
		}
		subject, err := getSubjectFromToken(user)
		if err != nil {
			errorResponse(w, err)
			return
		}

		// Decode request
		decoder := json.NewDecoder(r.Body)
		var req createAPIKeyRequest
		err = decoder.Decode(&req)
		if err != nil {
			errorResponse(w, err)
			return
		}
		if req.Desc == "" {
			errorResponseWithCode(w, fmt.Errorf("bad request, missing api key description"), http.StatusBadRequest)
			return
		}

		// Grab the current config
		config, err := cfger.Get()
		if err != nil {
			errorResponse(w, err)
			return
		}

		// Create map if it doesn't exist
		if config.APIKeys == nil {
			config.APIKeys = make(map[string]internal.APIKeyCollection)
		}

		// Create user entry if it doesn't exist
		if _, ok := config.APIKeys[subject]; !ok {
			config.APIKeys[subject] = internal.APIKeyCollection{}
		}

		// Create API key
		apiKey := internal.APIKey{
			Desc: req.Desc,
			Key:  uuid.NewV4().String(),
		}
		apiKeyId := uuid.NewV4().String()

		// Add to config, persist
		config.APIKeys[subject][apiKeyId] = apiKey
		err = cfger.Set(config)
		if err != nil {
			errorResponse(w, err)
			return
		}

		// Good to go
		resp := createAPIKeyResponse{
			Key: apiKey.Key,
		}
		jsonResponse(w, http.StatusCreated, resp)
	}
}

type apiKeyResponse struct {
	ID   string `json:"id"`
	Desc string `json:"desc"`
}

func getAPIKeysHandler(cfger internal.Configurer, ctrl internal.RelayController) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		// Read the user, determine subject
		user := r.Context().Value("user").(*jwt.Token)
		if user == nil {
			jsonResponse(w, http.StatusUnauthorized, nil)
			return
		}
		subject, err := getSubjectFromToken(user)
		if err != nil {
			errorResponse(w, err)
			return
		}

		// Grab the current config
		config, err := cfger.Get()
		if err != nil {
			errorResponse(w, err)
			return
		}

		// Create map if it doesn't exist
		if config.APIKeys == nil {
			config.APIKeys = make(map[string]internal.APIKeyCollection)
		}

		// Create user entry if it doesn't exist
		userKeys, ok := config.APIKeys[subject]
		if !ok {
			userKeys = internal.APIKeyCollection{}
		}

		// Convert user key collection into a deterministic serializable response
		resp := []apiKeyResponse{}
		keys := []string{}
		for k := range userKeys {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for _, v := range keys {
			resp = append(resp, apiKeyResponse{
				ID:   v,
				Desc: userKeys[v].Desc,
			})
		}
		okResponse(w, resp)
	}
}

func removeAPIKeyHandler(cfger internal.Configurer, ctrl internal.RelayController) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		// Read the user, determine subject
		user := r.Context().Value("user").(*jwt.Token)
		if user == nil {
			jsonResponse(w, http.StatusUnauthorized, nil)
			return
		}
		subject, err := getSubjectFromToken(user)
		if err != nil {
			errorResponse(w, err)
			return
		}

		// Decode request
		vars := mux.Vars(r)
		id := vars["id"]
		if id == "" {
			errorResponseWithCode(w, fmt.Errorf("bad request, missing api key id"), http.StatusBadRequest)
			return
		}

		// Grab the current config
		config, err := cfger.Get()
		if err != nil {
			errorResponse(w, err)
			return
		}

		// Create map if it doesn't exist
		if config.APIKeys == nil {
			config.APIKeys = make(map[string]internal.APIKeyCollection)
		}

		// Create user entry if it doesn't exist
		userKeys, ok := config.APIKeys[subject]
		if !ok {
			userKeys = internal.APIKeyCollection{}
		}

		// Does the requested key exist?
		_, exists := userKeys[id]
		if !exists {
			errorResponseWithCode(w, fmt.Errorf("api key not found"), http.StatusNotFound)
			return
		}

		// Key exists, remove, persist collection
		delete(userKeys, id)
		config.APIKeys[subject] = userKeys
		err = cfger.Set(config)
		if err != nil {
			errorResponse(w, err)
			return
		}

		// Good to go!
		okResponse(w, nil)
	}
}

type Jwks struct {
	Keys []JSONWebKeys `json:"keys"`
}

type JSONWebKeys struct {
	Kty string   `json:"kty"`
	Kid string   `json:"kid"`
	Use string   `json:"use"`
	N   string   `json:"n"`
	E   string   `json:"e"`
	X5c []string `json:"x5c"`
}

func getPemCert(token *jwt.Token) (string, error) {
	cert := ""
	resp, err := http.Get(fmt.Sprintf("https://%v/.well-known/jwks.json", os.Getenv("AUTH0_DOMAIN")))

	if err != nil {
		return cert, err
	}
	defer resp.Body.Close()

	var jwks = Jwks{}
	err = json.NewDecoder(resp.Body).Decode(&jwks)

	if err != nil {
		return cert, err
	}

	for k := range jwks.Keys {
		if token.Header["kid"] == jwks.Keys[k].Kid {
			cert = "-----BEGIN CERTIFICATE-----\n" + jwks.Keys[k].X5c[0] + "\n-----END CERTIFICATE-----"
		}
	}

	if cert == "" {
		err := errors.New("unable to find appropriate key")
		return cert, err
	}

	return cert, nil
}
