package pi

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestEnsurePiPluginAt_EmptyParameters(t *testing.T) {
	// Test that empty pluginDir or pluginFile returns nil
	t.Run("empty pluginDir", func(t *testing.T) {
		err := pi.EnsurePiPluginAt("/tmp/work", "", "gastown.ts")
		if err != nil {
			t.Errorf("EnsurePiPluginAt() with empty pluginDir should return nil, got %v", err)
		}
	})

	t.Run("empty pluginFile", func(t *testing.T) {
		err := pi.EnsurePiPluginAt("/tmp/work", "plugins", "")
		if err != nil {
			t.Errorf("EnsurePiPluginAt() with empty pluginFile should return nil, got %v", err)
		}
	})

	t.Run("both empty", func(t *testing.T) {
		err := pi.EnsurePiPluginAt("/tmp/work", "", "")
		if err != nil {
			t.Errorf("EnsurePiPluginAt() with both empty should return nil, got %v", err)
		}
	})
}

func TestEnsurePiPluginAt_FileExists(t *testing.T) {
	// Create a temporary directory
	tmpDir := t.TempDir()

	// Create the plugin file first
	pluginDir := "plugins"
	pluginFile := "gastown.ts"
	pluginPath := filepath.Join(tmpDir, pluginDir, pluginFile)

	if err := os.MkdirAll(filepath.Dir(pluginPath), 0755); err != nil {
		t.Fatalf("Failed to create test directory: %v", err)
	}

	// Write a placeholder file
	existingContent := []byte("// existing plugin")
	if err := os.WriteFile(pluginPath, existingContent, 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	// EnsurePiPluginAt should not overwrite existing file
	err := pi.EnsurePiPluginAt(tmpDir, pluginDir, pluginFile)
	if err != nil {
		t.Fatalf("EnsurePiPluginAt() error = %v", err)
	}

	// Verify file content is unchanged
	content, err := os.ReadFile(pluginPath)
	if err != nil {
		t.Fatalf("Failed to read plugin file: %v", err)
	}
	if string(content) != string(existingContent) {
		t.Error("EnsurePiPluginAt() should not overwrite existing file")
	}
}

func TestEnsurePiPluginAt_CreatesFile(t *testing.T) {
	// Create a temporary directory
	tmpDir := t.TempDir()

	pluginDir := "plugins"
	pluginFile := "gastown.ts"
	pluginPath := filepath.Join(tmpDir, pluginDir, pluginFile)

	// Ensure plugin doesn't exist
	if _, err := os.Stat(pluginPath); err == nil {
		t.Fatal("Plugin file should not exist yet")
	}

	// Create the plugin
	err := pi.EnsurePiPluginAt(tmpDir, pluginDir, pluginFile)
	if err != nil {
		t.Fatalf("EnsurePiPluginAt() error = %v", err)
	}

	// Verify file was created
	info, err := os.Stat(pluginPath)
	if err != nil {
		t.Fatalf("Plugin file was not created: %v", err)
	}
	if info.IsDir() {
		t.Error("Plugin path should be a file, not a directory")
	}

	// Verify file has content
	content, err := os.ReadFile(pluginPath)
	if err != nil {
		t.Fatalf("Failed to read plugin file: %v", err)
	}
	if len(content) == 0 {
		t.Error("Plugin file should have content")
	}

	// Verify it's the correct TypeScript plugin content
	if !contains(content, "ExtensionAPI") {
		t.Error("Plugin file should contain TypeScript ExtensionAPI")
	}
}

func TestEnsurePiPluginAt_CreatesDirectory(t *testing.T) {
	// Create a temporary directory
	tmpDir := t.TempDir()

	pluginDir := "nested/plugins/dir"
	pluginFile := "gastown.ts"
	pluginPath := filepath.Join(tmpDir, pluginDir, pluginFile)

	// Create the plugin
	err := pi.EnsurePiPluginAt(tmpDir, pluginDir, pluginFile)
	if err != nil {
		t.Fatalf("EnsurePiPluginAt() error = %v", err)
	}

	// Verify directory was created
	dirInfo, err := os.Stat(filepath.Dir(pluginPath))
	if err != nil {
		t.Fatalf("Plugin directory was not created: %v", err)
	}
	if !dirInfo.IsDir() {
		t.Error("Plugin parent path should be a directory")
	}
}

func TestEnsurePiPluginAt_FilePermissions(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("file mode checks are not reliable on Windows")
	}

	// Create a temporary directory
	tmpDir := t.TempDir()

	pluginDir := "plugins"
	pluginFile := "gastown.ts"
	pluginPath := filepath.Join(tmpDir, pluginDir, pluginFile)

	err := pi.EnsurePiPluginAt(tmpDir, pluginDir, pluginFile)
	if err != nil {
		t.Fatalf("EnsurePiPluginAt() error = %v", err)
	}

	info, err := os.Stat(pluginPath)
	if err != nil {
		t.Fatalf("Failed to stat plugin file: %v", err)
	}

	// Check file mode is 0644 (rw-r--r--)
	expectedMode := os.FileMode(0644)
	if info.Mode() != expectedMode {
		t.Errorf("Plugin file mode = %v, want %v", info.Mode(), expectedMode)
	}
}

// contains checks if b contains s as a substring
func contains(b []byte, s string) bool {
	return len(b) > 0 && len(s) > 0 && string(b) != "" && len(s) <= len(b) && (string(b) == s || len(s) < len(b) && (string(b[:len(s)]) == s || contains(b[1:], s)))
}
