import { MODULE_ID } from "./main.js";

const { HandlebarsApplicationMixin, DocumentSheetV2 } = foundry.applications.api;
const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation || TextEditor;

export class PersonnelFileSheet extends HandlebarsApplicationMixin(DocumentSheetV2) {
  
  static DEFAULT_OPTIONS = {
    classes: ["personnel-file-sheet"],
    position: {
      width: 720,
      height: "auto"
    },
    form: {
      submitOnChange: false,
      closeOnSubmit: false
    }
  };

  /**
   * Application V2 PARTS specification for template rendering
   */
  static PARTS = {
    view: {
      template: `modules/${MODULE_ID}/templates/personnel-file-view.hbs`
    },
    edit: {
      template: `modules/${MODULE_ID}/templates/personnel-file-edit.hbs`
    }
  };

  /**
   * Dynamically choose which PARTS template to render based on sheet edit mode
   */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (this.isEditable) {
      options.parts = ["edit"];
    } else {
      options.parts = ["view"];
    }
  }

  /**
   * Helper to get a unique storage key for per-user local draft inputs.
   */
  #getDraftStorageKey(fieldKey) {
    return `${MODULE_ID}-draft-${this.document.id}-${game.user.id}-${fieldKey}`;
  }

  /**
   * Helper to get a unique storage key for per-user local player notepad.
   */
  #getNotepadStorageKey() {
    return `${MODULE_ID}-notepad-${this.document.id}-${game.user.id}`;
  }

  /**
   * Prepare context data for Handlebars rendering in Application V2
   */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    
    context.roles = {
      "": game.i18n.localize("COC-CASE-FILES.UnassignedRole"),
      suspect: game.i18n.localize("COC-CASE-FILES.Roles.suspect"),
      witness: game.i18n.localize("COC-CASE-FILES.Roles.witness"),
      victim: game.i18n.localize("COC-CASE-FILES.Roles.victim")
    };

    const doc = this.document;
    const isGM = game.user.isGM;
    const canPropose = doc.testUserPermission(game.user, "OBSERVER");
    const proposals = doc.getFlag(MODULE_ID, "proposals") || {};

    // Get selected Era Theme setting
    const theme = game.settings.get(MODULE_ID, "theme") || "polska-80-90";
    context.theme = theme;

    // Theme specific headers & watermarks
    if (theme === "polska-20lecie") {
      context.headerTop = "POLICJA PAŃSTWOWA RZECZYPOSPOLITEJ POLSKIEJ";
      context.headerSub = "KARTA REJESTRACYJNA OSÓB PODEJRZANYCH";
      context.watermark = "TAJNE / POUFNE";
      context.footerLeft = "KOMENDA GŁÓWNA POLICJI PAŃSTWOWEJ - WYDZIAŁ ŚLEDCZY";
      context.footerRight = "FORM-PP-1924";
    } else if (theme === "polska-dzis") {
      context.headerTop = "POLICJA - KOMENDA GŁÓWNA POLICJI";
      context.headerSub = "SYSTEM EWIDENCJI MAJĄTKOWO-OSOBOWEJ";
      context.watermark = "ZASTRZEŻONE";
      context.footerLeft = "POLICJA RZECZYPOSPOLITEJ POLSKIEJ - SYSTEM KIP";
      context.footerRight = "FORM-POL-2024";
    } else if (theme === "uniwersalny-20lecie") {
      context.headerTop = "DOSSIER / INVESTIGATION RECORD";
      context.headerSub = "CONFIDENTIAL RECORD - 1920s BUREAU";
      context.watermark = "CONFIDENTIAL";
      context.footerLeft = "BUREAU OF INVESTIGATION - RECORDS";
      context.footerRight = "FORM-1924-A";
    } else if (theme === "uniwersalny-dzis") {
      context.headerTop = "DIGITAL CASE FILE / DOSSIER";
      context.headerSub = "RESTRICTED ACCESS - CENTRAL RECORDS";
      context.watermark = "CLASSIFIED";
      context.footerLeft = "CENTRAL POLICE RECORDS - DATABASE SYSTEM";
      context.footerRight = "FORM-2024-SYS";
    } else if (theme === "uniwersalny-80-90") {
      context.headerTop = "CASE FILE / DOSSIER";
      context.headerSub = "CONFIDENTIAL RECORD - DEPT OF POLICE";
      context.watermark = "RESTRICTED";
      context.footerLeft = "DEPARTMENT OF POLICE - RECORDS DIVISION";
      context.footerRight = "FORM-80-REC";
    } else {
      // Default polska-80-90
      context.headerTop = game.i18n.localize("COC-CASE-FILES.HeaderTop");
      context.headerSub = game.i18n.localize("COC-CASE-FILES.HeaderSub");
      context.watermark = "TAJNE";
      context.footerLeft = "KOMENDA GŁÓWNA POLICJI - SEKCYJNA KARTA EWIDENCYJNA";
      context.footerRight = "FORM-POL-90/A";
    }

    const fieldDefinitions = [
      { key: "fullName", label: game.i18n.localize("COC-CASE-FILES.FullName"), value: doc.system?.fullName || "" },
      { key: "alias", label: game.i18n.localize("COC-CASE-FILES.Alias"), value: doc.system?.alias || "" },
      { key: "gender", label: game.i18n.localize("COC-CASE-FILES.Gender"), value: doc.system?.gender || "" },
      { key: "birthDate", label: game.i18n.localize("COC-CASE-FILES.BirthDate"), value: doc.system?.birthDate || "" },
      { key: "appearance.height", label: game.i18n.localize("COC-CASE-FILES.Height"), value: doc.system?.appearance?.height || "" },
      { key: "appearance.build", label: game.i18n.localize("COC-CASE-FILES.Build"), value: doc.system?.appearance?.build || "" },
      { key: "appearance.hair", label: game.i18n.localize("COC-CASE-FILES.Hair"), value: doc.system?.appearance?.hair || "" },
      { key: "appearance.eyes", label: game.i18n.localize("COC-CASE-FILES.Eyes"), value: doc.system?.appearance?.eyes || "" },
      { key: "appearance.marks", label: game.i18n.localize("COC-CASE-FILES.Marks"), value: doc.system?.appearance?.marks || "" },
      { key: "address", label: game.i18n.localize("COC-CASE-FILES.Address"), value: doc.system?.address || "" }
    ];

    const fields = fieldDefinitions.map(f => {
      const val = (f.value ?? "").toString().trim();
      const isLocked = Boolean(val);
      const rawProp = foundry.utils.getProperty(proposals, f.key) || proposals[f.key] || null;
      const draftVal = localStorage.getItem(this.#getDraftStorageKey(f.key)) || "";

      return {
        key: f.key,
        label: f.label,
        value: val,
        isLocked: isLocked,
        proposal: isLocked ? null : rawProp,
        draft: draftVal
      };
    });

    context.isGM = isGM;
    context.canPropose = canPropose;
    context.fields = fields;
    context.roleProposal = proposals.role || null;
    context.roleDraft = localStorage.getItem(this.#getDraftStorageKey("role")) || "";
    context.playerNotepad = localStorage.getItem(this.#getNotepadStorageKey()) || "";

    if (this.isEditable) {
      context.editorContent = doc.system?.description || "";
    } else {
      context.descriptionHTML = await TextEditorImpl.enrichHTML(doc.system?.description || "", {
        secrets: doc.isOwner,
        async: true
      });
    }

    return context;
  }

  /**
   * Action / Event handling after DOM render in Application V2
   */
  _onRender(context, options) {
    super._onRender(context, options);

    const root = this.element;
    if (!root) return;

    // Player Notepad auto-save
    const notepad = root.querySelector(".player-notepad");
    notepad?.addEventListener("input", () => {
      localStorage.setItem(this.#getNotepadStorageKey(), notepad.value);
    });

    // Helper to send proposal and clear local draft
    const sendProposal = async (field, val) => {
      const currentVal = foundry.utils.getProperty(this.document.system, field);
      if (currentVal && String(currentVal).trim()) {
        ui.notifications.warn(game.i18n.localize("COC-CASE-FILES.FieldLockedWarn"));
        return;
      }

      if (this.document.isOwner || game.user.isGM) {
        await this.document.setFlag(MODULE_ID, `proposals.${field}`, val);
      } else {
        game.socket.emit(`module.${MODULE_ID}`, {
          action: "propose",
          pageUuid: this.document.uuid,
          field: field,
          value: val
        });
      }

      // Clear local persisted draft after sending
      localStorage.removeItem(this.#getDraftStorageKey(field));

      ui.notifications.info(game.i18n.localize("COC-CASE-FILES.ProposalSubmitted"));
      this.render(false);
    };

    // Auto-save player draft to localStorage as they type
    const draftInputs = root.querySelectorAll(".player-draft-input");
    draftInputs.forEach(input => {
      input.addEventListener("input", () => {
        const field = input.dataset.field;
        if (field) {
          localStorage.setItem(this.#getDraftStorageKey(field), input.value);
        }
      });
    });

    // Auto-save role draft to localStorage
    const roleSelect = root.querySelector(".role-draft-select");
    roleSelect?.addEventListener("change", () => {
      if (roleSelect.value) {
        localStorage.setItem(this.#getDraftStorageKey("role"), roleSelect.value);
      }
    });

    // Submit Proposal Buttons
    const submitBtns = root.querySelectorAll("[data-action='submit-proposal']");
    submitBtns.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const field = btn.dataset.field;
        const row = btn.closest(".dossier-field-row");
        const input = row?.querySelector(".player-draft-input");
        const val = input?.value.trim();

        if (val) {
          await sendProposal(field, val);
        }
      });
    });

    // Submit Role Proposal Button
    const submitRoleBtns = root.querySelectorAll("[data-action='submit-role-proposal']");
    submitRoleBtns.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const select = root.querySelector(".role-draft-select");
        const val = select?.value;

        if (val) {
          await sendProposal("role", val);
        }
      });
    });

    // GM Approve Buttons
    const approveBtns = root.querySelectorAll("[data-action='approve-proposal']");
    approveBtns.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const field = btn.dataset.field;
        const proposals = this.document.getFlag(MODULE_ID, "proposals") || {};
        const val = foundry.utils.getProperty(proposals, field) || proposals[field];

        if (val !== undefined) {
          const updateData = {};
          updateData[`system.${field}`] = val;

          await this.document.update(updateData);
          await this.document.unsetFlag(MODULE_ID, `proposals.${field}`);

          const victoryPointsMod = game.modules.get("coc-victory-points");
          if (victoryPointsMod?.active && victoryPointsMod.api) {
            if (typeof victoryPointsMod.api.addPoints === "function") {
              await victoryPointsMod.api.addPoints(1);
            }
          }

          ChatMessage.create({
            content: game.i18n.format("COC-CASE-FILES.ApprovedMessage", { field }),
            whisper: ChatMessage.getWhisperRecipients("GM")
          });

          this.render(false);
        }
      });
    });

    // GM Reject Buttons
    const rejectBtns = root.querySelectorAll("[data-action='reject-proposal']");
    rejectBtns.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const field = btn.dataset.field;

        await this.document.unsetFlag(MODULE_ID, `proposals.${field}`);
        ui.notifications.info(game.i18n.localize("COC-CASE-FILES.ProposalRejected"));
        this.render(false);
      });
    });
  }
}
