import apijs from 'tnt.api';


export default function () {

    let dispatch = d3.dispatch ("click", "dblclick", "mouseover", "mouseout", "select", "unselect", "interaction");

    let config = {
        data: undefined,
        size: 500,  // default graph size
        labelSize: 100,
        nodeArc: 12,
        colorScale: d3.scale.linear()
            .range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]) // The domain is set dynamically
    };
    let fixedNodes = new Map();
    let radius;
    let labels;

    const render = function (div) {
        if (!div) {
            console.error('No container DOM element provided');
            return;
        }

        // Set the domain of the color scale based on the real data length
        const dataDomain = calcInteractionsDomain(config.data);
        config.colorScale.domain(dataDomain);

        // Calculates how much space is needed for the whole visualisation given the number of nodes / labels
        radius = calcRadius(config.data.length, config.nodeArc);
        let diameter = radius * 2;

        let size = diameter + (2*config.labelSize);
        if (size < config.size) {
            size = config.size;
            diameter = size - (2*config.labelSize);
            radius = ~~(diameter / 2);
        } else {
            config.size = size;
        }

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

        update(config.data);

        function update(data = []) {
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
                    const x = diameter / 2 * Math.cos(d.angle);
                    const y = diameter / 2 * Math.sin(d.angle);
                    return (`translate(${x},${y})`);
                })
                .attr("fill", "grey")
                .on("mouseover", function (d) { // No arrow function here because we need the moused over element as _this_
                    dispatch.mouseover.call(this, d);
                })
                .on("mouseout", function (d) { // No arrow function here because we need the moused over element as _this_
                    dispatch.mouseout.call(this, d);
                })
                .on("click", function (d) { // No arrow function here because we need the moused over element as _this_
                    // dispatch.click.call(this, d);
                    fix.call(this, d, true);
                });

            // Labels
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

            // links
            // We need a data structure with the angles.
            const k = new Map();
            for (let n of data) {
                k.set(n.label, n.angle);
            }
            labels
                .each(function (source) {
                    let fromAngle = source.angle;
                    for (let dest of Object.values(source.interactsWith)) {
                        let toAngle = k.get(dest.label);
                        let fromX = (diameter-7) / 2 * Math.cos(fromAngle);
                        let fromY = (diameter-7) / 2 * Math.sin(fromAngle);
                        let toX = (diameter-7) / 2 * Math.cos(toAngle);
                        let toY = (diameter-7) / 2 * Math.sin(toAngle);
                        graph.append("path")
                            //.datum(source)
                            .datum({
                                source: source,
                                dest: dest
                            })
                            .attr("class", "openTargets_interactions_link")
                            .attr("d", `M${fromX},${fromY} Q0,0 ${toX},${toY}`)
                            .attr("fill", "none")
                            .attr("stroke", "#1e5799")
                            .attr("stroke-width", 1);
                    }
                });

            // Nodes
            labels
                .append("circle")
                // .attr("fill", "#005299")
                .attr("fill", (data) => {
                    return config.colorScale(Object.keys(data.interactsWith).length);
                })
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", 5);


            function fixedNodesHasLinkWith (node) {
                let interacts = false;
                fixedNodes.forEach(function (val, key) {
                    for (let [key, inter] of Object.entries(val.interactsWith)) {
                        if (inter.label === node.label) {
                            interacts = true;
                            break;
                        }
                    }
                });
                return interacts;
            }

            // Simulates a click in a node
            render.click = function (node) {
                console.log("IV has been asked to unselect this node...");
                console.log(node);

                // Find the element for the node
                let elem;
                d3.selectAll('.openTargets_interactions_label')
                    .each(function (d) {
                        if (d == node) {
                            elem = this;
                        }
                    });

                if (elem) {
                    console.log("simulating a click on node...");
                    console.log(elem);
                    fix.call(elem, node, false);
                } else {
                    throw ("Can't find node");
                }
            };

            function fix(node, events) { // if events is truthy, fire events for each select / unselect action
                const clickedNode = this;

                // Specs:
                // 1. If there is no other node selected, select this one
                // 2. If there is another node selected and there is a connection between both, show details
                // 3. If there is another node selected and there is no connection between them, this one is the only selected
                // 4. If the selected node is already selected, deselect it
                // 5. If the are already 2 selected nodes and this is not one of them, select only this one.

                // TODO: dispatching select and unselect should be done centrally by combining the operations on the Map with the dispathing
                // Case 1
                if (!fixedNodes.size) {
                    if (events) {
                        select.call(clickedNode, node);
                    }
                    fixedNodes.set(node.label, node);
                    dispatch.select.call(clickedNode, node);
                } else if (fixedNodes.has(node.label)) {
                    fixedNodes.delete(node.label);
                    if (events) {
                        dispatch.unselect.call(clickedNode, node);
                    }
                    if (!fixedNodes.size) { // We only had 1 node selected and is now unselected
                        // Case 4
                        unselect.call(clickedNode, node);
                    } else {
                        // We have deselected, but there is still one selected. So take the other one and select it
                        let otherNode = fixedNodes.keys().next().value;
                        select.call(clickedNode, fixedNodes.get(otherNode));
                        // fixedNodes.set(node.label, node);
                    }
                } else { // New node selected...
                    // If there are already 2 nodes selected, select only this one
                    if (fixedNodes.size === 2) {
                        select.call(clickedNode, node);
                        fixedNodes.clear();
                        fixedNodes.set(node.label, node);
                        if (events) {
                            dispatch.select.call(clickedNode, node);
                        }
                    } else { // There is already one node selected. Two cases here: there exists a connection between them or not
                        if (fixedNodesHasLinkWith(node)) {
                            fixedNodes.set(node.label, node);
                            if (events) {
                                dispatch.select.call(clickedNode, node);
                            }
                            select2.call(clickedNode, fixedNodes);
                        } else { // No link between both, so just select
                            fixedNodes.clear();
                            fixedNodes.set(node.label, node);
                            if (events) {
                                dispatch.select.call(clickedNode, node);
                            }
                            select.call(clickedNode, node);
                        }
                    }
                }
            }

            function unselect(d) {
                // dispatch.unselect.call(this, d);

                d3.selectAll(".openTargets_interactions_link")
                    .attr("opacity", 1);
                d3.selectAll(".openTargets_interactions_label")
                    .attr("fill", "grey")
                    .attr("opacity", 1);
                d3.select(this).attr("fill", "grey");
            }

            function select(d) {
                // dispatch.select.call(this, d);
                // fade out other links
                d3.selectAll(".openTargets_interactions_link")
                    .attr("opacity", (data) => {
                        if (d.label === data.source.label) {
                            return 1;
                        }
                        return 0;
                    });

                // fade out the labels / nodes
                d3.selectAll(".openTargets_interactions_label")
                    .attr("fill", (data) => {
                        if (d.label === data.label) {
                            return "red";
                        }
                        return "grey";
                    })
                    .attr("opacity", (data) => {
                        if (d.label === data.label) {
                            return 1;
                        }
                        for (let inter of Object.values(data.interactsWith)) {
                            if (inter.label === d.label) {
                                return 1;
                            }
                        }
                        return 0;
                    });
            }

            function select2(fixedNodes) {
                // dispatch.select.call(this, d3.select(this).datum());
                const clickedNode = this;
                d3.select(this).attr("fill", "red");

                // dispatch.select2.call(this, d);
                // fade out other links
                d3.selectAll(".openTargets_interactions_link")
                    .attr("opacity", (data) => {
                        if (fixedNodes.has(data.source.label) && fixedNodes.has(data.dest.label)) {
                            return 1;
                        }
                        return 0;
                    });

                // fade out other labels
                d3.selectAll(".openTargets_interactions_label")
                    .attr("opacity", (data) => {
                        if (fixedNodes.has(data.label)) {
                            return 1;
                        }
                        return 0;
                    });

                let iNames = [];
                for (const iName of fixedNodes.keys()) {
                    iNames.push(iName);
                }

                let provenance = new Set();
                addProvenance(fixedNodes.get(iNames[0]).interactsWith, fixedNodes.get(iNames[1]).label, provenance);
                addProvenance(fixedNodes.get(iNames[1]).interactsWith, fixedNodes.get(iNames[0]).label, provenance);
                let interObj = {
                    interactor1: iNames[0],
                    interactor2: iNames[1],
                    provenance: Array.from(provenance)
                };

                // Fire the interaction event
                dispatch.interaction.call(clickedNode, interObj);
            }

        }

        function addProvenance (iw, i2, provenance) {
            Object.keys(iw).forEach(function (i) {
                if (iw[i].label === i2) {
                    // interactions = iw[i].provenance;
                    for (let p of iw[i].provenance) {
                        provenance.add(p);
                    }
                }
            });
        }

        function calcInteractionsDomain(data) {
            let min = Infinity;
            let max = 0;
            for (let i = 0; i < data.length; i++) {
                let d = data[i];
                let il = Object.keys(d.interactsWith).length;
                if (il > max) {
                    max = il;
                }
                if (il < min) {
                    min = il;
                }
            }
            return [min, max];
        }

    };

    render.filter = function (cbak) {
        // The cbak is run on every link and is expected to return true or false.
    };

    apijs(render)
        .getset(config);

    function calcRadius (n, nodeArc=config.nodeArc) {
        // Given the number of nodes to allocate in the circumference and the arc that each node needs, calculate the minimum radius of the plot
        // 2 * PI * r = totalArc = nodeArc * n
        return ~~(nodeArc * n / (2 * Math.PI));
    }

    return d3.rebind(render, dispatch, "on");
}
