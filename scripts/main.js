import { PersonnelFileDataModel } from "./dataModels.js";
import { PersonnelFileSheet } from "./sheets.js";

Hooks.once("init", () => {
  console.log("coc-case-files | Initializing Call of Cthulhu Case Files Module");

  const typeName = "coc-case-files.personnel-file";

  // Register Data Model for the Custom Journal Entry Page
  CONFIG.JournalEntryPage.dataModels[typeName] = PersonnelFileDataModel;
  CONFIG.JournalEntryPage.typeLabels[typeName] = "COC-CASE-FILES.PageType";
  CONFIG.JournalEntryPage.typeIcons[typeName] = "fas fa-user-secret";

  // Register the Sheet for the Custom Journal Entry Page
  DocumentSheetConfig.registerSheet(JournalEntryPage, "coc-case-files", PersonnelFileSheet, {
    types: [typeName],
    makeDefault: true,
    label: "COC-CASE-FILES.PageType"
  });
});
