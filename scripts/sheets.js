export class PersonnelFileSheet extends foundry.applications.api.DocumentSheetV2 {
  /** @override */
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["personnel-file-sheet"],
    actions: {
      "approve-proposal": PersonnelFileSheet.#onApproveProposal,
      "reject-proposal": PersonnelFileSheet.#onRejectProposal
    }
  }, { inplace: false });

  /** @override */
  static PARTS = {
    ...super.PARTS, // Keep whatever parts JournalPageSheet defines for its shell
    edit: {
      template: "modules/coc-case-files/templates/personnel-file-edit.hbs"
    },
    view: {
      template: "modules/coc-case-files/templates/personnel-file-view.hbs"
    }
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    // Determine which mode we are in
    if ( this.isEditable ) {
      options.parts = ["edit"];
    } else {
      options.parts = ["view"];
    }
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.roles = {
      suspect: game.i18n.localize("COC-CASE-FILES.Roles.suspect"),
      witness: game.i18n.localize("COC-CASE-FILES.Roles.witness"),
      victim: game.i18n.localize("COC-CASE-FILES.Roles.victim")
    };
    
    // For view part
    const doc = this.document;
    const isGM = game.user.isGM;
    const canPropose = doc.testUserPermission(game.user, "OBSERVER");
    const proposals = doc.getFlag("coc-case-files", "proposals") || {};

    const fields = [
      { key: "appearance.height", label: game.i18n.localize("COC-CASE-FILES.Height"), value: doc.system.appearance.height, proposal: proposals["appearance.height"] },
      { key: "appearance.build", label: game.i18n.localize("COC-CASE-FILES.Build"), value: doc.system.appearance.build, proposal: proposals["appearance.build"] },
      { key: "appearance.hair", label: game.i18n.localize("COC-CASE-FILES.Hair"), value: doc.system.appearance.hair, proposal: proposals["appearance.hair"] },
      { key: "appearance.eyes", label: game.i18n.localize("COC-CASE-FILES.Eyes"), value: doc.system.appearance.eyes, proposal: proposals["appearance.eyes"] },
      { key: "appearance.marks", label: game.i18n.localize("COC-CASE-FILES.Marks"), value: doc.system.appearance.marks, proposal: proposals["appearance.marks"] },
      { key: "address", label: game.i18n.localize("COC-CASE-FILES.Address"), value: doc.system.address, proposal: proposals["address"] }
    ];

    context.isGM = isGM;
    context.canPropose = canPropose;
    context.fields = fields;

    // Enrich description
    if (this.isEditable) {
        context.editorContent = context.document.system.description;
    } else {
        context.document.system.description = await TextEditor.enrichHTML(doc.system.description, {
            secrets: doc.isOwner,
            async: true
        });
    }

    return context;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;
    
    // Attach listener for player proposals on enter key or blur
    const inputs = html.querySelectorAll(".player-propose");
    inputs.forEach(input => {
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
  }

  static async #onApproveProposal(event, target) {
    const field = target.dataset.field;
    const doc = this.document;
    const proposals = foundry.utils.deepClone(doc.getFlag("coc-case-files", "proposals") || {});
    const val = proposals[field];

    if (val !== undefined) {
      // Update data
      const updateData = {};
      updateData[`system.${field}`] = val;
      await doc.update(updateData);
      
      // Remove proposal
      delete proposals[field];
      await doc.setFlag("coc-case-files", "proposals", proposals);

      // Award points
      if (game.modules.get("coc-victory-points")?.active) {
        if (typeof game.modules.get("coc-victory-points").api?.addPoints === "function") {
          game.modules.get("coc-victory-points").api.addPoints(1);
        }
      }

      const msg = game.i18n.format("COC-CASE-FILES.ApprovedMessage", { field: field });
      ChatMessage.create({
        content: msg,
        whisper: ChatMessage.getWhisperRecipients("GM")
      });
    }
  }

  static async #onRejectProposal(event, target) {
    const field = target.dataset.field;
    const doc = this.document;
    const proposals = foundry.utils.deepClone(doc.getFlag("coc-case-files", "proposals") || {});
    
    if (proposals[field] !== undefined) {
      delete proposals[field];
      await doc.setFlag("coc-case-files", "proposals", proposals);
      ui.notifications.info("Proposal rejected.");
    }
  }
}
