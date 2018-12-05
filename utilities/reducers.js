"use strict";

import Constants from "../constants";
import { combineReducers } from "redux";
import { createSelector } from "reselect";

import invariant from "invariant";
import warning from "warning";

import _union from "lodash/union";
import _omit from "lodash/omit";
import _without from "lodash/without";
import _mergeWith from "lodash/mergeWith";
import _keyBy from "lodash/keyBy";

import {
    returnEmptyArray,
    returnEmptyObject,
    returnFalse,
    returnNull,
    returnTrue
} from "../../lib/base";

export const emptyReducer = (state, action = {}) => {
    switch (action.type) {
        default:
            return state;
    }
};

export function getNewState(config, state, action, callbackMap) {
    if (callbackMap[action.type]) {
        return callbackMap[action.type](config, state, action);
    }
    return state;
}

/**
 * @description All the following reducer creators are used for creating the entities Reducer
 */

/**
 *
 * @description Creates a map of id to entity to create a lookup table
 * @param config (Object)
 *
 */
export function createByIdReducer(config = {}) {
    const callbackMap = createByIdCallbackMap(config);
    return function byIdReducer(state = {}, action = {}) {
        return getNewState(config, state, action, callbackMap);
    };
}

export function createByIdCallbackMap({
    type,
    pluralType,
    byIdActionHandlers
} = {}) {
    pluralType = pluralType || `${type}S`;
    return {
        [Constants[
            `FETCH_${pluralType}_SUCCESS`
        ]]: successAndAddEntitiesByIdCallback,
        [Constants[
            `ALL_${pluralType}_ADDED`
        ]]: successAndAddEntitiesByIdCallback,
        [Constants[`${pluralType}_ADDED`]]: successAndAddEntitiesByIdCallback,
        [Constants[`FETCH_${type}_SUCCESS`]]: successAndAddEntityByIdCallback,
        [Constants[`${type}_ADDED`]]: successAndAddEntityByIdCallback,
        [Constants[`${pluralType}_REMOVED`]]: removeEntitiesByIdCallback,
        [Constants[`ALL_${pluralType}_REMOVED`]]: returnEmptyObject,
        [Constants[`${type}_REMOVED`]]: removeEntityByIdCallback,
        [Constants[`UPDATE_${type}`]]: updateEntityByIdCallback,
        [Constants[`${type}_UPDATED`]]: updateEntityByIdCallback,
        ...byIdActionHandlers
    };
}

export function successAndAddEntitiesByIdCallback(config, state, action) {
    let { type, pluralType, camelCaseType, camelCasePluralType } = config;
    pluralType = pluralType || `${type}S`;
    const payload = action.payload || {};

    let data = payload.data;
    if (payload.normalized) {
        data =
            payload.normalized.entities[
                payload.normalizedEntitiesKey || pluralType.toLowerCase()
            ];
        if (!data) {
            data =
                payload.normalized.entities[
                    camelCasePluralType || `${camelCaseType}s`
                ];
        }
        warning(
            camelCaseType || camelCasePluralType || pluralType,
            `camelCaseType, camelCasePluralType or pluralType needs to be passed in to properly access the data when 
            when the type is multi-word.
            pluralType: ${pluralType}, 
            camelCasePluralType: ${camelCasePluralType}, 
            camelCaseType: ${camelCaseType}`
        );
    }

    //if (payload.merge) {
    //console.log()
    return _mergeWith(
        _keyBy(state, "id"),
        _keyBy(data, "id"),
        function byIdReducerMergeCustomizer(objValue, srcValue) {
            if (Array.isArray(objValue)) {
                return objValue;
                //return _union(objValue, srcValue);
            }
        }
    );
    /*} else {
        return {
            ...state,
            ...data
        };
    }*/
}

export function successAndAddEntityByIdCallback(config, state, action) {
    const payload = action.payload || {};
    if (payload.normalized) {
        return successAndAddEntitiesByIdCallback(config, state, action);
    } else {
        return {
            ...state,
            [payload.data.id]: payload.data
        };
    }
}

export function removeEntitiesByIdCallback(config, state, action) {
    const payload = action.payload || {};
    if (payload.normalized) {
        return _omit(state, payload.data);
    } else {
        return _omit(state, Object.keys(payload.data));
    }
}

export function removeEntityByIdCallback(config, state, action) {
    const payload = action.payload || {};
    return _omit(state, payload.id);
}

export function updateEntityByIdCallback(config, state, { payload } = action) {
    let newState = { ...state };
    for (let prop in payload.data) {
        if (payload.data.hasOwnProperty(prop)) {
            newState[payload.id][prop.toString()] = payload.data[prop];
        }
    }
    return newState;
}

/**
 * @description provides a List of all the ids currently loaded for this entity type
 * @param {object} config
 *
 */
