export class PersonnelFileSheet extends JournalPageSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["personnel-file-sheet"],
      template: "modules/coc-case-files/templates/personnel-file-view.hbs"
    });
  }

  /** @override */
  get template() {
    if (this.isEditable) return "modules/coc-case-files/templates/personnel-file-edit.hbs";
    return "modules/coc-case-files/templates/personnel-file-view.hbs";
  }

  /**
   * Helper to get a unique storage key for per-user local draft inputs.
   */
  #getDraftStorageKey(fieldKey) {
    return `coc-case-files-draft-${this.document.id}-${game.user.id}-${fieldKey}`;
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
    const proposals = doc.getFlag("coc-case-files", "proposals") || {};

    const fieldDefinitions = [
      { key: "fullName", label: game.i18n.localize("COC-CASE-FILES.FullName"), value: doc.system.fullName || "" },
      { key: "alias", label: game.i18n.localize("COC-CASE-FILES.Alias"), value: doc.system.alias || "" },
      { key: "gender", label: game.i18n.localize("COC-CASE-FILES.Gender"), value: doc.system.gender || "" },
      { key: "appearance.height", label: game.i18n.localize("COC-CASE-FILES.Height"), value: doc.system.appearance?.height || "" },
      { key: "appearance.build", label: game.i18n.localize("COC-CASE-FILES.Build"), value: doc.system.appearance?.build || "" },
      { key: "appearance.hair", label: game.i18n.localize("COC-CASE-FILES.Hair"), value: doc.system.appearance?.hair || "" },
      { key: "appearance.eyes", label: game.i18n.localize("COC-CASE-FILES.Eyes"), value: doc.system.appearance?.eyes || "" },
      { key: "appearance.marks", label: game.i18n.localize("COC-CASE-FILES.Marks"), value: doc.system.appearance?.marks || "" },
      { key: "address", label: game.i18n.localize("COC-CASE-FILES.Address"), value: doc.system.address || "" }
    ];

    const fields = fieldDefinitions.map(f => {
      const val = f.value.trim();
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

    if (this.isEditable) {
      context.editorContent = doc.system.description || "";
    } else {
      context.descriptionHTML = await TextEditor.enrichHTML(doc.system.description || "", {
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

    // Helper to send proposal and clear local draft
    const sendProposal = async (field, val) => {
      const currentVal = foundry.utils.getProperty(this.document.system, field);
      if (currentVal && currentVal.trim()) {
        ui.notifications.warn(game.i18n.localize("COC-CASE-FILES.FieldLockedWarn"));
        return;
      }

      if (this.document.isOwner || game.user.isGM) {
        await this.document.setFlag("coc-case-files", `proposals.${field}`, val);
      } else {
        game.socket.emit("module.coc-case-files", {
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
      input.addEventListener("input", () => {
        const field = input.dataset.field;
        if (field) {
          localStorage.setItem(this.#getDraftStorageKey(field), input.value);
        }
      });
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
        const proposals = this.document.getFlag("coc-case-files", "proposals") || {};
        const val = foundry.utils.getProperty(proposals, field) || proposals[field];

        if (val !== undefined) {
          const updateData = {};
          updateData[`system.${field}`] = val;

          // 1. Save directly to system data (locks the field)
          await this.document.update(updateData);

          // 2. Properly UNSET the flag in database
          await this.document.unsetFlag("coc-case-files", `proposals.${field}`);

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
        await this.document.unsetFlag("coc-case-files", `proposals.${field}`);

        ui.notifications.info(game.i18n.localize("COC-CASE-FILES.ProposalRejected"));

        // In-place re-render
        this.render(false);
      });
    });
  }
}
