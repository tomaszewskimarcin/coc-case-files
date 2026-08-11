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

  /** @override */
  async getData(options = {}) {
    const context = await super.getData(options);
    context.roles = {
      suspect: game.i18n.localize("COC-CASE-FILES.Roles.suspect"),
      witness: game.i18n.localize("COC-CASE-FILES.Roles.witness"),
      victim: game.i18n.localize("COC-CASE-FILES.Roles.victim")
    };

    const doc = this.document;
    const isGM = game.user.isGM;
    const canPropose = doc.testUserPermission(game.user, "OBSERVER");
    const proposals = doc.getFlag("coc-case-files", "proposals") || {};

    const fields = [
      { key: "appearance.height", label: game.i18n.localize("COC-CASE-FILES.Height"), value: doc.system.appearance?.height || "", proposal: proposals["appearance.height"] },
      { key: "appearance.build", label: game.i18n.localize("COC-CASE-FILES.Build"), value: doc.system.appearance?.build || "", proposal: proposals["appearance.build"] },
      { key: "appearance.hair", label: game.i18n.localize("COC-CASE-FILES.Hair"), value: doc.system.appearance?.hair || "", proposal: proposals["appearance.hair"] },
      { key: "appearance.eyes", label: game.i18n.localize("COC-CASE-FILES.Eyes"), value: doc.system.appearance?.eyes || "", proposal: proposals["appearance.eyes"] },
      { key: "appearance.marks", label: game.i18n.localize("COC-CASE-FILES.Marks"), value: doc.system.appearance?.marks || "", proposal: proposals["appearance.marks"] },
      { key: "address", label: game.i18n.localize("COC-CASE-FILES.Address"), value: doc.system.address || "", proposal: proposals["address"] }
    ];

    context.isGM = isGM;
    context.canPropose = canPropose;
    context.fields = fields;

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

    // Player proposals listener
    const inputs = root.querySelectorAll ? root.querySelectorAll(".player-propose") : $(root).find(".player-propose");
    inputs.forEach?.(input => {
      const handler = async (ev) => {
        if (ev.type === "keydown" && ev.key !== "Enter") return;
        const val = input.value.trim();
        if (val) {
          const field = input.dataset.field;
          const proposals = foundry.utils.deepClone(this.document.getFlag("coc-case-files", "proposals") || {});
          proposals[field] = val;
          await this.document.setFlag("coc-case-files", "proposals", proposals);
          ui.notifications.info("Proposal submitted to the GM.");
        }
      };
      input.addEventListener("keydown", handler);
      input.addEventListener("blur", handler);
    });

    // GM Approve button listener
    const approveBtns = root.querySelectorAll ? root.querySelectorAll("[data-action='approve-proposal']") : $(root).find("[data-action='approve-proposal']");
    approveBtns.forEach?.(btn => {
      btn.addEventListener("click", async () => {
        const field = btn.dataset.field;
        const proposals = foundry.utils.deepClone(this.document.getFlag("coc-case-files", "proposals") || {});
        const val = proposals[field];

        if (val !== undefined) {
          const updateData = {};
          updateData[`system.${field}`] = val;
          await this.document.update(updateData);

          delete proposals[field];
          await this.document.setFlag("coc-case-files", "proposals", proposals);

          if (game.modules.get("coc-victory-points")?.active) {
            game.modules.get("coc-victory-points").api?.addPoints?.(1);
          }

          ChatMessage.create({
            content: game.i18n.format("COC-CASE-FILES.ApprovedMessage", { field }),
            whisper: ChatMessage.getWhisperRecipients("GM")
          });
        }
      });
    });

    // GM Reject button listener
    const rejectBtns = root.querySelectorAll ? root.querySelectorAll("[data-action='reject-proposal']") : $(root).find("[data-action='reject-proposal']");
    rejectBtns.forEach?.(btn => {
      btn.addEventListener("click", async () => {
        const field = btn.dataset.field;
        const proposals = foundry.utils.deepClone(this.document.getFlag("coc-case-files", "proposals") || {});

        if (proposals[field] !== undefined) {
          delete proposals[field];
          await this.document.setFlag("coc-case-files", "proposals", proposals);
          ui.notifications.info("Proposal rejected.");
        }
      });
    });
  }
}
