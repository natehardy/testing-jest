"use strict";

import { schema } from "normalizr";

export const createDefaultEntitySchema = pluralType => {
    return new schema.Entity(pluralType);
};

export const createDefaultEntitiesSchema = pluralType => {
    const entity = createDefaultEntitySchema(pluralType);
    return new schema.Array(entity);
};
