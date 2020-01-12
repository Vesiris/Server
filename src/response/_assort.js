"use strict";

require('../libs.js');

function getPath(id) {
    let assortPath = filepaths.user.profiles.assort[id];
    return assortPath.replace("__REPLACEME__", constants.getActiveID());
}

function findAndReturnChildren(assort, itemid) {
    let list = [];

    for (let childitem of assort.data.items) {
        if (childitem.parentId === itemid) {
            list.push.apply(list, findAndReturnChildren(assort, childitem._id));
        }
    }

    list.push(itemid);// it's required
    return list;
}

function removeItem(assort, id) {    
    let toDo = [id];

    // delete assort keys
    delete assort.data.barter_scheme[id];
    delete assort.data.loyal_level_items[id];

    // find and delete all related items
    if (toDo[0] !== undefined && toDo[0] !== null && toDo[0] !== "undefined") {
        let ids_toremove = findAndReturnChildren(assort, toDo[0]);

        for (let i in ids_toremove) {
            for (let a in assort.data.items) {
                if (assort.data.items[a]._id === ids_toremove[i]) {
                    assort.data.items.splice(a, 1);
                }
            }
        }

        return assort;
    } else {
        logger.logError("assort item id is not valid");
        return "BAD";
    }
}

function generate(id) {
    if (id === "579dc571d53a0658a154fbec") {
        return;
    }

    let base = json.parse(json.read(filepaths.user.cache["assort_" + id]));
    let keyNames = Object.keys(base.data.loyal_level_items);
    let level = trader.get(id).data.loyalty.currentLevel;

    logger.logWarning("level " + level);

    // 1 is min level, 4 is max level
    for (let i = 4; i > 0; i--) {
        for (let key in keyNames) {
            logger.logWarning("key level " + base.data.loyal_level_items[keyNames[key]]);

            if (base.data.loyal_level_items[keyNames[key]] > level) {
                logger.logError("removing item " + keyNames[key]);
                base = removeItem(base, keyNames[key]);
            }
        }
    }

    json.write(getPath(id), base);
}

function generateFence() {
    let base = json.parse(json.read("db/cache/assort.json"));
    let names = Object.keys(filepaths.assort.ragfair.loyal_level_items);
    let added = [];

    for (let i = 0; i < settings.gameplay.trading.fenceAssortSize; i++) {
        let id = names[utility.getRandomInt(0, names.length - 1)];

        added.push(id);
        base.data.items.push(json.parse(json.read(filepaths.assort.ragfair.items[id])));
        base.data.barter_scheme[id] = json.parse(json.read(filepaths.assort.ragfair.barter_scheme[id]));
        base.data.loyal_level_items[id] = json.parse(json.read(filepaths.assort.ragfair.loyal_level_items[id]));
    }

    return json.write(filepaths.user.profiles.assort["579dc571d53a0658a154fbec"], base);
}

function get(id) {
    // find the assort
    if (id === "579dc571d53a0658a154fbec") {
        generateFence();
    }

	if (filepaths.user.cache.hasOwnProperty("assort_" + id)) {
        return json.parse(json.read(getPath(id)));
    }
    
    // assort not found
    logger.logError("Couldn't find assort of ID " + trader);
    return {err: 999, errmsg: "Couldn't find assort of ID " + trader, data: null};
}

module.exports.get = get;
module.exports.generate = generate;