export function createAllIdsReducer(config = {}) {
    const callbackMap = createAllIdsCallbackMap(config);
    return function allIdsReducer(state = [], action = {}) {
        return getNewState(config, state, action, callbackMap);
    };
}

export function createAllIdsCallbackMap({
    type,
    pluralType,
    allIdsActionHandlers
} = {}) {
    pluralType = pluralType || `${type}S`;
    return {
        [Constants[
            `ALL_${pluralType}_ADDED`
        ]]: successAndAddEntitiesAllIdsCallback,
        [Constants[
            `FETCH_${pluralType}_SUCCESS`
        ]]: successAndAddEntitiesAllIdsCallback,
        [Constants[`${pluralType}_ADDED`]]: successAndAddEntitiesAllIdsCallback,
        [Constants[`FETCH_${type}_SUCCESS`]]: successAndAddEntityAllIdsCallback,
        [Constants[`${type}_ADDED`]]: successAndAddEntityAllIdsCallback,
        [Constants[`${pluralType}_REMOVED`]]: removeEntitiesAllIdsCallback,
        [Constants[`ALL_${type}S_REMOVED`]]: returnEmptyArray,
        [Constants[`${type}_REMOVED`]]: removeEntityAllIdsCallback,
        ...allIdsActionHandlers
    };
}

export function successAndAddEntitiesAllIdsCallback(config, state, action) {
    const payload = action.payload || {};
    if (payload.normalized) {
        const result = Array.isArray(payload.normalized.result)
            ? payload.normalized.result
            : [payload.normalized.result];
        return _union(state, result);
    } else {
        return [...state, ...Object.keys(payload.data)];
    }
}

export function successAndAddEntityAllIdsCallback(config, state, action) {
    const payload = action.payload || {};
    if (payload.normalized) {
        return successAndAddEntitiesAllIdsCallback(config, state, action);
    } else {
        return [...state, payload.data.id];
    }
}

export function removeEntitiesAllIdsCallback(config, state, action) {
    const payload = action.payload || {};
    // remove any entities in the list passed in
    return _without(state, Object.keys(payload.data));
}

export function removeEntityAllIdsCallback(config, state, action) {
    const payload = action.payload || {};
    return _without(state, payload.id);
}

/**
 * @Function
 * @description get all entities currently in the state
 * @param type
 * @returns {Array} Set of Entities
 */

export const getAllEntitiesByType = type => state =>
    state.common[type].allIds.map(id => state.common[type].byId[id]) || [];

/**
 * @Function
 * @description get all ids of entities currently in the state
 * @param pluralType
 * @returns {Array} Set of Entity ids
 */

export const getAllIdsForEntityByType = pluralType => state =>
    state.common[pluralType].allIds;

/**
 * @Function
 * @description creates a memoized selector (via reselect) to filter all entities
 *  by a certain property value
 * @param prop - Which property should be looked up
 * @param value - What property value should be filtered
 *
 */

export const getEntitiesByProperty = type => (prop, value) =>
    getImmutableEntitiesByProperty(getAllEntitiesByType(type), prop, value);

export const getEntityById = type => id => state => {
    invariant(state.common[type], `${type} doesn't exist in state.common`);
    invariant(
        state.common[type].byId,
        `${type}.byId doesn't exist in state.common.${type}`
    );
    return state.common[type].byId[id] || {};
};

export const getEntitiesByIds = type => ids => state => {
    invariant(state.common[type], `${type} doesn't exist in state.common`);
    invariant(
        state.common[type].byId,
        `${type}.byId doesn't exist in state.common.${type}`
    );
    invariant(ids, `no ids passed in to retrieve from state.common.${type}`);
    return ids.map(id => state.common[type].byId[id]) || [];
};

export const getEditedEntityById = type => id => state => {
    invariant(state.common[type], `${type} doesn't exist in state.common`);
    invariant(
        state.common[type].edited,
        `${type}.edited doesn't exist in state.common.${type}`
    );
    return state.common[type].edited[id] || {};
};

/**
 * @description Creates a Reducer to let us know when a request for the entities
 *              has been made and whether the request was successful or not
 * @param {object} config - type, pluralType, isFetchingEntitiesActionHandlers
 *
 */
export function createIsFetchingEntitiesReducer(config = {}) {
    const callbackMap = createIsFetchingEntitiesCallbackMap(config);
    return function isFetchingEntitiesReducer(state = false, action = {}) {
        return getNewState(config, state, action, callbackMap);
    };
}

function createIsFetchingEntitiesCallbackMap({
    type,
    pluralType,
    isFetchingEntitiesActionHandlers
} = {}) {
    invariant(
        type,
        "no type passed in for createIsFetchingEntitiesCallbackMap"
    );
    pluralType = pluralType || `${type}S`;
    return {
        [Constants[`FETCH_${pluralType}_REQUEST`]]: returnTrue,
        [Constants[`FETCH_${pluralType}_SUCCESS`]]: returnFalse,
        [Constants[`FETCH_${pluralType}_FAILURE`]]: returnFalse,
        ...isFetchingEntitiesActionHandlers
    };
}

