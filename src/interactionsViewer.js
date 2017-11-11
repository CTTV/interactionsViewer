import apijs from 'tnt.api';


export default function () {

    let dispatch = d3.dispatch("click", "dblclick", "mouseover", "mouseout", "select", "unselect", "interaction", "loaded");

    let config = {
        // filters: {"Reactome": true},
        filters: {},
        data: [],
        selectedNodesColors: ['#ffe6e6', '#e6ecff'],
        // mirrorLinks: true,
        size: 500,  // default graph size
        labelSize: 100,
        nodeArc: 12,
        colorScale: d3.scale.linear()
            .range([d3.rgb("#FFF500"), d3.rgb('#007AFF')]) // The domain is set dynamically
    };

    let fixedNodes = new Map();
    let nodes = new Map(); // contains a map of the nodes
    let radius;
    let labels;
    let ease = d3.ease('cubic-in-out');
    let duration = 1000;
    let timeScale = d3.scale.linear()
        .domain([0, duration])
        .range([0, 1]);
    let prevTime = 0;

    // Since we are using canvas for the links we need to do our own data binding
    // This data structure holds the currently displayed links
    let prevLinks = new Set();
    let graph;
    let svg;
    let canvas;

    let loaded = false;

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

        let size = diameter + (2 * config.labelSize);
        if (size < config.size) {
            size = config.size;
            diameter = size - (2 * config.labelSize);
            radius = ~~(diameter / 2);
        } else {
            config.size = size;
        }

        // svg
        const container = d3.select(div)
            .append("div")
            .style("position", "relative");
        svg = container
            .append("svg")
            .attr("class", "star-plot-toplevel-container")
            .attr("width", config.size)
            .attr("height", config.size);

        canvas = container
            .append("canvas")
            .attr("class", "star-plot-toplevel-container top")
            .attr("width", config.size)
            .attr("height", config.size)
            .node();

        const ctx = canvas.getContext('2d');
        ctx.translate(radius+config.labelSize, radius+config.labelSize);

        graph = svg
            .append("g")
            .attr("transform", `translate(${radius + config.labelSize},${radius + config.labelSize})`);

        update();
        // dispatch.loaded();

        // Compute the links given the data we have, the source/provenance filters that have been applied and the clicked (selected) nodes
        // The resultint links are stored in the currentInteractors sub-object
        function computeLinks() {
            let data = config.data;
            let filters = config.filters;

            // An index of links between 2 nodes based on the data points and the filters on the sources
            let links = new Map();

            for (let d of data) {
                // Reset the current sets of interactors
                // It has to be done in advance because we mirror interactors (if A->B, then B->A also in the currentInteractors), but this mirror can be lost when we get to that node (B)
                d.currentInteractors = {};
            }

            for (let d of data) {
                // if (!d.currentInteractors) {
                // Reset the current set of iteractors
                // d.currentInteractors = {};
                // }
                // if there are fixed nodes, check that this is one of them...
                if (fixedNodes.size) {
                    if (!fixedNodes.get(d.label)) {
                        continue;
                    }
                }
                for (let interName in d.interactsWith) {
                    if (d.interactsWith.hasOwnProperty(interName)) {

                        // If two nodes are selected, this has to be there are well
                        if (fixedNodes.size === 2) {
                            if (!fixedNodes.get(interName)) {
                                continue;
                            }
                        }


                        let inter = d.interactsWith[interName];

                        let possibleInteraction = {
                            source: d,
                            target: interName,
                            provenance: []
                        };

                        for (let prov of inter.provenance) {
                            // If the source has not been filtered out, include it
                            if (!filters[prov.source]) {
                                possibleInteraction.provenance.push(prov);
                            }
                        }
                        if (possibleInteraction.provenance.length) {
                            // We have sources supporting this interaction

                            // Only include the possible interaction if there is no fixed node or a fixed node is involved
                            d.currentInteractors[interName] = inter;
                            let linkedNode = nodes.get(interName);
                            linkedNode.currentInteractors[d.label] = d;
                            // links.push(possibleInteraction);
                            // links[`${d.source.label}-${d.target}`] = possibleInteraction;
                            links.set(`${possibleInteraction.source.label}-${possibleInteraction.target}`, possibleInteraction);
                        }
                    }
                }
            }
            return links;
        }


        function dataBind (currLinks) {
            // Convert the map of current links in 2 sets of links:
            // One holding the new links
            // One holding the removed links

            // Get the set of the current links
            // TODO: Is there a [better | more idiomatic | more performant] way to get the two sets?
            let currLinksSet = new Set([...currLinks.keys()]);
            let prevLinksSet = new Set([...prevLinks.keys()]);

            // Calculate the difference of the current links set and the prev links set
            let newLinks     = new Set([...currLinksSet].filter(x => !prevLinks.has(x)));
            let removedLinks = new Set([...prevLinksSet].filter(x => !currLinksSet.has(x)));
            let stayLinks = new Set([...prevLinksSet].filter(x => currLinksSet.has(x)));

            // The sets need to have the information, not just the key
            let newLinksInfo = new Set();
            for (let link of newLinks.values()) {
                newLinksInfo.add(currLinks.get(link));
            }

            let removedLinksInfo = new Set();
            for (let link of removedLinks.values()) {
                removedLinksInfo.add(prevLinks.get(link));
            }

            let stayLinksInfo = new Set();
            for (let link of stayLinks.values()) {
                stayLinksInfo.add(prevLinks.get(link));
            }

            prevLinks = currLinks;

            return {
                newLinks: newLinksInfo,
                removedLinks: removedLinksInfo,
                stayLinks: stayLinksInfo
            };
        }

        function updateLinks() {
            let currLinks = computeLinks();

            // For data binding, we create an index of current links indexed by `${d.source.label}-${d.target}`
            // db contains 2 set of links: new links and removed links
            let {newLinks, removedLinks, stayLinks} = dataBind(currLinks);

            // New links
            newLinks.forEach (function (d) {
                let fromAngle = d.source.angle + 0.001;
                let toAngle = nodes.get(d.target).angle + 0.001;
                d.fromX = (diameter - 7) / 2 * Math.cos(fromAngle);
                d.fromY = (diameter - 7) / 2 * Math.sin(fromAngle);
                d.toX = (diameter - 7) / 2 * Math.cos(toAngle);
                d.toY = (diameter - 7) / 2 * Math.sin(toAngle);
            });

            stayLinks.forEach (function (d) {
                let fromAngle = d.source.angle + 0.001;
                let toAngle = nodes.get(d.target).angle + 0.001;
                d.fromX = (diameter - 7) / 2 * Math.cos(fromAngle);
                d.fromY = (diameter - 7) / 2 * Math.sin(fromAngle);
                d.toX = (diameter - 7) / 2 * Math.cos(toAngle);
                d.toY = (diameter - 7) / 2 * Math.sin(toAngle);
            });

            // clear the previous links
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, config.size, config.size);
            ctx.restore();


            // Attempt to get a transition on the curves
            prevTime = 0;
            d3.timer(stepDrawLine);


            function stepDrawLine(t) {
                const time = ease(timeScale(t));

                // This finishes the animation
                if (t >= duration) {
                    return true;
                }

                // Clear the previous frame
                ctx.clearRect(-config.size / 2, -config.size / 2, config.size, config.size);

                // New links
                newLinks.forEach (function (d) {
                    drawPartialLine (d, time);
                });

                // Removed links
                removedLinks.forEach (function (d) {
                    drawPartialLine (d, (1-time));
                });

                // Staying links
                stayLinks.forEach(function(d) {
                    drawLine(d);
                });

                prevTime = time;
            }

            function lerp(p, q, t) {
                // linearly interpolate from p to q by amount t
                // where t in [0, 1]
                return {
                    x: p.x + (q.x - p.x) * t,
                    y: p.y + (q.y - p.y) * t
                };
            }

            function drawLine(d) {
                // Draw a quadratic bezier without animation
                // (for lines that have not changed)
                ctx.beginPath();
                ctx.moveTo(d.fromX, d.fromY);
                ctx.quadraticCurveTo(0, 0, d.toX, d.toY);
                ctx.strokeStyle = '#1e5799';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            function drawPartialLine(d, t) {
                // Draw a quadratic bezier with animation using de Casteljau method
                // (for lines that have not changed)

                // Full quadratic bezier we are interpolating from has:
                // start p0
                // end p2
                // control point p1
                const p0 = { x: d.fromX, y: d.fromY };
                const p2 = { x: d.toX, y: d.toY };
                const p1 = { x: 0, y: 0 };

                // Linearly interpolate from p0 to p1 by amount t: this is q0
                const q0 = lerp(p0, p1, t);

                // Linearly interpolate from p1 to p2 by amount t: this is q1
                const q1 = lerp(p1, p2, t);

                // Linearly interpolate from q0 to q1 by amount t: this is r0 (on the curve)
                const r0 = lerp(q0, q1, t);

                // Required quadratic bezier has:
                // start p0
                // end r0
                // control point q0
                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.quadraticCurveTo(q0.x, q0.y, r0.x, r0.y);
                ctx.strokeStyle = '#1e5799';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Labels --
            //
            // Remove the background for prev selected labels:
            d3.selectAll('.openTargets_background_removeMe').remove();

            // Remove the `unselect` elements on the labels
            d3.selectAll('.openTargets_unselect_removeMe').remove();

            // The method 'entries' called on an iterable returns a new Iterator object for each element in insertion order
            // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Map
            // Remove all the colours
            for (let node of config.data) {
                delete node.color;
            }

            // Set the color of the selected nodes
            let count = 0;
            for (let [nodeLabel, fixedNode] of fixedNodes) {
                fixedNode.color = config.selectedNodesColors[count++];
            }

            // For nodes, show only those that have links selected.
            let n = 0;
            labels
                .style('visibility', "visible")
                .transition()
                .duration(500)
                .attr("opacity", (data) => {
                    if (data.currentInteractors && Object.keys(data.currentInteractors).length) {
                        return 1;
                    }
                    return 0;
                })
                .each(() => n++)
                .each ('end', function (d) {
                    d3.select(this)
                        .style('visibility', (data) => {
                            if (data.currentInteractors && Object.keys(data.currentInteractors).length) {
                                return "visible";
                            }
                            return "hidden";
                        });

                    // Notify we have now finished rendering
                    // Only for the first time
                    if (loaded === false && !--n) {
                        loaded = true;
                        dispatch.loaded();
                    }

                })
                .each(function (d) {
                    let color = d.color;
                    if (!color) {
                        return;
                    }

                    // We create a new text element to know its size...
                    let textAux = svg.append('text').text(d.label);
                    const textBBox = textAux.node().getBBox();
                    textAux.remove();

                    // If it has color -> it has been selected -> add an `unselect` icon at the end of the label
                    let offset = 5;
                    let closer = d3.select(this)
                        .append('g')
                        .attr('class', 'openTargets_unselect_removeMe')

                    closer.append("line")
                        .attr('x1', (6 + textBBox.width) + offset)
                        .attr('y1', -~~(textBBox.height / 2) + offset)
                        .attr('x2', (6 + textBBox.width + textBBox.height) - offset)
                        .attr('y2', -~~(textBBox.height / 2) + textBBox.height - offset)
                        .attr("stroke", "black")
                        .attr("stroke-width", 2)
                        .attr('transform', (d) => {
                            let grades = d.angle * 180 / Math.PI;
                            return `rotate(${grades % 360})`;
                        });

                    closer.append("line")
                        .attr("x1", (6 + textBBox.width) + offset)
                        .attr("y1", -~~(textBBox.height / 2) + textBBox.height - offset)
                        .attr("x2", (6 + textBBox.width + textBBox.height) - offset)
                        .attr("y2", -~~(textBBox.height / 2) + offset)
                        .attr('stroke', "black")
                        .attr("stroke-width", 2)
                        .attr('transform', (d) => {
                            let grades = d.angle * 180 / Math.PI;
                            return `rotate(${grades % 360})`;
                        });


                    // Then we create the rect with the given dimensions
                    let rect = d3.select(this)
                        .append('rect')
                        .attr("class", "openTargets_background_removeMe")
                        .attr('x', 6)
                        .attr('y',  -~~(textBBox.height / 2))
                        .attr('width', textBBox.width + 2)
                        .attr('height', textBBox.height)
                        .attr('fill', color)
                        .attr("transform", (d) => {
                            let grades = d.angle * 180 / Math.PI;
                            return `rotate(${grades % 360})`;
                        });
                    // Move the element back
                    this.insertBefore(rect.node(), this.firstChild);

                });
        }

        render.update = updateLinks;

        function update() {
            let data = config.data;
            let stepRad = 360 / data.length;
            let currAngle = -1.6;
            let diameter = radius * 2;

            // Calculate the angles for each node
            // And store the nodes in a Map
            for (let node of data) {
                node.angle = currAngle;
                // angles.set(node.label, node.angle);
                nodes.set(node.label, node);
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


            updateLinks();

            // Simulates a click in a node
            // fireEvent tells the function if the select/unselect action (in the fix function) should fire a "select"/"unselect" event back
            render.click = function (node, fireEvent) {
                if (fireEvent !== false) {
                    fireEvent = true;
                }

                // Find the element for the node
                let elem;
                d3.selectAll('.openTargets_interactions_label')
                    .each(function (d) {
                        if (d.label === node.label) {
                            elem = this;
                        }
                    });

                if (elem) {
                    fix.call (elem, node, fireEvent);
                    // config.clickNode = {
                    //     element: elem,
                    //     node: node
                    // };
                } else {
                    throw ("Can't find node");
                }
            };
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

    apijs(render)
        .getset(config);

    // Extra functions
    function fixedNodesHasLinkWith(node) {
        let interacts = false;
        fixedNodes.forEach(function (val, key) {
            // for (let [key, inter] of Object.entries(val.interactsWith)) {
            for (let key of Object.keys(val.interactsWith)) {
                let inter = val.interactsWith[key];
                if (inter.label === node.label) {
                    interacts = true;
                    break;
                }
            }
        });
        return interacts;
    }

    function select2(fixedNodes) {
        const clickedNode = this;
        render.update();

        let iNames = [];
        for (const iName of fixedNodes.keys()) {
            iNames.push(iName);
        }

        let provenance = new Map();
        addProvenance(fixedNodes.get(iNames[0]).interactsWith, fixedNodes.get(iNames[1]).label, provenance);
        addProvenance(fixedNodes.get(iNames[1]).interactsWith, fixedNodes.get(iNames[0]).label, provenance);
        let interObj = {
            interactor1: iNames[0],
            interactor2: iNames[1],
            provenance: Array.from(provenance.values())
        };

        // Fire the interaction event
        dispatch.interaction.call(clickedNode, interObj);
    }

    function addProvenance(iw, i2, provenance) {
        Object.keys(iw).forEach(function (i) {
            if (iw[i].label === i2) {
                // interactions = iw[i].provenance;
                for (let p of iw[i].provenance) {
                    provenance.set(p.id, p);
                }
            }
        });
    }

    function fix(node, events) { // if events is truth-y, fire events for each select / unselect action
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
            fixedNodes.set(node.label, node);
            render.update();
            if (events) {
                // select.call(clickedNode, node);
                dispatch.select.call(clickedNode, node);
            }
        } else if (fixedNodes.has(node.label)) {
            fixedNodes.delete(node.label);
            if (!fixedNodes.size) { // We only had 1 node selected and is now unselected
                // Case 4
                // unselect.call(clickedNode, node);
                render.update();
            } else {
                // We have deselected, but there is still one selected. So take the other one and select it
                let otherNode = fixedNodes.keys().next().value;
                // select.call(clickedNode, fixedNodes.get(otherNode));
                render.update();
                // fixedNodes.set(node.label, node);
            }
            if (events) {
                dispatch.unselect.call(clickedNode, node);
            }
        } else { // New node selected...
            // If there are already 2 nodes selected, select only this one
            if (fixedNodes.size === 2) {
                // select.call(clickedNode, node);
                render.update();
                fixedNodes.clear();
                fixedNodes.set(node.label, node);
                if (events) {
                    dispatch.select.call(clickedNode, node);
                }
            } else { // There is already one node selected. Two cases here: there exists a connection between them or not
                if (fixedNodesHasLinkWith(node)) {
                    fixedNodes.set(node.label, node);
                    select2.call(clickedNode, fixedNodes);
                    if (events) {
                        dispatch.select.call(clickedNode, node);
                    }
                } else { // No link between both, so just select
                    fixedNodes.clear();
                    fixedNodes.set(node.label, node);
                    // select.call(clickedNode, node);
                    render.update();
                    if (events) {
                        dispatch.select.call(clickedNode, node);
                    }
                }
            }
        }
    }

    function calcRadius(n, nodeArc = config.nodeArc) {
        // Given the number of nodes to allocate in the circumference and the arc that each node needs, calculate the minimum radius of the plot
        // 2 * PI * r = totalArc = nodeArc * n
        return ~~(nodeArc * n / (2 * Math.PI));
    }

    return d3.rebind(render, dispatch, "on");
}
