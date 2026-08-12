import { MODULE_ID, DEFAULT_FIELDS_CONFIG } from "./main.js";

const ParentJournalPageSheet = foundry.appv1?.sheets?.JournalPageSheet || JournalPageSheet;
const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation || TextEditor;

export class PersonnelFileSheet extends ParentJournalPageSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["personnel-file-sheet"],
      template: `modules/${MODULE_ID}/templates/personnel-file-view.hbs`
    });
  }

  /** @override */
  get template() {
    if (this.isEditable) return `modules/${MODULE_ID}/templates/personnel-file-edit.hbs`;
    return `modules/${MODULE_ID}/templates/personnel-file-view.hbs`;
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

  /** @override */
  async getData(options = {}) {
    const context = await super.getData(options);
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

    // Read Fields Config (Schema)
    const configuredFields = game.settings.get(MODULE_ID, "fieldsConfig") || DEFAULT_FIELDS_CONFIG;

    const fields = configuredFields
      .filter(f => f.enabled !== false)
      .map(f => {
        let rawVal = "";
        if (f.isCustom) {
          rawVal = doc.system?.customData?.[f.key] ?? "";
        } else {
          rawVal = foundry.utils.getProperty(doc.system, f.key) ?? "";
        }

        const val = (rawVal ?? "").toString().trim();
        const isLocked = Boolean(val);
        const rawProp = foundry.utils.getProperty(proposals, f.key) || proposals[f.key] || null;
        const draftVal = localStorage.getItem(this.#getDraftStorageKey(f.key)) || "";

        const type = f.type || "text";
        const optionsList = Array.isArray(f.options) ? f.options : [];

        return {
          key: f.key,
          label: f.label,
          type: type,
          isSelect: type === "select",
          isNumber: type === "number",
          isDate: type === "date",
          isTextarea: type === "textarea",
          isText: type === "text",
          options: optionsList,
          value: val,
          isLocked: isLocked,
          proposal: isLocked ? null : rawProp,
          draft: draftVal,
          allowProposals: f.allowProposals !== false,
          isCustom: Boolean(f.isCustom)
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

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    const root = html[0] || html;

    // Player Notepad auto-save
    const notepad = root.querySelector ? root.querySelector(".player-notepad") : $(root).find(".player-notepad")[0];
    notepad?.addEventListener("input", () => {
      localStorage.setItem(this.#getNotepadStorageKey(), notepad.value);
    });

    // Helper to send proposal and clear local draft
    const sendProposal = async (field, val) => {
      let currentVal = "";
      if (field.startsWith("custom_")) {
        currentVal = this.document.system?.customData?.[field] ?? "";
      } else {
        currentVal = foundry.utils.getProperty(this.document.system, field);
      }

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

    // Auto-save player draft to localStorage as they type or select
    const draftInputs = root.querySelectorAll ? root.querySelectorAll(".player-draft-input") : $(root).find(".player-draft-input");
    draftInputs.forEach?.(input => {
      const handler = () => {
        const field = input.dataset.field;
        if (field) {
          localStorage.setItem(this.#getDraftStorageKey(field), input.value);
        }
      };
      input.addEventListener("input", handler);
      input.addEventListener("change", handler);
    });

    // Auto-save role draft to localStorage
    const roleSelect = root.querySelector ? root.querySelector(".role-draft-select") : $(root).find(".role-draft-select")[0];
    roleSelect?.addEventListener("change", () => {
      if (roleSelect.value) {
        localStorage.setItem(this.#getDraftStorageKey("role"), roleSelect.value);
      }
    });

    // Explicit Submit Proposal Button Listener (Draft workflow)
    const submitBtns = root.querySelectorAll ? root.querySelectorAll("[data-action='submit-proposal']") : $(root).find("[data-action='submit-proposal']");
    submitBtns.forEach?.(btn => {
      btn.addEventListener("click", async () => {
        const field = btn.dataset.field;
        const row = btn.closest(".dossier-field-row");
        const input = row?.querySelector(".player-draft-input");
        const val = input?.value.trim();

        if (val) {
          await sendProposal(field, val);
        }
      });
    });

    // Explicit Submit Role Proposal Listener
    const submitRoleBtns = root.querySelectorAll ? root.querySelectorAll("[data-action='submit-role-proposal']") : $(root).find("[data-action='submit-role-proposal']");
    submitRoleBtns.forEach?.(btn => {
      btn.addEventListener("click", async () => {
        const select = root.querySelector(".role-draft-select");
        const val = select?.value;

        if (val) {
          await sendProposal("role", val);
        }
      });
    });

    // GM Approve button listener
    const approveBtns = root.querySelectorAll ? root.querySelectorAll("[data-action='approve-proposal']") : $(root).find("[data-action='approve-proposal']");
    approveBtns.forEach?.(btn => {
      btn.addEventListener("click", async () => {
        const field = btn.dataset.field;
        const proposals = this.document.getFlag(MODULE_ID, "proposals") || {};
        const val = foundry.utils.getProperty(proposals, field) || proposals[field];

        if (val !== undefined) {
          const updateData = {};
          if (field.startsWith("custom_")) {
            updateData[`system.customData.${field}`] = val;
          } else {
            updateData[`system.${field}`] = val;
          }

          // 1. Save directly to system data (locks the field)
          await this.document.update(updateData);

          // 2. Properly UNSET the flag in database
          await this.document.unsetFlag(MODULE_ID, `proposals.${field}`);

          // 3. Award Chaos Point via async API call if coc-victory-points module is active
          const victoryPointsMod = game.modules.get("coc-victory-points");
          if (victoryPointsMod?.active && victoryPointsMod.api) {
            if (typeof victoryPointsMod.api.addPoints === "function") {
              await victoryPointsMod.api.addPoints(1);
            }
          }

          // 4. Chat announcement
          ChatMessage.create({
            content: game.i18n.format("COC-CASE-FILES.ApprovedMessage", { field }),
            whisper: ChatMessage.getWhisperRecipients("GM")
          });

          // 5. In-place re-render to reflect database state
          this.render(false);
        }
      });
    });

    // GM Reject button listener
    const rejectBtns = root.querySelectorAll ? root.querySelectorAll("[data-action='reject-proposal']") : $(root).find("[data-action='reject-proposal']");
    rejectBtns.forEach?.(btn => {
      btn.addEventListener("click", async () => {
        const field = btn.dataset.field;

        // Properly UNSET the flag in database
        await this.document.unsetFlag(MODULE_ID, `proposals.${field}`);

        ui.notifications.info(game.i18n.localize("COC-CASE-FILES.ProposalRejected"));

        // In-place re-render
        this.render(false);
      });
    });
  }
}