/**
 * @description Creates a Reducer to let us know when a request for an entity
 *              has been made and whether the request was successful or not
 * @param {object} config - type, isFetchingEntityActionHandlers
 *
 */
export function createIsFetchingEntityReducer(config = {}) {
    const callbackMap = createIsFetchingEntityCallbackMap(config);
    return function isFetchingEntityReducer(state = [], action = {}) {
        return getNewState(config, state, action, callbackMap);
    };
}

function createIsFetchingEntityCallbackMap({
    type,
    isFetchingEntityActionHandlers
} = {}) {
    invariant(
        type,
        "no type passed in for createIsFetchingEntitiesCallbackMap"
    );
    return {
        [Constants[`FETCH_${type}_REQUEST`]]: requestStartedFunction,
        [Constants[`FETCH_${type}_SUCCESS`]]: requestCompleteFunction,
        [Constants[`FETCH_${type}_FAILURE`]]: requestCompleteFunction,
        ...isFetchingEntityActionHandlers
    };

    function requestStartedFunction(config, state, action) {
        let payload = action.payload || {};
        return [...state, payload.id];
    }

    function requestCompleteFunction(config, state, action) {
        let payload = action.payload || {};
        const id = String(
            (payload.data && payload.data.id) || payload.normalized.result
        );
        return _without(state, id);
    }
}

/**
 * @description Combines the createIsFetchingEntitiesReducer and the createIsFetchingEntityReducer
 *              into one reducer
 * @param {object} config - type, pluralType, isFetchingReducers, isFetchingEntitiesActionHandlers, isFetchingEntityActionHandlers
 *
 */
export function createIsFetchingReducer(config = {}) {
    return combineReducers({
        entities: createIsFetchingEntitiesReducer(config),
        entity: createIsFetchingEntityReducer(config),
        ...config.isFetchingReducers
    });
}

/**
 * @description Creates a Reducer to let us know if an entity is being edited currently or not
 * @param {object} config - type, isEditingEntityActionHandlers
 *
 */
export function createIsEditingEntityReducer(config = {}) {
    const callbackMap = createIsEditingEntityCallbackMap(config);
    return function isEditingEntityReducer(state = false, action = {}) {
        return getNewState(config, state, action, callbackMap);
    };
}

function createIsEditingEntityCallbackMap({
    type,
    isEditingEntityActionHandlers
} = {}) {
    return {
        [Constants[`IS_EDITING_${type}`]]: function(
            config,
            state,
            { payload } = action
        ) {
            return payload.isEditing;
        },
        [Constants[`TOGGLE_IS_EDITING_${type}`]]: function(
            config,
            state,
            action
        ) {
            return !state;
        },
        ...isEditingEntityActionHandlers
    };
}

/**
 * @description Creates a Reducer to let us know if an entity
 *              is active or not
 * @param {object} config - type, pluralType, defaultIsActiveState, isActiveActionHandlers
 *
 */

const defaultIsActiveState = {
    all: false
};

export function createIsActiveReducer(config = {}) {
    const { defaultState = defaultIsActiveState } = config;
    const callbackMap = createIsActiveCallbackMap(config);
    return function isActiveReducer(state = defaultState, action = {}) {
        return getNewState(config, state, action, callbackMap);
    };
}

function createIsActiveCallbackMap({
    type,
    pluralType,
    isActiveActionHandlers
} = {}) {
    pluralType = pluralType || `${type}S`;
    return {
        [Constants[`SET_${type}_ACTIVE`]]: function(
            config,
            state,
            { payload } = action
        ) {
            return {
                ...state,
                [payload.id]: payload.isActive
            };
        },
        [Constants[`SET_${pluralType || type + "S"}_ACTIVE`]]: function(
            config,
            state,
            { payload } = action
        ) {
            return {
                ...state,
                all: payload.isActive
            };
        },
        ...isActiveActionHandlers
    };
}

/**
 * @description Creates a Reducer to let us know id there are any error messages when a
 *              request is made for entities
 * @param {object} config - pluralType, entitiesErrorMessageActionHandlers
 *
 */

export function createEntitiesErrorMessageReducer(config = {}) {
    const callbackMap = createEntitiesErrorMessageCallbackMap(config);
    return function errorMessageReducer(state = null, action = {}) {
        return getNewState(config, state, action, callbackMap);
    };
}

