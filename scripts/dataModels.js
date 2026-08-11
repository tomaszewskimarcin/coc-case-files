export class PersonnelFileDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { StringField, HTMLField, SchemaField } = foundry.data.fields;
    return {
      fullName: new StringField({ required: true, blank: true, initial: "" }),
      alias: new StringField({ required: true, blank: true, initial: "" }),
      gender: new StringField({ required: true, blank: true, initial: "" }),
      role: new StringField({ required: true, blank: true, initial: "" }),
      appearance: new SchemaField({
        height: new StringField({ required: true, blank: true, initial: "" }),
        build: new StringField({ required: true, blank: true, initial: "" }),
        hair: new StringField({ required: true, blank: true, initial: "" }),
        eyes: new StringField({ required: true, blank: true, initial: "" }),
        marks: new StringField({ required: true, blank: true, initial: "" })
      }),
      address: new StringField({ required: true, blank: true, initial: "" }),
      description: new HTMLField({ required: true, blank: true, initial: "" })
    };
  }
}
