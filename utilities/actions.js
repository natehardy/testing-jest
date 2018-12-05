"use strict";

import api, {
    createFormDataFromObject,
    fetchEntities,
    fetchEntity,
    legacyApi
} from "api";
import { normalize } from "normalizr";
import invariant from "invariant";
import warning from "warning";

import _omit from "lodash/omit";

import Constants, { constantsMapping } from "../constants";
import {
    createDefaultEntitiesSchema,
    createDefaultEntitySchema
} from "./schema";
import { openConfirmDialog } from "data/redux_ui/common/components/dialog/actions";
import { openSnackbar } from "data/redux_ui/common/components/snackbar/actions";
import { gotoRoute } from "routes";
import { removeValidationErrors } from "data/redux_errors/actions";
import { ValidationTypes } from "data/redux_errors/constants";

/*
 * action creators
 */

export function dispatchAction(dispatch, type, payload) {
    return dispatch({
        type,
        payload
    });
}

const checkParams = params => {
    for (let param in params) {
        if (params.hasOwnProperty(param)) {
            if (params[param] === undefined || params[param] == null) {
                console.warn(
                    `${param} has a null or undefined value in "createRequestAction" form ${
                        params.type
                    }.`
                );
            }
        }
    }
};

/**
 * @Function
 * @description Sets functions for the requestConfig passed into "createRequestAction"
 *  if they aren't specified.
 * @param configObj
 */
const getRequestConfig = (configObj = {}) => {
    configObj.requestFunction =
        configObj.requestFunction ||
        invariant(configObj.requestFunction, "no request Function specified");
    return configObj;
};

/**
 * @Function
 * @description Sets functions for the actionCreatorConfig passed into "createRequestAction"
 *  if they aren't specified.
 * @param configObj
 */
const getActionCreatorConfig = (configObj = {}) => {
    configObj.createRequestPayload =
        configObj.createRequestPayload ||
        (() => ({
            data: true
        }));
    configObj.createSuccessPayload =
        configObj.createSuccessPayload ||
        (data => ({
            data
        }));
    configObj.createErrorPayload =
        configObj.createErrorPayload ||
        (err => ({
            message: err.message || "Something went wrong"
        }));

    return configObj;
};

/**
 * @Function
 * @description Creates a thunk to dispatch an action before the request is made and then
 *  either am onSuccess action or onFailure action when the request has completed.
 * @param actionCreatorConfig
 * @param requestConfig
 */

export const createRequestAction = ({
    actionCreatorConfig,
    requestConfig
}) => dispatch => {
    actionCreatorConfig = getActionCreatorConfig(actionCreatorConfig);
    requestConfig = getRequestConfig(requestConfig);

    const {
        type,
        createRequestPayload,
        createSuccessPayload,
        createErrorPayload
    } = actionCreatorConfig;
    const {
        requestFunction,
        dispatchActionsOnSuccess = function() {},
        dispatchActionsOnError
    } = requestConfig;

    invariant(
        Constants[`${type}_REQUEST`],
        `There was no ${type}_REQUEST constant created`
    );
    dispatch({
        type: Constants[`${type}_REQUEST`],
        payload: createRequestPayload()
    });

    requestFunction().then(
        function onRequestSuccess(response) {
            let payload = createSuccessPayload(response);
            if (!response.failure) {
                invariant(
                    Constants[`${type}_SUCCESS`],
                    `There was no ${type}_SUCCESS constant created`
                );
                dispatch({
                    type: Constants[`${type}_SUCCESS`],
                    payload
                });
                dispatchActionsOnSuccess(dispatch, response, payload);
                dispatchChildEntitiesAdded(dispatch, response, requestConfig);
            } else {
                console.warn(response.failure);
            }
        },
        function onRequestError(error) {
            let payload = createErrorPayload(error);
            invariant(
                Constants[`${type}_FAILURE`],
                `There was no ${type}_FAILURE constant created`
            );
            dispatch({
                type: Constants[`${type}_FAILURE`],
                payload
            });
            if (dispatchActionsOnError) {
                dispatchActionsOnError(dispatch, error, payload);
            }
        }
    );
};

function dispatchChildEntitiesAdded(dispatch, response, { schema = {} }) {
    // for all nested entities, normalize them and add them to the store.
    // to make sure they are available to the entity just added.
    schema.schema &&
        Object.keys(schema.schema).forEach(function(entityName) {
            warning(
                constantsMapping[entityName],
                `No entry exists in the entityMapping for ${entityName}. We will use the entity name (${entityName.toUpperCase()}) as a default`
            );
            const action = constantsMapping[entityName]
                ? `${constantsMapping[entityName]}_ADDED`
                : `${entityName.toUpperCase()}_ADDED`;
            if (response[entityName]) {
                dispatch({
                    type: action,
                    payload: {
                        normalized: normalize(
                            response[entityName],
                            schema.schema[entityName]
                        ),
                        normalizedEntitiesKey: entityName
                    }
                });
            }
        });
}

/**
 * @Function
 * @description Adds "FETCH" to beginning of the type and then calls "createRequestAction".
 * @param actionCreatorConfig
 * @param requestConfig
 */

export function createLoadAction({ actionCreatorConfig, requestConfig }) {
    return createRequestAction({
        actionCreatorConfig: {
            ...actionCreatorConfig,
            type: `FETCH_${actionCreatorConfig.type}`
        },
        requestConfig
    });
}

