// Package pi provides Pi agent plugin management.
package pi

import (
	"embed"
	"fmt"
	"os"
	"path/filepath"
)

//go:embed plugin/gastown.ts
var pluginFS embed.FS

// EnsurePiPluginAt ensures the Gas Town Pi plugin exists.
// If the file already exists, it's left unchanged.
func EnsurePiPluginAt(workDir, pluginDir, pluginFile string) error {
	if pluginDir == "" || pluginFile == "" {
		return nil
	}

	pluginPath := filepath.Join(workDir, pluginDir, pluginFile)
	if _, err := os.Stat(pluginPath); err == nil {
		return nil
	}

	if err := os.MkdirAll(filepath.Dir(pluginPath), 0755); err != nil {
		return fmt.Errorf("creating plugin directory: %w", err)
	}

	content, err := pluginFS.ReadFile("plugin/gastown.ts")
	if err != nil {
		return fmt.Errorf("reading plugin template: %w", err)
	}

	if err := os.WriteFile(pluginPath, content, 0644); err != nil {
		return fmt.Errorf("writing plugin: %w", err)
	}

	return nil
}
