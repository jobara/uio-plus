/*
 * Copyright The UIO+ copyright holders
 * See the AUTHORS.md file at the top-level directory of this distribution and at
 * https://github.com/fluid-project/uio-plus/blob/master/AUTHORS.md
 *
 * Licensed under the BSD 3-Clause License. You may not use this file except in
 * compliance with this license.
 *
 * You may obtain a copy of the license at
 * https://github.com/fluid-project/uio-plus/blob/master/LICENSE.txt
 */

/* eslint-env node */
/* global fluid, require */

"use strict";

var uioPlus = fluid.registerNamespace("uioPlus");
var chrome = chrome || fluid.require("sinon-chrome", require, "chrome");

fluid.defaults("uioPlus.chrome.contextMenuPanel", {
    gradeNames: ["fluid.modelComponent"],
    strings: {
        parent: "Preferences Quick Panel",
        reset: "Reset"
    },
    events: {
        afterContextMenuItemsCreated: null
    },
    listeners: {
        "onCreate.createContextMenuItems": "uioPlus.chrome.contextMenuPanel.createContextMenuItems"
    },
    invokers: {
        getSortedContextItems: {
            funcName: "uioPlus.chrome.contextMenuPanel.getSortedContextItems",
            args: ["{that}"]
        }
    },
    components: {
        "parent": {
            type: "uioPlus.chrome.contextItem",
            options: {
                contextProps: {
                    title: "{contextMenuPanel}.options.strings.parent"
                }
            }
        },
        "reset": {
            type: "uioPlus.chrome.contextItem.button",
            options: {
                priority: "after:parent",
                contextProps: {
                    title: "{contextMenuPanel}.options.strings.reset"
                }
            }
        }
    }
});

uioPlus.chrome.contextMenuPanel.getSortedContextItems = function (that, contextItemBaseGrade) {
    var contextMenuItemComponents = fluid.queryIoCSelector(that, contextItemBaseGrade || "uioPlus.chrome.contextItem", true);

    var components = {};
    fluid.each(contextMenuItemComponents, function (component) {
        var namespace = fluid.pathForComponent(component).pop();
        components[namespace] = {
            priority: fluid.get(component, ["options", "priority"]),
            component: component
        };
    });

    var sorted = fluid.parsePriorityRecords(components, "contextMenuItems");
    return fluid.getMembers(sorted, "component");
};

uioPlus.chrome.contextMenuPanel.createContextMenuItems = function (that) {
    var sequence = fluid.getMembers(that.getSortedContextItems(), "createPeerMenu");

    fluid.promise.sequence(sequence).then(that.events.afterContextMenuItemsCreated.fire);
};

fluid.defaults("uioPlus.chrome.contextItem", {
    gradeNames: ["fluid.component"],
    contextProps: {
        id: "{that}.id",
        title: "", // text to display in the menu
        contexts: ["browser_action"]
    },
    listeners: {
        "onDestroy.removeContextMenuItem": {
            funcName: "uioPlus.chrome.contextItem.callContextMenuAPI",
            args: ["remove", "{that}.options.contextProps.id"]
        }
    },
    invokers: {
        createPeerMenu: {
            funcName: "uioPlus.chrome.contextItem.callContextMenuAPI",
            args: ["create", "{that}.options.contextProps"]
        },
        updatePeerMenu: {
            funcName: "uioPlus.chrome.contextItem.callContextMenuAPI",
            args: ["update", "{that}.options.contextProps.id", "{arguments}.0"]
        }
    }
});

/**
 * Calls the Chrome Context Menu API.
 *
 * The first argument must be the name of the API Method to invoke. The remaining arguments will be passed along to the
 * API method. Please note that the call back should trigger the promise generated by this function. To facilitate this
 * a callback function must not be supplied.
 *
 * @return {Promise} a promise that is resolved when the method's callback function is fired
 */
uioPlus.chrome.contextItem.callContextMenuAPI = function () {
    var promise = fluid.promise();
    var args = fluid.makeArray(arguments);
    var method = args.shift();
    args.push(promise.resolve);

    chrome.contextMenus[method].apply(chrome.contextMenus, args);
    return promise;
};

fluid.defaults("uioPlus.chrome.contextItem.checkbox", {
    gradeNames: ["uioPlus.chrome.contextItem", "fluid.modelComponent"],
    contextProps: {
        type: "checkbox",
        checked: "{that}.model.value",
        onclick: "{that}.events.onClick.fire"
    },
    model: {
        value: false
    },
    events: {
        onClick: null
    },
    listeners: {
        "onClick.updateModel": {
            changePath: "value",
            value: "{arguments}.0.checked",
            source: "onClick"
        }
    },
    modelListeners: {
        "value": {
            funcName: "{that}.updatePeerMenu",
            args: [{checked: "{change}.value"}],
            excludeSource: ["init", "onClick"],
            namespace: "updateContextMenuItem"
        }
    }
});

fluid.defaults("uioPlus.chrome.contextItem.button", {
    gradeNames: ["uioPlus.chrome.contextItem"],
    contextProps: {
        onclick: "{that}.click"
    },
    invokers: {
        // must be supplied in a concrete implementation
        click: "fluid.notImplemented"
    }
});
