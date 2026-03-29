const icons = {
  "close-s3":
    "data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3LjQ4IDcuNDgiPjxkZWZzPjxzdHlsZT4uY2xzLTF7ZmlsbDpub25lO3N0cm9rZTojZmZmO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2Utd2lkdGg6MnB4O308L3N0eWxlPjwvZGVmcz48dGl0bGU+aWNvbi0tYWRkPC90aXRsZT48bGluZSBjbGFzcz0iY2xzLTEiIHgxPSIzLjc0IiB5MT0iNi40OCIgeDI9IjMuNzQiIHkyPSIxIi8+PGxpbmUgY2xhc3M9ImNscy0xIiB4MT0iMSIgeTE9IjMuNzQiIHgyPSI2LjQ4IiB5Mj0iMy43NCIvPjwvc3ZnPg==",
  "close-gandi":
    '<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.657 6.112L6.343 17.426m0-11.314l11.314 11.314" stroke="#566276" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
};

const isGandi = window.location.href.startsWith("https://www.ccw.site/gandi/project/");

export const createEditorModal = (tab, title, { isOpen = false } = {}) => {
  const container = Object.assign(document.createElement("div"), {
    className: tab.scratchClass("modal_modal-overlay"),
    dir: tab.direction,
  });
  container.style.display = "none";
  document.body.appendChild(container);
  const modal = Object.assign(document.createElement("div"), {
    className: tab.scratchClass("modal_modal-content"),
  });
  modal.addEventListener("click", (e) => e.stopPropagation());
  container.appendChild(modal);
  const header = Object.assign(document.createElement("div"), {
    className: tab.scratchClass("modal_header"),
  });
  modal.appendChild(header);
  header.appendChild(
    Object.assign(document.createElement("div"), {
      className: tab.scratchClass("modal_header-item", "modal_header-item-title"),
      innerText: title,
    })
  );
  const closeContainer = Object.assign(document.createElement("div"), {
    className: tab.scratchClass("modal_header-item", "modal_header-item-close"),
  });
  header.appendChild(closeContainer);
  const closeButton = Object.assign(document.createElement("div"), {
    className: tab.scratchClass("close-button_close-button", "close-button_large"),
  });
  closeContainer.appendChild(closeButton);
  if (isGandi) {
    closeButton.innerHTML = icons["close-gandi"];
  } else {
    closeButton.appendChild(
      Object.assign(document.createElement("img"), {
        className: tab.scratchClass("close-button_close-icon"),
        src: icons["close-s3"],
        draggable: false,
      })
    );
  }
  const content = Object.assign(document.createElement("div"), {
    className: "sa-editor-modal-content",
    style: `
      background-color: var(--editorDarkMode-accent, white);
      color: var(--editorDarkMode-accent-text, #575e75);
    `,
  });
  modal.appendChild(content);
  const open = () => {
    container.style.display = "";
    if (tab.editorMode === "editor") {
      tab.Blockly.hideChaff();
    }
  };
  if (isOpen) open();
  return {
    container: modal,
    content,
    backdrop: container,
    closeButton,
    open,
    close: () => {
      container.style.display = "none";
    },
    remove: container.remove.bind(container),
  };
};

const createButtonRow = (tab, mode, { okButtonLabel, cancelButtonLabel } = {}) => {
  const buttonRow = Object.assign(document.createElement("div"), {
    className: {
      editor: tab.scratchClass("prompt_button-row"),
      "scratch-www": "action-buttons",
      scratchr2: "modal-footer",
    }[mode],
  });
  const cancelButton = Object.assign(document.createElement("button"), {
    className: { "scratch-www": "button action-button close-button white" }[mode] || "",
    innerText:
      cancelButtonLabel ||
      tab.scratchMessage(
        {
          editor: "gui.prompt.cancel",
          "scratch-www": "general.cancel",
          scratchr2: "Cancel",
        }[mode]
      ),
  });
  buttonRow.appendChild(cancelButton);
  const okButton = Object.assign(document.createElement("button"), {
    className: {
      editor: tab.scratchClass("prompt_ok-button"),
      "scratch-www": "button action-button submit-button",
    }[mode],
    innerText:
      okButtonLabel ||
      tab.scratchMessage(
        {
          editor: "gui.prompt.ok",
          "scratch-www": "general.okay",
          scratchr2: "OK",
        }[mode]
      ),
  });
  buttonRow.appendChild(okButton);
  return { buttonRow, cancelButton, okButton };
};

