import { PersonnelFileDataModel } from "./dataModels.js";
import { PersonnelFileSheet } from "./sheets.js";

Hooks.once("init", () => {
  console.log("coc-case-files | Initializing Call of Cthulhu Case Files Module");

  // Register Data Model for the Custom Journal Entry Page
  CONFIG.JournalEntryPage.dataModels["personnel-file"] = PersonnelFileDataModel;

  // Register the Sheet for the Custom Journal Entry Page
  DocumentSheetConfig.registerSheet(JournalEntryPage, "coc-case-files", PersonnelFileSheet, {
    types: ["personnel-file"],
    makeDefault: true,
    label: "COC-CASE-FILES.PageType"
  });
});
