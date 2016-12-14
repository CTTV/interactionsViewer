import apijs from 'tnt.api';
import spinner from 'cttv.spinner';

import fetchData from './fetchData.js';

export default function () {

    let dispatch = d3.dispatch ("click", "dblclick", "mouseover", "mouseout", "load");

    // data is a promise
    // const data = http.get('/samples/DTNB_HUMAN-20-interactors.json');
    let config = {
        size: 500,
        labelSize: 100,
        // skip: 7,
        uniprotId: "P15056",
        proxy: undefined
    };
    let radius;
    let labels;

    const render = function (div) {
        if (!div) {
            console.error('No container DOM element provided');
            return;
        }

        // Add the spinner
        let sp = spinner()
            .size(30)
            .stroke(3);
        let spDiv = d3.select(div)
            .append("div");
        sp(spDiv.node());


        let graphSize = config.size - (config.labelSize * 2);
        radius = graphSize / 2;

        // svg
        const svg = d3.select(div)
            .append("div")
            .style("position", "relative")
            .append("svg")
            .attr("width", config.size)
            .attr("height", config.size);

        const graph = svg
            .append("g")
            .attr("transform", `translate(${radius + config.labelSize},${radius + config.labelSize})`);

        // Graph is a promise
        const graphPromise = fetchData(config);
        graphPromise.then(function (g) {
            // Remove the spinner
            spDiv.remove();

            update(g);
            dispatch.load(g);
        });

        function update(data = []) {
            // const stepRad = (360 / data.length);
            console.log(data);
            let stepRad = 360 / data.length;


            let currAngle = 0;

            for (let link of data) {
                // let {is_directed:isDirected, is_inhibition:isInhibition, is_stimulation:isStimulation, source, target} = link;

                link.angle = currAngle;
                currAngle += (stepRad * Math.PI / 180);
            }

            // Labels
            // Central
            // graph.append("g")
            //     .append("circle")
            //     .attr("cx", 0)
            //     .attr("cy", 0)
            //     .attr("r", 5)
            //     .attr("fill", "#005299");

            // All other labels
            labels = graph.selectAll(".openTargets_interactions_label")
                .data(data, d => d.label);

            labels
                .enter()
                .append("g")
                .attr("class", "openTargets_interactions_label")
                .attr("transform", (d) => {
                    const x = graphSize / 2 * Math.cos(d.angle);
                    const y = graphSize / 2 * Math.sin(d.angle);
                    return (`translate(${x},${y})`);
                })
                .on("mouseover", (d) => {
                    select(d);

                })
                .on("mouseout", (d) => {
                    unselect(d);
                })
                .on("click", function (d) {
                    dispatch.click.call(this, d);
                });

            labels
                .append("circle")
                .attr("fill", "#005299")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", 5);

            labels
                .append("text")
                .style("font-size", "12px")
                .style("text-anchor", (d) => {
                    let grades = d.angle * 180 / Math.PI;
                    if (grades % 360 > 90 && grades % 360 < 275) {
                        return "end";
                    }
                    return "start";
                })
                .text(d => d.label)
                .attr("alignment-baseline", "central")
                .attr("transform", (d) => {
                    let grades = d.angle * 180 / Math.PI;
                    if (grades % 360 > 90 && grades % 360 < 275) {
                        return `translate(${10 * Math.cos(d.angle)},${10 * Math.sin(d.angle)}) rotate(${grades % 360 + 180})`;
                    }
                    return `translate(${10 * Math.cos(d.angle)},${10 * Math.sin(d.angle)}) rotate(${grades % 360})`;
                });
            // .on("click", function (d) {
            //     dispatch.click.call(this, d);
            //     //tooltip.call(this, d, api);
            // });

            // links
            // We need a data structure with the angles.
            const k = new Map();
            for (let n of data) {
                k.set(n.label, n.angle);
            }
            labels
                .each(function (source) {
                    let fromAngle = source.angle;
                    for (let dest of source.interactsWith) {
                        let toAngle = k.get(dest);
                        let fromX = graphSize / 2 * Math.cos(fromAngle);
                        let fromY = graphSize / 2 * Math.sin(fromAngle);
                        let toX = graphSize / 2 * Math.cos(toAngle);
                        let toY = graphSize / 2 * Math.sin(toAngle);
                        graph.append("path")
                            .datum(source)
                            .attr("class", "openTargets_interactions_link")
                            .attr("d", `M${fromX},${fromY} Q0,0 ${toX},${toY}`)
                            .attr("fill", "none")
                            .attr("stroke", "#1e5799")
                            .attr("stroke-width", 1);
                    }
                });


            function unselect(d) {
                d3.selectAll(".openTargets_interactions_link")
                    .attr("opacity", 1);
                d3.selectAll(".openTargets_interactions_label")
                    .attr("opacity", 1);
            }

            function select(d) {
                // fade out other links
                d3.selectAll(".openTargets_interactions_link")
                    .attr("opacity", (data) => {
                        if (d.label === data.label) {
                            return 1;
                        }
                        return 0.05;
                    });

                // fade out the labels / nodes
                d3.selectAll(".openTargets_interactions_label")
                    .attr("opacity", (data) => {
                        if (d.label === data.label) {
                            return 1;
                        }
                        for (let inter of data.interactsWith) {
                            if (inter === d.label) {
                                return 1;
                            }
                        }
                        return 0.05;
                    });
            }

        }
    };

    apijs(render)
        .getset(config);

    return d3.rebind(render, dispatch, "on");
}
