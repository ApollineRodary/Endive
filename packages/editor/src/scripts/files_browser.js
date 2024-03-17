window.saveFile = function(content) {
  // Create a Blob with the content
  const blob = new Blob([content], { type: "text/plain" });

  // Create a temporary URL to the Blob
  const url = URL.createObjectURL(blob);

  // Create an anchor element to trigger the download
  const a = document.createElement("a");
  a.href = url;
  a.download = "session.end";

  // Trigger a click event to open the download dialog
  a.click();

  // Clean up resources
  URL.revokeObjectURL(url);
}
window.loadFile = function() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";

    input.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target.result;
        resolve(content);
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsText(file);
    });

    input.click();
  });
}

window.save = function() {
  saveFile(globalThis.editor.state.doc.toString());
}
window.load = function() {
  loadFile()
    .then((content) => {
      const transaction = globalThis.editor.state.update({
        changes: {
          from: 0,
          to: globalThis.editor.state.doc.length,
          insert: content,
        },
      });
      const update = globalThis.editor.state.update(transaction);
      globalThis.editor.update([update]);
      if (globalThis.menu_open) {
        toggleMenu();
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