export const confirm = (tab, title, message, { useEditorClasses = false, okButtonLabel, cancelButtonLabel } = {}) => {
  const { remove, container, content, backdrop, closeButton } = tab.createModal(title, {
    isOpen: true,
    useEditorClasses: useEditorClasses,
    useSizesClass: true,
  });
  const mode = tab.editorMode !== null && useEditorClasses ? "editor" : tab.clientVersion;
  if (mode === "editor") {
    container.classList.add(tab.scratchClass("prompt_modal-content"));
    content.classList.add(tab.scratchClass("prompt_body"));
  }
  content.appendChild(
    Object.assign(document.createElement("div"), {
      className:
        {
          editor: tab.scratchClass("prompt_label"),
          "scratch-www": "sa-confirm-text",
        }[mode] || "",
      style: { "scratch-www": "margin: .9375rem 0.8275rem 0 .8275rem" }[mode] || "",
      innerText: message,
    })
  );
  const { buttonRow, cancelButton, okButton } = createButtonRow(tab, mode, {
    okButtonLabel,
    cancelButtonLabel,
  });
  if (mode === "scratchr2") container.appendChild(buttonRow);
  else content.appendChild(buttonRow);
  okButton.focus();
  return new Promise((resolve) => {
    const cancel = () => {
      remove();
      resolve(false);
    };
    const ok = () => {
      remove();
      resolve(true);
    };
    backdrop.addEventListener("click", cancel);
    closeButton.addEventListener("click", cancel);
    cancelButton.addEventListener("click", cancel);
    okButton.addEventListener("click", ok);
    container.addEventListener("keydown", (e) => {
      if (e.key === "Enter") ok();
      if (e.key === "Escape") cancel();
    });
  });
};

export const prompt = (tab, title, message, defaultValue = "", { useEditorClasses = false } = {}) => {
  const { remove, container, content, backdrop, closeButton } = tab.createModal(title, {
    isOpen: true,
    useEditorClasses: useEditorClasses,
    useSizesClass: true,
  });
  const mode = tab.editorMode !== null && useEditorClasses ? "editor" : tab.clientVersion;
  if (mode === "editor") {
    container.classList.add(tab.scratchClass("prompt_modal-content"));
    content.classList.add(tab.scratchClass("prompt_body"));
  }
  content.appendChild(
    Object.assign(document.createElement("div"), {
      className: { editor: tab.scratchClass("prompt_label") }[mode] || "",
      style: { "scratch-www": "margin: .9375rem 0.8275rem 1.125rem .8275rem" }[mode] || "",
      innerText: message,
    })
  );
  const input = Object.assign(document.createElement("input"), {
    className: { editor: tab.scratchClass("prompt_variable-name-text-input"), "scratch-www": "input" }[mode] || "",
    style:
      {
        "scratch-www": `
      width: calc(100% - 1.655rem);
      margin: 0 0.8275rem;
    `,
        scratchr2: "width: calc(100% - 10px)",
      }[mode] || "",
    value: defaultValue,
  });
  content.appendChild(input);
  input.focus();
  input.select();
  const { buttonRow, cancelButton, okButton } = createButtonRow(tab, mode);
  if (mode === "scratchr2") container.appendChild(buttonRow);
  else content.appendChild(buttonRow);
  return new Promise((resolve) => {
    const cancel = () => {
      remove();
      resolve(null);
    };
    const ok = () => {
      remove();
      resolve(input.value);
    };
    backdrop.addEventListener("click", cancel);
    closeButton.addEventListener("click", cancel);
    cancelButton.addEventListener("click", cancel);
    okButton.addEventListener("click", ok);
    container.addEventListener("keydown", (e) => {
      if (e.key === "Enter") ok();
      if (e.key === "Escape") cancel();
    });
  });
};
