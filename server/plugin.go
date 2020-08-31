package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/smtp"
	"sync"

	"github.com/mattermost/mattermost-server/v5/plugin"
)

// Plugin implements the interface expected by the Mattermost server to communicate between the server and plugin processes.
type Plugin struct {
	plugin.MattermostPlugin

	// configurationLock synchronizes access to the configuration.
	configurationLock sync.RWMutex

	// configuration is the active plugin configuration. Consult getConfiguration and
	// setConfiguration for usage.
	configuration *configuration
}

type RequestSendEmailJSON struct {
	Message string   `json:"message"`
	To      []string `json:"to"`
}

func (p *Plugin) handleInfo(c *plugin.Context, w http.ResponseWriter, r *http.Request) {
	e, err := json.Marshal(p.configuration)
	if err != nil {
		_, _ = fmt.Fprint(w, err)
		return
	}
	_, _ = fmt.Fprint(w, string(e))
}

func (p *Plugin) handleContent(c *plugin.Context, w http.ResponseWriter, r *http.Request) {
	e, err := json.Marshal(c)
	if err != nil {
		_, _ = fmt.Fprint(w, err)
		return
	}
	_, _ = fmt.Fprint(w, string(e))
}

func (p *Plugin) handleSendEmail(content *plugin.Context, w http.ResponseWriter, r *http.Request) {
	body, _ := ioutil.ReadAll(r.Body)
	defer r.Body.Close()
	var request RequestSendEmailJSON
	err := json.Unmarshal(body, &request)
	if err != nil {
		_, _ = fmt.Fprint(w, err)
		return
	}

	if len(request.To) <= 0 {
		_, _ = fmt.Fprint(w, "len(request.To) <=0")
		return
	}

	auth := smtp.PlainAuth("", p.configuration.SmtpServerUsername, p.configuration.SmtpServerPassword, p.configuration.SmtpServer)

	to := request.To
	msg := []byte("Subject: Notification From Mattermost\n\n" + request.Message)

	err = smtp.SendMail(p.configuration.SmtpServer+":"+p.configuration.SmtpServerPort, auth, p.configuration.SmtpServerUsername, to, msg)
	if err != nil {
		_, _ = fmt.Fprint(w, err)
		return
	}
	_, _ = fmt.Fprint(w, "ok")
}

// ServeHTTP demonstrates a plugin that handles HTTP requests by greeting the world.
func (p *Plugin) ServeHTTP(c *plugin.Context, w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("Mattermost-User-ID")
	if userID == "" {
		http.Error(w, "Not authorized", http.StatusUnauthorized)
		return
	}

	path := r.URL.Path
	if path == "/sendEmail" {
		p.handleSendEmail(c, w, r)
	}
	//else if path == "/content" {
	//	p.handleContent(c, w, r)
	//} else if path == "/info" {
	//	p.handleInfo(c, w, r)
	//}
}

// See https://developers.mattermost.com/extend/plugins/server/reference/
