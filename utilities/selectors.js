"use strict";

import invariant from "invariant";

export const createByIdSelectors = (type, pluralType) => {};

export const getAllEntities = type => state =>
    state.common[type].allIds.map(id => state.common[type].byId[id]) || [];

export const getEntityByIdMap = type => state => state.common[type].byId;

export const getAllDataSourceEntities = type => state =>
    state.common.data_sources[type].allIds.map(
        id => state.common.data_sources[type].byId[id]
    ) || [];

const _createIsFetchingSelectors = getIsFetching => {
    const getIsFetchingEntities = state => getIsFetching(state).entities;
    const getIsFetchingEntity = state => getIsFetching(state).entity;

    return {
        getIsFetchingEntities,
        getIsFetchingEntity
    };
};

export const getIsFetchingEntities = pluralType => state => {
    invariant(
        state.common[pluralType.toLowerCase()] &&
            state.common[pluralType.toLowerCase()].isFetching,
        `${pluralType.toLowerCase()} doesn't exist in state.common`
    );
    return state.common[pluralType.toLowerCase()].isFetching.entities;
};

export const getIsFetchingEntity = type => id => state => {
    invariant(
        state.common[type.toLowerCase()] &&
            state.common[type.toLowerCase()].isFetching,
        `${type.toLowerCase()} doesn't exist in state.common`
    );
    return state.common[type.toLowerCase()].isFetching.entity.indexOf(id) != -1;
};

export const getIsFetchingEvent = type => id => state => {
    invariant(
        state.common.events[type.toLowerCase()] &&
            state.common.events[type.toLowerCase()].isFetching,
        `${type.toLowerCase()} doesn't exist in state.common.event`
    );
    return (
        state.common.events[type.toLowerCase()].isFetching.entity.indexOf(id) !=
        -1
    );
};

export const createIsFetchingDatasourceSelectors = (type, pluralType) => {
    pluralType = pluralType || `${type}S`;
    const getIsFetching = state =>
        state.common.data_sources[pluralType.toLowerCase()].isFetching;
    return _createIsFetchingSelectors(getIsFetching);
};

export const createErrorMessageSelectors = (type, pluralType) => {};
