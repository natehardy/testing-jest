"use strict";

export const createRequestConstants = type => ({
    [`${type}_REQUEST`]: null,
    [`${type}_SUCCESS`]: null,
    [`${type}_FAILURE`]: null
});

export const createFetchConstants = type =>
    createRequestConstants(`FETCH_${type}`);

export const createRequestConstantsFromArray = types => {
    let constants = {};
    if (types && Array.isArray(types)) {
        types.forEach(type => {
            constants = { ...constants, ...createRequestConstants(type) };
        });
    }
    return constants;
};

export const createFetchEntityConstants = (type, pluralType) => {
    pluralType = pluralType || `${type}S`;
    return {
        ...createFetchConstants(pluralType),
        ...createFetchConstants(type)
    };
};

export const createEntityConstants = (type, pluralType) => {
    pluralType = pluralType || `${type}S`;
    const fetchConstants = createFetchEntityConstants(type, pluralType);
    return {
        ...fetchConstants,
        [`ALL_${pluralType}_ADDED`]: null,
        [`ALL_${pluralType}_REMOVED`]: null,
        [`${pluralType}_ADDED`]: null,
        [`${pluralType}_REMOVED`]: null,
        [`${type}_ADDED`]: null,
        [`${type}_REMOVED`]: null,
        /*[`SET_${type}_ACTIVE`]: null,
		[`SET_${pluralType}_ACTIVE`]: null,*/
        [`CREATE_${type}`]: null,
        [`UPDATE_${type}`]: null,
        [`${type}_UPDATED`]: null,
        [`NEW_${type}_CREATED`]: null
        //[`EDIT_${type}_NEXRAD_THRESHOLDS`]: null,
    };
};
