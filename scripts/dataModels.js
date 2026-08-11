const { StringField, HTMLField, SchemaField } = foundry.data.fields;

export class PersonnelFileDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
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