function createEntitiesErrorMessageCallbackMap({
    type,
    pluralType,
    entitiesErrorMessageActionHandlers
} = {}) {
    pluralType = pluralType || `${type}S`;
    return {
        [Constants[`FETCH_${pluralType}_FAILURE`]]: function(
            config,
            state,
            { payload } = action
        ) {
            return payload.message;
        },
        [Constants[`FETCH_${pluralType}_REQUEST`]]: returnNull,
        [Constants[`FETCH_${pluralType}_SUCCESS`]]: returnNull,
        ...entitiesErrorMessageActionHandlers
    };
}

/**
 * @description Creates a Reducer to let us know id there are any error messages when
 *              a request is made for an entity
 * @param {object} config - type, entityErrorMessageActionHandlers
 *
 */

export function createEntityErrorMessageReducer(config = {}) {
    const callbackMap = createEntityErrorMessageCallbackMap(config);
    return function entityErrorMessageReducer(state = {}, action = {}) {
        return getNewState(config, state, action, callbackMap);
    };
}

function createEntityErrorMessageCallbackMap({
    type,
    entityErrorMessageHandlers
} = {}) {
    return {
        [Constants[`FETCH_${type}_REQUEST`]]: requestStartedFunction,
        [Constants[`FETCH_${type}_REQUEST`]]: requestCompleteFunction,
        [Constants[`FETCH_${type}_SUCCESS`]]: requestCompleteFunction,
        ...entityErrorMessageHandlers
    };

    function requestStartedFunction(config, state, { payload } = action) {
        return {
            ...state,
            [payload.id]: payload.message
        };
    }

    function requestCompleteFunction(config, state, { payload } = action) {
        const id = payload.data && payload.data.id;
        return _omit(state, id);
    }
}

/**
 * @description Combines the createEntitiesErrorMessageReducer and the createEntityErrorMessageReducer
 *              into one reducer
 * @param {object} config - type, pluralType
 *
 */
export function createErrorMessageReducer(config = {}) {
    let { type, pluralType } = config;
    pluralType = pluralType || `${type}S`;
    return combineReducers({
        [`${pluralType.toLowerCase()}`]: createEntitiesErrorMessageReducer(
            config
        ),
        [`${type.toLowerCase()}`]: createEntityErrorMessageReducer(config)
    });
}

/**
 * @description Combines the createByIdReducer, the createAllIdsReducer,
 *              createIsFetchingReducer and the createErrorMessageReducer
 *              into one reducer
 * @param {string} type
 * @param {string} pluralType
 * @param {string} camelCaseType
 * @param {string} camelCasePluralType
 * @param {object} byIdActionHandlers
 * @param {object} allIdsActionHandlers
 * @param {object} isFetchingActionHandlers
 * @param {object} isFetchingReducers
 * @param {object} errorMessageActionHandlers
 *
 */

export const createEntitiesReducers = ({
    type,
    pluralType,
    camelCaseType,
    camelCasePluralType,
    byIdActionHandlers,
    allIdsActionHandlers,
    isFetchingActionHandlers,
    isFetchingReducers,
    errorMessageActionHandlers
}) => {
    const byId = createByIdReducer({
        type,
        pluralType,
        camelCaseType,
        camelCasePluralType,
        byIdActionHandlers
    });
    const allIds = createAllIdsReducer({
        type,
        pluralType,
        allIdsActionHandlers
    });
    const isFetching = createIsFetchingReducer({
        type,
        pluralType,
        isFetchingActionHandlers,
        isFetchingReducers
    });
    const errors = createErrorMessageReducer({
        type,
        pluralType,
        errorMessageActionHandlers
    });

    return {
        allIds,
        byId,
        isFetching,
        errors
    };
};

/* Selectors */

/**
 * @Function
 * @description creates a memoized selector (via reselect) to filter all entities
 *  in an immutable collection by a certain property value
 * @param entitiesSelector - returns an Immutable collection of all entities to be filtered
 * @param prop - Which property should be looked up
 * @param value - what property value should be filtered
 * @returns Function - selector that accepts redux state as an argument
 *
 */

export const getImmutableEntitiesByProperty = (entitiesSelector, prop, value) =>
    createSelector(entitiesSelector, function(entities) {
        return entities.filter(function(entity) {
            return (
                entity &&
                entity[prop] &&
                entity[prop].toLowerCase() == value.toLowerCase()
            );
        });
    });

/**
 * @Function
 * @description creates a memoized selector (via reselect) to return all entities
 * @param entitiesSelector - returns an array of all entities
 * @returns Function - selector that accepts redux state as an argument
 *
 */

export const getAllImmutableEntities = entitiesSelector =>
    createSelector(entitiesSelector, entities => entities);

export function areEntitiesActive(entityName) {
    return function(state) {
        return state.common[entityName].isActive.all;
    };
}

export function isEntityActive(entityName) {
    return function(id) {
        return function(state) {
            return state.common[entityName].isActive[id];
        };
    };
}
