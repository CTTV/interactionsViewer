import httppleaseRaw from 'httpplease';
import json from 'httpplease/plugins/json';
const httpplease = httppleaseRaw.use(json);
import promises from 'httpplease-promises';
import Promise from 'bluebird';
const http = httpplease.use(promises(Promise));


export default function ({uniprotId, proxy='http://'}) {
    const urlR = `${proxy}www.omnipathdb.org/interactions/${uniprotId}?format=json`;
    console.log(urlR);
    return http.get(urlR)
        .then(resp => {
            let proteinSet = new Set();
            for (let {source, target} of resp.body) {
                proteinSet.add(source);
                proteinSet.add(target);
            }
            proteinSet.delete(uniprotId);
            const urlR2 = `/proxy/www.omnipathdb.org/interactions/${Array.from(proteinSet).join(",")}?format=json`;
            return http.get(urlR2);
        })
        .then(resp => {
            let data = resp.body;
            let filtered = {};

            // First pass -- get all uniprot Ids associated with our protein
            let interactors = new Set();
            for (let link of data) {
                let {source, target} = link;
                if (source === uniprotId) {
                    interactors.add(target);
                }
                if (target === uniprotId) {
                    interactors.add(source);
                }
            }

            for (let interactor of interactors) {
                filtered[interactor] = {
                    label: interactor,
                    interactsWith: new Set()
                }
            }

            for (let link of data) {
                let {source, target} = link;
                if (interactors.has(source) && interactors.has(target)) {
                    if ((source !== uniprotId) && (target !== uniprotId)) {
                        filtered[source].interactsWith.add(target);
                        filtered[target].interactsWith.add(source); // TODO: For now this gets duplicated.
                    }
                }
            }

            // Return the array
            return Object.keys(filtered).map((k) => filtered[k])

        });

    // const url = '/samples/P15056_omnipath-interactors.json';
    // return http.get(url)
    //     .then(function (resp) {
    //         let data = resp.body;
    //
    //         let filtered = {};
    //
    //         // First pass -- get all uniprot Ids associated with our protein
    //         let interactors = new Set();
    //         for (let link of data) {
    //             let {source, target} = link;
    //             if (source === uniprotId) {
    //                 interactors.add(target);
    //             }
    //             if (target === uniprotId) {
    //                 interactors.add(source);
    //             }
    //         }
    //
    //         for (let interactor of interactors) {
    //             filtered[interactor] = {
    //                 label: interactor,
    //                 interactsWith: new Set()
    //             }
    //         }
    //
    //         for (let link of data) {
    //             let {source, target} = link;
    //             if (interactors.has(source) && interactors.has(target)) {
    //                 if ((source !== uniprotId) && (target !== uniprotId)) {
    //                     filtered[source].interactsWith.add(target);
    //                     filtered[target].interactsWith.add(source); // TODO: For now this gets duplicated.
    //                 }
    //             }
    //         }
    //
    //         // Return the array
    //         return Object.keys(filtered).map((k) => filtered[k])
    //     })
};