export function createLoadEntitiesAction({
    type: pluralType,
    entityName,
    queryParams,
    schema,
    extraPayload = {},
    legacyParams,
    dataTransformFunction,
    dispatchActionsOnSuccess
}) {
    schema = schema || createDefaultEntitiesSchema(pluralType.toLowerCase());
    return createLoadAction({
        actionCreatorConfig: {
            type: pluralType,
            createSuccessPayload: data => {
                if (dataTransformFunction) {
                    data = dataTransformFunction(data);
                }
                return {
                    ...extraPayload,
                    normalized: normalize(data, schema)
                };
            }
        },
        requestConfig: {
            requestFunction: () =>
                fetchEntities(entityName, queryParams, legacyParams),
            dispatchActionsOnSuccess
        }
    });
}

export function createLoadEntityAction({
    type,
    pluralType,
    customActionType,
    entityName,
    id,
    queryParams,
    schema,
    extraPayload = {},
    legacyParams,
    dataTransformFunction,
    extraPropertiesMap,
    dispatchActionsOnSuccess
}) {
    pluralType = pluralType || `${type}S`;
    schema = schema || createDefaultEntitySchema(pluralType.toLowerCase());
    return createLoadAction({
        actionCreatorConfig: {
            type: customActionType || type,
            createRequestPayload: () => ({
                id: String(id)
            }),
            createSuccessPayload: data => {
                // we first process any data transformation
                // and then process permissions data
                if (dataTransformFunction) {
                    data = dataTransformFunction(data);
                }
                if (extraPropertiesMap) {
                    const extraProperties = getExtraProperties({
                        data,
                        extraPropertiesMap
                    });
                    data.actionManagement = extraProperties.actionManagement;
                    data.secondaryProperties =
                        extraProperties.secondaryPropertiesMap;
                }
                return {
                    ...extraPayload,
                    normalized: normalize(data, schema)
                };
            }
        },
        requestConfig: {
            schema,
            requestFunction: () =>
                fetchEntity(entityName, id, queryParams, legacyParams),
            dispatchActionsOnSuccess
        }
    });
}

/*
* Until we separate permission from the data, we create a separate permissions object
* so that when we normalize the data, the permissions data gets saved for the entity*/
export function getExtraProperties({
    data = [],
    extraPropertiesMap = {
        permissionActionProperties: [],
        secondaryProperties: []
    }
}) {
    let actionManagement = {};
    let secondaryPropertiesMap = {};
    Object.keys(extraPropertiesMap).forEach(function(entityKey) {
        const value = extraPropertiesMap[entityKey];
        actionManagement[entityKey] = {};
        secondaryPropertiesMap[entityKey] = {};
        if (value.type != "singleton") {
            data[entityKey] = data[entityKey].map(function(entity) {
                if (value.permissionActionProperties) {
                    value.permissionActionProperties.forEach(function(
                        actionName
                    ) {
                        actionManagement[entityKey][entity.id] = {
                            [actionName]: entity[actionName]
                        };
                        entity = _omit(entity, actionName);
                    });
                }
                if (value.secondaryProperties) {
                    value.secondaryProperties.forEach(function(propertyName) {
                        secondaryPropertiesMap[entityKey][entity.id] = {
                            [propertyName]: entity[propertyName]
                        };
                        entity = _omit(entity, propertyName);
                    });
                }
                return entity;
            });
        } else {
            value.permissionActionProperties.forEach(function(actionName) {
                actionManagement[entityKey][data[entityKey].id] = {
                    [actionName]: true
                };
            });
            value.secondaryProperties.forEach(function(propertyName) {
                secondaryPropertiesMap[entityKey][data[entityKey].id] = {
                    [propertyName]: data[entityKey][propertyName]
                };
            });
        }
    });
    return { actionManagement, secondaryPropertiesMap };
}

export function deleteEntityById({
    title = "Delete Entity",
    confirmMessage = "Are you sure you want to delete this entity",
    ...config
}) {
    return function deleteEntityByIdThunk(dispatch) {
        dispatch(
            openConfirmDialog({
                title,
                onSubmitHandler() {
                    dispatch(
                        submitDeleteEntity({
                            ...config
                        })
                    );
                },
                msg: confirmMessage
            })
        );
    };
}

function submitDeleteEntity({
    args,
    type,
    beforeSubmitMessage = "Deleting Entity",
    afterSubmitMessage = "Successfully Deleted Entity",
    apiUrl = `../api/${type.toLowerCase()}/${args.id}`,
    legacyParams,
    navigationUrl = ``,
    submitHandler = function(response) {},
    errorHandler = function(err) {}
}) {
    return function submitDeleteEntityThunk(dispatch) {
        // Optimistically delete entity
        dispatch({
            type: Constants[`${type}_REMOVED`],
            payload: {
                ...args
            }
        });
        gotoRoute({
            dispatch,
            route: navigationUrl
        });
        dispatch(
            openSnackbar({
                message: beforeSubmitMessage
            })
        );

        let request = null;
        if (legacyParams) {
            request = legacyApi(legacyParams);
        } else {
            let formData = createFormDataFromObject(args);
            request = api(apiUrl, {
                method: "DELETE",
                body: formData,
                iframe: true
            });
        }
        request
            .then(response => {
                submitHandler(response);
                dispatch(
                    openSnackbar({
                        message: afterSubmitMessage
                    })
                );
            })
            .catch(function(err) {
                console.warn(err);
                errorHandler(err);
            });
    };
}

export function cancelUpdateEntity(validationType, route) {
    return function(dispatch) {
        dispatch(removeValidationErrors(validationType));
        gotoRoute({
            dispatch,
            route
        });
    };
}
