(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.interactionsViewer = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

// module.exports = require('./src/interactionsViewer').default;

module.exports = require('./index.js').default;

},{"./index.js":2}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _interactionsViewer = require('./src/interactionsViewer.js');

var _interactionsViewer2 = _interopRequireDefault(_interactionsViewer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _interactionsViewer2.default;
// module.exports = interactionsViewer;


// module.exports = require('./src/interactionsViewer').default;

// module.exports = interactionsViewer = function() {
//     console.log("interaction viewer here");
// };

},{"./src/interactionsViewer.js":5}],3:[function(require,module,exports){
module.exports = require("./src/api.js");

},{"./src/api.js":4}],4:[function(require,module,exports){
var api = function (who) {

    var _methods = function () {
	var m = [];

	m.add_batch = function (obj) {
	    m.unshift(obj);
	};

	m.update = function (method, value) {
	    for (var i=0; i<m.length; i++) {
		for (var p in m[i]) {
		    if (p === method) {
			m[i][p] = value;
			return true;
		    }
		}
	    }
	    return false;
	};

	m.add = function (method, value) {
	    if (m.update (method, value) ) {
	    } else {
		var reg = {};
		reg[method] = value;
		m.add_batch (reg);
	    }
	};

	m.get = function (method) {
	    for (var i=0; i<m.length; i++) {
		for (var p in m[i]) {
		    if (p === method) {
			return m[i][p];
		    }
		}
	    }
	};

	return m;
    };

    var methods    = _methods();
    var api = function () {};

    api.check = function (method, check, msg) {
	if (method instanceof Array) {
	    for (var i=0; i<method.length; i++) {
		api.check(method[i], check, msg);
	    }
	    return;
	}

	if (typeof (method) === 'function') {
	    method.check(check, msg);
	} else {
	    who[method].check(check, msg);
	}
	return api;
    };

    api.transform = function (method, cbak) {
	if (method instanceof Array) {
	    for (var i=0; i<method.length; i++) {
		api.transform (method[i], cbak);
	    }
	    return;
	}

	if (typeof (method) === 'function') {
	    method.transform (cbak);
	} else {
	    who[method].transform(cbak);
	}
	return api;
    };

    var attach_method = function (method, opts) {
	var checks = [];
	var transforms = [];

	var getter = opts.on_getter || function () {
	    return methods.get(method);
	};

	var setter = opts.on_setter || function (x) {
	    for (var i=0; i<transforms.length; i++) {
		x = transforms[i](x);
	    }

	    for (var j=0; j<checks.length; j++) {
		if (!checks[j].check(x)) {
		    var msg = checks[j].msg || 
			("Value " + x + " doesn't seem to be valid for this method");
		    throw (msg);
		}
	    }
	    methods.add(method, x);
	};

	var new_method = function (new_val) {
	    if (!arguments.length) {
		return getter();
	    }
	    setter(new_val);
	    return who; // Return this?
	};
	new_method.check = function (cbak, msg) {
	    if (!arguments.length) {
		return checks;
	    }
	    checks.push ({check : cbak,
			  msg   : msg});
	    return this;
	};
	new_method.transform = function (cbak) {
	    if (!arguments.length) {
		return transforms;
	    }
	    transforms.push(cbak);
	    return this;
	};

	who[method] = new_method;
    };

    var getset = function (param, opts) {
	if (typeof (param) === 'object') {
	    methods.add_batch (param);
	    for (var p in param) {
		attach_method (p, opts);
	    }
	} else {
	    methods.add (param, opts.default_value);
	    attach_method (param, opts);
	}
    };

    api.getset = function (param, def) {
	getset(param, {default_value : def});

	return api;
    };

    api.get = function (param, def) {
	var on_setter = function () {
	    throw ("Method defined only as a getter (you are trying to use it as a setter");
	};

	getset(param, {default_value : def,
		       on_setter : on_setter}
	      );

	return api;
    };

    api.set = function (param, def) {
	var on_getter = function () {
	    throw ("Method defined only as a setter (you are trying to use it as a getter");
	};

	getset(param, {default_value : def,
		       on_getter : on_getter}
	      );

	return api;
    };

    api.method = function (name, cbak) {
	if (typeof (name) === 'object') {
	    for (var p in name) {
		who[p] = name[p];
	    }
	} else {
	    who[name] = cbak;
	}
	return api;
    };

    return api;
    
};

module.exports = exports = api;
},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = function () {

    var dispatch = d3.dispatch("click", "dblclick", "mouseover", "mouseout", "select", "unselect", "interaction");

    var config = {
        data: undefined,
        size: 500, // default graph size
        labelSize: 100,
        nodeArc: 12,
        colorScale: d3.scale.linear().range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]) // The domain is set dynamically
    };
    var fixedNodes = new Map();
    var radius = void 0;
    var labels = void 0;

    var render = function render(div) {
        if (!div) {
            console.error('No container DOM element provided');
            return;
        }

        // Set the domain of the color scale based on the real data length
        var dataDomain = calcInteractionsDomain(config.data);
        config.colorScale.domain(dataDomain);

        // Calculates how much space is needed for the whole visualisation given the number of nodes / labels
        radius = calcRadius(config.data.length, config.nodeArc);
        var diameter = radius * 2;

        var size = diameter + 2 * config.labelSize;
        if (size < config.size) {
            size = config.size;
            diameter = size - 2 * config.labelSize;
            radius = ~~(diameter / 2);
        } else {
            config.size = size;
        }

        // svg
        var svg = d3.select(div).append("div").style("position", "relative").append("svg").attr("width", config.size).attr("height", config.size);

        var graph = svg.append("g").attr("transform", "translate(" + (radius + config.labelSize) + "," + (radius + config.labelSize) + ")");

        update(config.data);

        function update() {
            var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

            var stepRad = 360 / data.length;

            var currAngle = 0;

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var link = _step.value;

                    // let {is_directed:isDirected, is_inhibition:isInhibition, is_stimulation:isStimulation, source, target} = link;

                    link.angle = currAngle;
                    currAngle += stepRad * Math.PI / 180;
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
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            labels = graph.selectAll(".openTargets_interactions_label").data(data, function (d) {
                return d.label;
            });

            labels.enter().append("g").attr("class", "openTargets_interactions_label").attr("transform", function (d) {
                var x = diameter / 2 * Math.cos(d.angle);
                var y = diameter / 2 * Math.sin(d.angle);
                return "translate(" + x + "," + y + ")";
            }).attr("fill", "grey").on("mouseover", function (d) {
                // No arrow function here because we need the moused over element as _this_
                dispatch.mouseover.call(this, d);
            }).on("mouseout", function (d) {
                // No arrow function here because we need the moused over element as _this_
                dispatch.mouseout.call(this, d);
            }).on("click", function (d) {
                // No arrow function here because we need the moused over element as _this_
                // dispatch.click.call(this, d);
                fix.call(this, d, true);
            });

            // Labels
            labels.append("text").style("font-size", "12px").style("text-anchor", function (d) {
                var grades = d.angle * 180 / Math.PI;
                if (grades % 360 > 90 && grades % 360 < 275) {
                    return "end";
                }
                return "start";
            }).text(function (d) {
                return d.label;
            }).attr("alignment-baseline", "central").attr("transform", function (d) {
                var grades = d.angle * 180 / Math.PI;
                if (grades % 360 > 90 && grades % 360 < 275) {
                    return "translate(" + 10 * Math.cos(d.angle) + "," + 10 * Math.sin(d.angle) + ") rotate(" + (grades % 360 + 180) + ")";
                }
                return "translate(" + 10 * Math.cos(d.angle) + "," + 10 * Math.sin(d.angle) + ") rotate(" + grades % 360 + ")";
            });

            // links
            // We need a data structure with the angles.
            var k = new Map();
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var n = _step2.value;

                    k.set(n.label, n.angle);
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            labels.each(function (source) {
                var fromAngle = source.angle;
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = Object.values(source.interactsWith)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var dest = _step3.value;

                        var toAngle = k.get(dest.label);
                        var fromX = (diameter - 7) / 2 * Math.cos(fromAngle);
                        var fromY = (diameter - 7) / 2 * Math.sin(fromAngle);
                        var toX = (diameter - 7) / 2 * Math.cos(toAngle);
                        var toY = (diameter - 7) / 2 * Math.sin(toAngle);
                        graph.append("path")
                        //.datum(source)
                        .datum({
                            source: source,
                            dest: dest
                        }).attr("class", "openTargets_interactions_link").attr("d", "M" + fromX + "," + fromY + " Q0,0 " + toX + "," + toY).attr("fill", "none").attr("stroke", "#1e5799").attr("stroke-width", 1);
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }
            });

            // Nodes
            labels.append("circle")
            // .attr("fill", "#005299")
            .attr("fill", function (data) {
                return config.colorScale(Object.keys(data.interactsWith).length);
            }).attr("cx", 0).attr("cy", 0).attr("r", 5);

            function fixedNodesHasLinkWith(node) {
                var interacts = false;
                fixedNodes.forEach(function (val, key) {
                    var _iteratorNormalCompletion4 = true;
                    var _didIteratorError4 = false;
                    var _iteratorError4 = undefined;

                    try {
                        for (var _iterator4 = Object.entries(val.interactsWith)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                            var _step4$value = _slicedToArray(_step4.value, 2),
                                _key = _step4$value[0],
                                inter = _step4$value[1];

                            if (inter.label === node.label) {
                                interacts = true;
                                break;
                            }
                        }
                    } catch (err) {
                        _didIteratorError4 = true;
                        _iteratorError4 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                _iterator4.return();
                            }
                        } finally {
                            if (_didIteratorError4) {
                                throw _iteratorError4;
                            }
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
                var elem = void 0;
                d3.selectAll('.openTargets_interactions_label').each(function (d) {
                    if (d == node) {
                        elem = this;
                    }
                });

                if (elem) {
                    console.log("simulating a click on node...");
                    console.log(elem);
                    fix.call(elem, node, false);
                } else {
                    throw "Can't find node";
                }
            };

            function fix(node, events) {
                // if events is truthy, fire events for each select / unselect action
                var clickedNode = this;

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
                    if (!fixedNodes.size) {
                        // We only had 1 node selected and is now unselected
                        // Case 4
                        unselect.call(clickedNode, node);
                    } else {
                        // We have deselected, but there is still one selected. So take the other one and select it
                        var otherNode = fixedNodes.keys().next().value;
                        select.call(clickedNode, fixedNodes.get(otherNode));
                        // fixedNodes.set(node.label, node);
                    }
                } else {
                    // New node selected...
                    // If there are already 2 nodes selected, select only this one
                    if (fixedNodes.size === 2) {
                        select.call(clickedNode, node);
                        fixedNodes.clear();
                        fixedNodes.set(node.label, node);
                        if (events) {
                            dispatch.select.call(clickedNode, node);
                        }
                    } else {
                        // There is already one node selected. Two cases here: there exists a connection between them or not
                        if (fixedNodesHasLinkWith(node)) {
                            fixedNodes.set(node.label, node);
                            if (events) {
                                dispatch.select.call(clickedNode, node);
                            }
                            select2.call(clickedNode, fixedNodes);
                        } else {
                            // No link between both, so just select
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

                d3.selectAll(".openTargets_interactions_link").attr("opacity", 1);
                d3.selectAll(".openTargets_interactions_label").attr("fill", "grey").attr("opacity", 1);
                d3.select(this).attr("fill", "grey");
            }

            function select(d) {
                // dispatch.select.call(this, d);
                // fade out other links
                d3.selectAll(".openTargets_interactions_link").attr("opacity", function (data) {
                    if (d.label === data.source.label) {
                        return 1;
                    }
                    return 0;
                });

                // fade out the labels / nodes
                d3.selectAll(".openTargets_interactions_label").attr("fill", function (data) {
                    if (d.label === data.label) {
                        return "red";
                    }
                    return "grey";
                }).attr("opacity", function (data) {
                    if (d.label === data.label) {
                        return 1;
                    }
                    var _iteratorNormalCompletion5 = true;
                    var _didIteratorError5 = false;
                    var _iteratorError5 = undefined;

                    try {
                        for (var _iterator5 = Object.values(data.interactsWith)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                            var inter = _step5.value;

                            if (inter.label === d.label) {
                                return 1;
                            }
                        }
                    } catch (err) {
                        _didIteratorError5 = true;
                        _iteratorError5 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion5 && _iterator5.return) {
                                _iterator5.return();
                            }
                        } finally {
                            if (_didIteratorError5) {
                                throw _iteratorError5;
                            }
                        }
                    }

                    return 0;
                });
            }

            function select2(fixedNodes) {
                // dispatch.select.call(this, d3.select(this).datum());
                var clickedNode = this;
                d3.select(this).attr("fill", "red");

                // dispatch.select2.call(this, d);
                // fade out other links
                d3.selectAll(".openTargets_interactions_link").attr("opacity", function (data) {
                    if (fixedNodes.has(data.source.label) && fixedNodes.has(data.dest.label)) {
                        return 1;
                    }
                    return 0;
                });

                // fade out other labels
                d3.selectAll(".openTargets_interactions_label").attr("opacity", function (data) {
                    if (fixedNodes.has(data.label)) {
                        return 1;
                    }
                    return 0;
                });

                // Fire the interaction event
                var interObj = {};
                var iNames = [];
                var _iteratorNormalCompletion6 = true;
                var _didIteratorError6 = false;
                var _iteratorError6 = undefined;

                try {
                    for (var _iterator6 = fixedNodes.keys()[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                        var iName = _step6.value;

                        iNames.push(iName);
                    }
                } catch (err) {
                    _didIteratorError6 = true;
                    _iteratorError6 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion6 && _iterator6.return) {
                            _iterator6.return();
                        }
                    } finally {
                        if (_didIteratorError6) {
                            throw _iteratorError6;
                        }
                    }
                }

                var interactions = [];
                console.log("interactors:");
                console.log(fixedNodes.get(iNames[0]));
                console.log(fixedNodes.get(iNames[1]));
                var iw = fixedNodes.get(iNames[0]).interactsWith;
                var i2 = fixedNodes.get(iNames[1]).label;
                Object.keys(iw).forEach(function (i) {
                    if (iw[i].label === i2) {
                        interactions = iw[i].provenance;
                    }
                });
                interObj = {
                    interactor1: iNames[0],
                    interactor2: iNames[1],
                    provenance: interactions
                };

                dispatch.interaction.call(clickedNode, interObj);
            }
        }

        function calcInteractionsDomain(data) {
            var min = Infinity;
            var max = 0;
            for (var i = 0; i < data.length; i++) {
                var d = data[i];
                var il = Object.keys(d.interactsWith).length;
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

    (0, _tnt2.default)(render).getset(config);

    function calcRadius(n) {
        var nodeArc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : config.nodeArc;

        // Given the number of nodes to allocate in the circumference and the arc that each node needs, calculate the minimum radius of the plot
        // 2 * PI * r = totalArc = nodeArc * n
        return ~~(nodeArc * n / (2 * Math.PI));
    }

    return d3.rebind(render, dispatch, "on");
};

var _tnt = require("tnt.api");

var _tnt2 = _interopRequireDefault(_tnt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

},{"tnt.api":3}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJicm93c2VyLmpzIiwiaW5kZXguanMiLCJub2RlX21vZHVsZXMvdG50LmFwaS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy90bnQuYXBpL3NyYy9hcGkuanMiLCJzcmMvaW50ZXJhY3Rpb25zVmlld2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFFQSxPQUFPLE9BQVAsR0FBaUIsUUFBUSxZQUFSLEVBQXNCLE9BQXZDOzs7Ozs7Ozs7QUNGQTs7Ozs7OztBQUVBOzs7QUFHQTs7QUFFQTtBQUNBO0FBQ0E7OztBQ1RBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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LENBQUMsRUFBRSxVQUFVLENBQVYsSUFBZSxJQUFJLEtBQUssRUFBeEIsQ0FBRixDQUFSO0FBQ0g7O0FBRUQsV0FBTyxHQUFHLE1BQUgsQ0FBVSxNQUFWLEVBQWtCLFFBQWxCLEVBQTRCLElBQTVCLENBQVA7QUFDSCxDOztBQXBZRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vc3JjL2ludGVyYWN0aW9uc1ZpZXdlcicpLmRlZmF1bHQ7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9pbmRleC5qcycpLmRlZmF1bHQ7XG4iLCJpbXBvcnQgaW50ZXJhY3Rpb25zVmlld2VyIGZyb20gJy4vc3JjL2ludGVyYWN0aW9uc1ZpZXdlci5qcyc7XG5leHBvcnQgZGVmYXVsdCBpbnRlcmFjdGlvbnNWaWV3ZXI7XG4vLyBtb2R1bGUuZXhwb3J0cyA9IGludGVyYWN0aW9uc1ZpZXdlcjtcblxuXG4vLyBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vc3JjL2ludGVyYWN0aW9uc1ZpZXdlcicpLmRlZmF1bHQ7XG5cbi8vIG1vZHVsZS5leHBvcnRzID0gaW50ZXJhY3Rpb25zVmlld2VyID0gZnVuY3Rpb24oKSB7XG4vLyAgICAgY29uc29sZS5sb2coXCJpbnRlcmFjdGlvbiB2aWV3ZXIgaGVyZVwiKTtcbi8vIH07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3NyYy9hcGkuanNcIik7XG4iLCJ2YXIgYXBpID0gZnVuY3Rpb24gKHdobykge1xuXG4gICAgdmFyIF9tZXRob2RzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgbSA9IFtdO1xuXG5cdG0uYWRkX2JhdGNoID0gZnVuY3Rpb24gKG9iaikge1xuXHQgICAgbS51bnNoaWZ0KG9iaik7XG5cdH07XG5cblx0bS51cGRhdGUgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgZm9yICh2YXIgaT0wOyBpPG0ubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IgKHZhciBwIGluIG1baV0pIHtcblx0XHQgICAgaWYgKHAgPT09IG1ldGhvZCkge1xuXHRcdFx0bVtpXVtwXSA9IHZhbHVlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0ICAgIH1cblx0XHR9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gZmFsc2U7XG5cdH07XG5cblx0bS5hZGQgPSBmdW5jdGlvbiAobWV0aG9kLCB2YWx1ZSkge1xuXHQgICAgaWYgKG0udXBkYXRlIChtZXRob2QsIHZhbHVlKSApIHtcblx0ICAgIH0gZWxzZSB7XG5cdFx0dmFyIHJlZyA9IHt9O1xuXHRcdHJlZ1ttZXRob2RdID0gdmFsdWU7XG5cdFx0bS5hZGRfYmF0Y2ggKHJlZyk7XG5cdCAgICB9XG5cdH07XG5cblx0bS5nZXQgPSBmdW5jdGlvbiAobWV0aG9kKSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bS5sZW5ndGg7IGkrKykge1xuXHRcdGZvciAodmFyIHAgaW4gbVtpXSkge1xuXHRcdCAgICBpZiAocCA9PT0gbWV0aG9kKSB7XG5cdFx0XHRyZXR1cm4gbVtpXVtwXTtcblx0XHQgICAgfVxuXHRcdH1cblx0ICAgIH1cblx0fTtcblxuXHRyZXR1cm4gbTtcbiAgICB9O1xuXG4gICAgdmFyIG1ldGhvZHMgICAgPSBfbWV0aG9kcygpO1xuICAgIHZhciBhcGkgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIGFwaS5jaGVjayA9IGZ1bmN0aW9uIChtZXRob2QsIGNoZWNrLCBtc2cpIHtcblx0aWYgKG1ldGhvZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8bWV0aG9kLmxlbmd0aDsgaSsrKSB7XG5cdFx0YXBpLmNoZWNrKG1ldGhvZFtpXSwgY2hlY2ssIG1zZyk7XG5cdCAgICB9XG5cdCAgICByZXR1cm47XG5cdH1cblxuXHRpZiAodHlwZW9mIChtZXRob2QpID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICBtZXRob2QuY2hlY2soY2hlY2ssIG1zZyk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS5jaGVjayhjaGVjaywgbXNnKTtcblx0fVxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkudHJhbnNmb3JtID0gZnVuY3Rpb24gKG1ldGhvZCwgY2Jhaykge1xuXHRpZiAobWV0aG9kIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0ICAgIGZvciAodmFyIGk9MDsgaTxtZXRob2QubGVuZ3RoOyBpKyspIHtcblx0XHRhcGkudHJhbnNmb3JtIChtZXRob2RbaV0sIGNiYWspO1xuXHQgICAgfVxuXHQgICAgcmV0dXJuO1xuXHR9XG5cblx0aWYgKHR5cGVvZiAobWV0aG9kKSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgbWV0aG9kLnRyYW5zZm9ybSAoY2Jhayk7XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbWV0aG9kXS50cmFuc2Zvcm0oY2Jhayk7XG5cdH1cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgdmFyIGF0dGFjaF9tZXRob2QgPSBmdW5jdGlvbiAobWV0aG9kLCBvcHRzKSB7XG5cdHZhciBjaGVja3MgPSBbXTtcblx0dmFyIHRyYW5zZm9ybXMgPSBbXTtcblxuXHR2YXIgZ2V0dGVyID0gb3B0cy5vbl9nZXR0ZXIgfHwgZnVuY3Rpb24gKCkge1xuXHQgICAgcmV0dXJuIG1ldGhvZHMuZ2V0KG1ldGhvZCk7XG5cdH07XG5cblx0dmFyIHNldHRlciA9IG9wdHMub25fc2V0dGVyIHx8IGZ1bmN0aW9uICh4KSB7XG5cdCAgICBmb3IgKHZhciBpPTA7IGk8dHJhbnNmb3Jtcy5sZW5ndGg7IGkrKykge1xuXHRcdHggPSB0cmFuc2Zvcm1zW2ldKHgpO1xuXHQgICAgfVxuXG5cdCAgICBmb3IgKHZhciBqPTA7IGo8Y2hlY2tzLmxlbmd0aDsgaisrKSB7XG5cdFx0aWYgKCFjaGVja3Nbal0uY2hlY2soeCkpIHtcblx0XHQgICAgdmFyIG1zZyA9IGNoZWNrc1tqXS5tc2cgfHwgXG5cdFx0XHQoXCJWYWx1ZSBcIiArIHggKyBcIiBkb2Vzbid0IHNlZW0gdG8gYmUgdmFsaWQgZm9yIHRoaXMgbWV0aG9kXCIpO1xuXHRcdCAgICB0aHJvdyAobXNnKTtcblx0XHR9XG5cdCAgICB9XG5cdCAgICBtZXRob2RzLmFkZChtZXRob2QsIHgpO1xuXHR9O1xuXG5cdHZhciBuZXdfbWV0aG9kID0gZnVuY3Rpb24gKG5ld192YWwpIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiBnZXR0ZXIoKTtcblx0ICAgIH1cblx0ICAgIHNldHRlcihuZXdfdmFsKTtcblx0ICAgIHJldHVybiB3aG87IC8vIFJldHVybiB0aGlzP1xuXHR9O1xuXHRuZXdfbWV0aG9kLmNoZWNrID0gZnVuY3Rpb24gKGNiYWssIG1zZykge1xuXHQgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIGNoZWNrcztcblx0ICAgIH1cblx0ICAgIGNoZWNrcy5wdXNoICh7Y2hlY2sgOiBjYmFrLFxuXHRcdFx0ICBtc2cgICA6IG1zZ30pO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cdG5ld19tZXRob2QudHJhbnNmb3JtID0gZnVuY3Rpb24gKGNiYWspIHtcblx0ICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdHJldHVybiB0cmFuc2Zvcm1zO1xuXHQgICAgfVxuXHQgICAgdHJhbnNmb3Jtcy5wdXNoKGNiYWspO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH07XG5cblx0d2hvW21ldGhvZF0gPSBuZXdfbWV0aG9kO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0c2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBvcHRzKSB7XG5cdGlmICh0eXBlb2YgKHBhcmFtKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIG1ldGhvZHMuYWRkX2JhdGNoIChwYXJhbSk7XG5cdCAgICBmb3IgKHZhciBwIGluIHBhcmFtKSB7XG5cdFx0YXR0YWNoX21ldGhvZCAocCwgb3B0cyk7XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICBtZXRob2RzLmFkZCAocGFyYW0sIG9wdHMuZGVmYXVsdF92YWx1ZSk7XG5cdCAgICBhdHRhY2hfbWV0aG9kIChwYXJhbSwgb3B0cyk7XG5cdH1cbiAgICB9O1xuXG4gICAgYXBpLmdldHNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdGdldHNldChwYXJhbSwge2RlZmF1bHRfdmFsdWUgOiBkZWZ9KTtcblxuXHRyZXR1cm4gYXBpO1xuICAgIH07XG5cbiAgICBhcGkuZ2V0ID0gZnVuY3Rpb24gKHBhcmFtLCBkZWYpIHtcblx0dmFyIG9uX3NldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIHRocm93IChcIk1ldGhvZCBkZWZpbmVkIG9ubHkgYXMgYSBnZXR0ZXIgKHlvdSBhcmUgdHJ5aW5nIHRvIHVzZSBpdCBhcyBhIHNldHRlclwiKTtcblx0fTtcblxuXHRnZXRzZXQocGFyYW0sIHtkZWZhdWx0X3ZhbHVlIDogZGVmLFxuXHRcdCAgICAgICBvbl9zZXR0ZXIgOiBvbl9zZXR0ZXJ9XG5cdCAgICAgICk7XG5cblx0cmV0dXJuIGFwaTtcbiAgICB9O1xuXG4gICAgYXBpLnNldCA9IGZ1bmN0aW9uIChwYXJhbSwgZGVmKSB7XG5cdHZhciBvbl9nZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICB0aHJvdyAoXCJNZXRob2QgZGVmaW5lZCBvbmx5IGFzIGEgc2V0dGVyICh5b3UgYXJlIHRyeWluZyB0byB1c2UgaXQgYXMgYSBnZXR0ZXJcIik7XG5cdH07XG5cblx0Z2V0c2V0KHBhcmFtLCB7ZGVmYXVsdF92YWx1ZSA6IGRlZixcblx0XHQgICAgICAgb25fZ2V0dGVyIDogb25fZ2V0dGVyfVxuXHQgICAgICApO1xuXG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIGFwaS5tZXRob2QgPSBmdW5jdGlvbiAobmFtZSwgY2Jhaykge1xuXHRpZiAodHlwZW9mIChuYW1lKSA9PT0gJ29iamVjdCcpIHtcblx0ICAgIGZvciAodmFyIHAgaW4gbmFtZSkge1xuXHRcdHdob1twXSA9IG5hbWVbcF07XG5cdCAgICB9XG5cdH0gZWxzZSB7XG5cdCAgICB3aG9bbmFtZV0gPSBjYmFrO1xuXHR9XG5cdHJldHVybiBhcGk7XG4gICAgfTtcblxuICAgIHJldHVybiBhcGk7XG4gICAgXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBhcGk7IiwiaW1wb3J0IGFwaWpzIGZyb20gJ3RudC5hcGknO1xuXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uICgpIHtcblxuICAgIGxldCBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoIChcImNsaWNrXCIsIFwiZGJsY2xpY2tcIiwgXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiLCBcInNlbGVjdFwiLCBcInVuc2VsZWN0XCIsIFwiaW50ZXJhY3Rpb25cIik7XG5cbiAgICBsZXQgY29uZmlnID0ge1xuICAgICAgICBkYXRhOiB1bmRlZmluZWQsXG4gICAgICAgIHNpemU6IDUwMCwgIC8vIGRlZmF1bHQgZ3JhcGggc2l6ZVxuICAgICAgICBsYWJlbFNpemU6IDEwMCxcbiAgICAgICAgbm9kZUFyYzogMTIsXG4gICAgICAgIGNvbG9yU2NhbGU6IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgICAgICAucmFuZ2UoW2QzLnJnYihcIiMwMDdBRkZcIiksIGQzLnJnYignI0ZGRjUwMCcpXSkgLy8gVGhlIGRvbWFpbiBpcyBzZXQgZHluYW1pY2FsbHlcbiAgICB9O1xuICAgIGxldCBmaXhlZE5vZGVzID0gbmV3IE1hcCgpO1xuICAgIGxldCByYWRpdXM7XG4gICAgbGV0IGxhYmVscztcblxuICAgIGNvbnN0IHJlbmRlciA9IGZ1bmN0aW9uIChkaXYpIHtcbiAgICAgICAgaWYgKCFkaXYpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vIGNvbnRhaW5lciBET00gZWxlbWVudCBwcm92aWRlZCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IHRoZSBkb21haW4gb2YgdGhlIGNvbG9yIHNjYWxlIGJhc2VkIG9uIHRoZSByZWFsIGRhdGEgbGVuZ3RoXG4gICAgICAgIGNvbnN0IGRhdGFEb21haW4gPSBjYWxjSW50ZXJhY3Rpb25zRG9tYWluKGNvbmZpZy5kYXRhKTtcbiAgICAgICAgY29uZmlnLmNvbG9yU2NhbGUuZG9tYWluKGRhdGFEb21haW4pO1xuXG4gICAgICAgIC8vIENhbGN1bGF0ZXMgaG93IG11Y2ggc3BhY2UgaXMgbmVlZGVkIGZvciB0aGUgd2hvbGUgdmlzdWFsaXNhdGlvbiBnaXZlbiB0aGUgbnVtYmVyIG9mIG5vZGVzIC8gbGFiZWxzXG4gICAgICAgIHJhZGl1cyA9IGNhbGNSYWRpdXMoY29uZmlnLmRhdGEubGVuZ3RoLCBjb25maWcubm9kZUFyYyk7XG4gICAgICAgIGxldCBkaWFtZXRlciA9IHJhZGl1cyAqIDI7XG5cbiAgICAgICAgbGV0IHNpemUgPSBkaWFtZXRlciArICgyKmNvbmZpZy5sYWJlbFNpemUpO1xuICAgICAgICBpZiAoc2l6ZSA8IGNvbmZpZy5zaXplKSB7XG4gICAgICAgICAgICBzaXplID0gY29uZmlnLnNpemU7XG4gICAgICAgICAgICBkaWFtZXRlciA9IHNpemUgLSAoMipjb25maWcubGFiZWxTaXplKTtcbiAgICAgICAgICAgIHJhZGl1cyA9IH5+KGRpYW1ldGVyIC8gMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25maWcuc2l6ZSA9IHNpemU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBzdmdcbiAgICAgICAgY29uc3Qgc3ZnID0gZDMuc2VsZWN0KGRpdilcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgICAgIC5zdHlsZShcInBvc2l0aW9uXCIsIFwicmVsYXRpdmVcIilcbiAgICAgICAgICAgIC5hcHBlbmQoXCJzdmdcIilcbiAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgY29uZmlnLnNpemUpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBjb25maWcuc2l6ZSk7XG5cbiAgICAgICAgY29uc3QgZ3JhcGggPSBzdmdcbiAgICAgICAgICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBgdHJhbnNsYXRlKCR7cmFkaXVzICsgY29uZmlnLmxhYmVsU2l6ZX0sJHtyYWRpdXMgKyBjb25maWcubGFiZWxTaXplfSlgKTtcblxuICAgICAgICB1cGRhdGUoY29uZmlnLmRhdGEpO1xuXG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZShkYXRhID0gW10pIHtcbiAgICAgICAgICAgIGxldCBzdGVwUmFkID0gMzYwIC8gZGF0YS5sZW5ndGg7XG5cblxuICAgICAgICAgICAgbGV0IGN1cnJBbmdsZSA9IDA7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGxpbmsgb2YgZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vIGxldCB7aXNfZGlyZWN0ZWQ6aXNEaXJlY3RlZCwgaXNfaW5oaWJpdGlvbjppc0luaGliaXRpb24sIGlzX3N0aW11bGF0aW9uOmlzU3RpbXVsYXRpb24sIHNvdXJjZSwgdGFyZ2V0fSA9IGxpbms7XG5cbiAgICAgICAgICAgICAgICBsaW5rLmFuZ2xlID0gY3VyckFuZ2xlO1xuICAgICAgICAgICAgICAgIGN1cnJBbmdsZSArPSAoc3RlcFJhZCAqIE1hdGguUEkgLyAxODApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBMYWJlbHNcbiAgICAgICAgICAgIC8vIENlbnRyYWxcbiAgICAgICAgICAgIC8vIGdyYXBoLmFwcGVuZChcImdcIilcbiAgICAgICAgICAgIC8vICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgICAgICAvLyAgICAgLmF0dHIoXCJjeFwiLCAwKVxuICAgICAgICAgICAgLy8gICAgIC5hdHRyKFwiY3lcIiwgMClcbiAgICAgICAgICAgIC8vICAgICAuYXR0cihcInJcIiwgNSlcbiAgICAgICAgICAgIC8vICAgICAuYXR0cihcImZpbGxcIiwgXCIjMDA1Mjk5XCIpO1xuXG4gICAgICAgICAgICAvLyBBbGwgb3RoZXIgbGFiZWxzXG4gICAgICAgICAgICBsYWJlbHMgPSBncmFwaC5zZWxlY3RBbGwoXCIub3BlblRhcmdldHNfaW50ZXJhY3Rpb25zX2xhYmVsXCIpXG4gICAgICAgICAgICAgICAgLmRhdGEoZGF0YSwgZCA9PiBkLmxhYmVsKTtcblxuICAgICAgICAgICAgbGFiZWxzXG4gICAgICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJvcGVuVGFyZ2V0c19pbnRlcmFjdGlvbnNfbGFiZWxcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCAoZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB4ID0gZGlhbWV0ZXIgLyAyICogTWF0aC5jb3MoZC5hbmdsZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHkgPSBkaWFtZXRlciAvIDIgKiBNYXRoLnNpbihkLmFuZ2xlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChgdHJhbnNsYXRlKCR7eH0sJHt5fSlgKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBcImdyZXlcIilcbiAgICAgICAgICAgICAgICAub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24gKGQpIHsgLy8gTm8gYXJyb3cgZnVuY3Rpb24gaGVyZSBiZWNhdXNlIHdlIG5lZWQgdGhlIG1vdXNlZCBvdmVyIGVsZW1lbnQgYXMgX3RoaXNfXG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoLm1vdXNlb3Zlci5jYWxsKHRoaXMsIGQpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24gKGQpIHsgLy8gTm8gYXJyb3cgZnVuY3Rpb24gaGVyZSBiZWNhdXNlIHdlIG5lZWQgdGhlIG1vdXNlZCBvdmVyIGVsZW1lbnQgYXMgX3RoaXNfXG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoLm1vdXNlb3V0LmNhbGwodGhpcywgZCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoZCkgeyAvLyBObyBhcnJvdyBmdW5jdGlvbiBoZXJlIGJlY2F1c2Ugd2UgbmVlZCB0aGUgbW91c2VkIG92ZXIgZWxlbWVudCBhcyBfdGhpc19cbiAgICAgICAgICAgICAgICAgICAgLy8gZGlzcGF0Y2guY2xpY2suY2FsbCh0aGlzLCBkKTtcbiAgICAgICAgICAgICAgICAgICAgZml4LmNhbGwodGhpcywgZCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIExhYmVsc1xuICAgICAgICAgICAgbGFiZWxzXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJmb250LXNpemVcIiwgXCIxMnB4XCIpXG4gICAgICAgICAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgKGQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGdyYWRlcyA9IGQuYW5nbGUgKiAxODAgLyBNYXRoLlBJO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZ3JhZGVzICUgMzYwID4gOTAgJiYgZ3JhZGVzICUgMzYwIDwgMjc1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJlbmRcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJzdGFydFwiO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRleHQoZCA9PiBkLmxhYmVsKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiYWxpZ25tZW50LWJhc2VsaW5lXCIsIFwiY2VudHJhbFwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIChkKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBncmFkZXMgPSBkLmFuZ2xlICogMTgwIC8gTWF0aC5QSTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdyYWRlcyAlIDM2MCA+IDkwICYmIGdyYWRlcyAlIDM2MCA8IDI3NSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGB0cmFuc2xhdGUoJHsxMCAqIE1hdGguY29zKGQuYW5nbGUpfSwkezEwICogTWF0aC5zaW4oZC5hbmdsZSl9KSByb3RhdGUoJHtncmFkZXMgJSAzNjAgKyAxODB9KWA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGB0cmFuc2xhdGUoJHsxMCAqIE1hdGguY29zKGQuYW5nbGUpfSwkezEwICogTWF0aC5zaW4oZC5hbmdsZSl9KSByb3RhdGUoJHtncmFkZXMgJSAzNjB9KWA7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIGxpbmtzXG4gICAgICAgICAgICAvLyBXZSBuZWVkIGEgZGF0YSBzdHJ1Y3R1cmUgd2l0aCB0aGUgYW5nbGVzLlxuICAgICAgICAgICAgY29uc3QgayA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIGZvciAobGV0IG4gb2YgZGF0YSkge1xuICAgICAgICAgICAgICAgIGsuc2V0KG4ubGFiZWwsIG4uYW5nbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGFiZWxzXG4gICAgICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKHNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgZnJvbUFuZ2xlID0gc291cmNlLmFuZ2xlO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBkZXN0IG9mIE9iamVjdC52YWx1ZXMoc291cmNlLmludGVyYWN0c1dpdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdG9BbmdsZSA9IGsuZ2V0KGRlc3QubGFiZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZyb21YID0gKGRpYW1ldGVyLTcpIC8gMiAqIE1hdGguY29zKGZyb21BbmdsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZnJvbVkgPSAoZGlhbWV0ZXItNykgLyAyICogTWF0aC5zaW4oZnJvbUFuZ2xlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0b1ggPSAoZGlhbWV0ZXItNykgLyAyICogTWF0aC5jb3ModG9BbmdsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdG9ZID0gKGRpYW1ldGVyLTcpIC8gMiAqIE1hdGguc2luKHRvQW5nbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3JhcGguYXBwZW5kKFwicGF0aFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vLmRhdHVtKHNvdXJjZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZGF0dW0oe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IHNvdXJjZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzdDogZGVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm9wZW5UYXJnZXRzX2ludGVyYWN0aW9uc19saW5rXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJkXCIsIGBNJHtmcm9tWH0sJHtmcm9tWX0gUTAsMCAke3RvWH0sJHt0b1l9YClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCIjMWU1Nzk5XCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gTm9kZXNcbiAgICAgICAgICAgIGxhYmVsc1xuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgICAgICAgICAvLyAuYXR0cihcImZpbGxcIiwgXCIjMDA1Mjk5XCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb25maWcuY29sb3JTY2FsZShPYmplY3Qua2V5cyhkYXRhLmludGVyYWN0c1dpdGgpLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuYXR0cihcImN4XCIsIDApXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjeVwiLCAwKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiclwiLCA1KTtcblxuXG4gICAgICAgICAgICBmdW5jdGlvbiBmaXhlZE5vZGVzSGFzTGlua1dpdGggKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBsZXQgaW50ZXJhY3RzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZml4ZWROb2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2YWwsIGtleSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBba2V5LCBpbnRlcl0gb2YgT2JqZWN0LmVudHJpZXModmFsLmludGVyYWN0c1dpdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXIubGFiZWwgPT09IG5vZGUubGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcmFjdHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0cztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2ltdWxhdGVzIGEgY2xpY2sgaW4gYSBub2RlXG4gICAgICAgICAgICByZW5kZXIuY2xpY2sgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSVYgaGFzIGJlZW4gYXNrZWQgdG8gdW5zZWxlY3QgdGhpcyBub2RlLi4uXCIpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG5vZGUpO1xuXG4gICAgICAgICAgICAgICAgLy8gRmluZCB0aGUgZWxlbWVudCBmb3IgdGhlIG5vZGVcbiAgICAgICAgICAgICAgICBsZXQgZWxlbTtcbiAgICAgICAgICAgICAgICBkMy5zZWxlY3RBbGwoJy5vcGVuVGFyZ2V0c19pbnRlcmFjdGlvbnNfbGFiZWwnKVxuICAgICAgICAgICAgICAgICAgICAuZWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGQgPT0gbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0gPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmIChlbGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic2ltdWxhdGluZyBhIGNsaWNrIG9uIG5vZGUuLi5cIik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVsZW0pO1xuICAgICAgICAgICAgICAgICAgICBmaXguY2FsbChlbGVtLCBub2RlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgKFwiQ2FuJ3QgZmluZCBub2RlXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGZpeChub2RlLCBldmVudHMpIHsgLy8gaWYgZXZlbnRzIGlzIHRydXRoeSwgZmlyZSBldmVudHMgZm9yIGVhY2ggc2VsZWN0IC8gdW5zZWxlY3QgYWN0aW9uXG4gICAgICAgICAgICAgICAgY29uc3QgY2xpY2tlZE5vZGUgPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgLy8gU3BlY3M6XG4gICAgICAgICAgICAgICAgLy8gMS4gSWYgdGhlcmUgaXMgbm8gb3RoZXIgbm9kZSBzZWxlY3RlZCwgc2VsZWN0IHRoaXMgb25lXG4gICAgICAgICAgICAgICAgLy8gMi4gSWYgdGhlcmUgaXMgYW5vdGhlciBub2RlIHNlbGVjdGVkIGFuZCB0aGVyZSBpcyBhIGNvbm5lY3Rpb24gYmV0d2VlbiBib3RoLCBzaG93IGRldGFpbHNcbiAgICAgICAgICAgICAgICAvLyAzLiBJZiB0aGVyZSBpcyBhbm90aGVyIG5vZGUgc2VsZWN0ZWQgYW5kIHRoZXJlIGlzIG5vIGNvbm5lY3Rpb24gYmV0d2VlbiB0aGVtLCB0aGlzIG9uZSBpcyB0aGUgb25seSBzZWxlY3RlZFxuICAgICAgICAgICAgICAgIC8vIDQuIElmIHRoZSBzZWxlY3RlZCBub2RlIGlzIGFscmVhZHkgc2VsZWN0ZWQsIGRlc2VsZWN0IGl0XG4gICAgICAgICAgICAgICAgLy8gNS4gSWYgdGhlIGFyZSBhbHJlYWR5IDIgc2VsZWN0ZWQgbm9kZXMgYW5kIHRoaXMgaXMgbm90IG9uZSBvZiB0aGVtLCBzZWxlY3Qgb25seSB0aGlzIG9uZS5cblxuICAgICAgICAgICAgICAgIC8vIFRPRE86IGRpc3BhdGNoaW5nIHNlbGVjdCBhbmQgdW5zZWxlY3Qgc2hvdWxkIGJlIGRvbmUgY2VudHJhbGx5IGJ5IGNvbWJpbmluZyB0aGUgb3BlcmF0aW9ucyBvbiB0aGUgTWFwIHdpdGggdGhlIGRpc3BhdGhpbmdcbiAgICAgICAgICAgICAgICAvLyBDYXNlIDFcbiAgICAgICAgICAgICAgICBpZiAoIWZpeGVkTm9kZXMuc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3QuY2FsbChjbGlja2VkTm9kZSwgbm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZml4ZWROb2Rlcy5zZXQobm9kZS5sYWJlbCwgbm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGRpc3BhdGNoLnNlbGVjdC5jYWxsKGNsaWNrZWROb2RlLCBub2RlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpeGVkTm9kZXMuaGFzKG5vZGUubGFiZWwpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpeGVkTm9kZXMuZGVsZXRlKG5vZGUubGFiZWwpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaC51bnNlbGVjdC5jYWxsKGNsaWNrZWROb2RlLCBub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWZpeGVkTm9kZXMuc2l6ZSkgeyAvLyBXZSBvbmx5IGhhZCAxIG5vZGUgc2VsZWN0ZWQgYW5kIGlzIG5vdyB1bnNlbGVjdGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDYXNlIDRcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuc2VsZWN0LmNhbGwoY2xpY2tlZE5vZGUsIG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgaGF2ZSBkZXNlbGVjdGVkLCBidXQgdGhlcmUgaXMgc3RpbGwgb25lIHNlbGVjdGVkLiBTbyB0YWtlIHRoZSBvdGhlciBvbmUgYW5kIHNlbGVjdCBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG90aGVyTm9kZSA9IGZpeGVkTm9kZXMua2V5cygpLm5leHQoKS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdC5jYWxsKGNsaWNrZWROb2RlLCBmaXhlZE5vZGVzLmdldChvdGhlck5vZGUpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZpeGVkTm9kZXMuc2V0KG5vZGUubGFiZWwsIG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHsgLy8gTmV3IG5vZGUgc2VsZWN0ZWQuLi5cbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgYXJlIGFscmVhZHkgMiBub2RlcyBzZWxlY3RlZCwgc2VsZWN0IG9ubHkgdGhpcyBvbmVcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpeGVkTm9kZXMuc2l6ZSA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0LmNhbGwoY2xpY2tlZE5vZGUsIG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZml4ZWROb2Rlcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZml4ZWROb2Rlcy5zZXQobm9kZS5sYWJlbCwgbm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGF0Y2guc2VsZWN0LmNhbGwoY2xpY2tlZE5vZGUsIG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgeyAvLyBUaGVyZSBpcyBhbHJlYWR5IG9uZSBub2RlIHNlbGVjdGVkLiBUd28gY2FzZXMgaGVyZTogdGhlcmUgZXhpc3RzIGEgY29ubmVjdGlvbiBiZXR3ZWVuIHRoZW0gb3Igbm90XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZml4ZWROb2Rlc0hhc0xpbmtXaXRoKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZml4ZWROb2Rlcy5zZXQobm9kZS5sYWJlbCwgbm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaC5zZWxlY3QuY2FsbChjbGlja2VkTm9kZSwgbm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdDIuY2FsbChjbGlja2VkTm9kZSwgZml4ZWROb2Rlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgeyAvLyBObyBsaW5rIGJldHdlZW4gYm90aCwgc28ganVzdCBzZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXhlZE5vZGVzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZml4ZWROb2Rlcy5zZXQobm9kZS5sYWJlbCwgbm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwYXRjaC5zZWxlY3QuY2FsbChjbGlja2VkTm9kZSwgbm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdC5jYWxsKGNsaWNrZWROb2RlLCBub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gdW5zZWxlY3QoZCkge1xuICAgICAgICAgICAgICAgIC8vIGRpc3BhdGNoLnVuc2VsZWN0LmNhbGwodGhpcywgZCk7XG5cbiAgICAgICAgICAgICAgICBkMy5zZWxlY3RBbGwoXCIub3BlblRhcmdldHNfaW50ZXJhY3Rpb25zX2xpbmtcIilcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJvcGFjaXR5XCIsIDEpO1xuICAgICAgICAgICAgICAgIGQzLnNlbGVjdEFsbChcIi5vcGVuVGFyZ2V0c19pbnRlcmFjdGlvbnNfbGFiZWxcIilcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwiZ3JleVwiKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cihcIm9wYWNpdHlcIiwgMSk7XG4gICAgICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLmF0dHIoXCJmaWxsXCIsIFwiZ3JleVwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gc2VsZWN0KGQpIHtcbiAgICAgICAgICAgICAgICAvLyBkaXNwYXRjaC5zZWxlY3QuY2FsbCh0aGlzLCBkKTtcbiAgICAgICAgICAgICAgICAvLyBmYWRlIG91dCBvdGhlciBsaW5rc1xuICAgICAgICAgICAgICAgIGQzLnNlbGVjdEFsbChcIi5vcGVuVGFyZ2V0c19pbnRlcmFjdGlvbnNfbGlua1wiKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cihcIm9wYWNpdHlcIiwgKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkLmxhYmVsID09PSBkYXRhLnNvdXJjZS5sYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gZmFkZSBvdXQgdGhlIGxhYmVscyAvIG5vZGVzXG4gICAgICAgICAgICAgICAgZDMuc2VsZWN0QWxsKFwiLm9wZW5UYXJnZXRzX2ludGVyYWN0aW9uc19sYWJlbFwiKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkLmxhYmVsID09PSBkYXRhLmxhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwicmVkXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJncmV5XCI7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKFwib3BhY2l0eVwiLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGQubGFiZWwgPT09IGRhdGEubGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGludGVyIG9mIE9iamVjdC52YWx1ZXMoZGF0YS5pbnRlcmFjdHNXaXRoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnRlci5sYWJlbCA9PT0gZC5sYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHNlbGVjdDIoZml4ZWROb2Rlcykge1xuICAgICAgICAgICAgICAgIC8vIGRpc3BhdGNoLnNlbGVjdC5jYWxsKHRoaXMsIGQzLnNlbGVjdCh0aGlzKS5kYXR1bSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjbGlja2VkTm9kZSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLmF0dHIoXCJmaWxsXCIsIFwicmVkXCIpO1xuXG4gICAgICAgICAgICAgICAgLy8gZGlzcGF0Y2guc2VsZWN0Mi5jYWxsKHRoaXMsIGQpO1xuICAgICAgICAgICAgICAgIC8vIGZhZGUgb3V0IG90aGVyIGxpbmtzXG4gICAgICAgICAgICAgICAgZDMuc2VsZWN0QWxsKFwiLm9wZW5UYXJnZXRzX2ludGVyYWN0aW9uc19saW5rXCIpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKFwib3BhY2l0eVwiLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpeGVkTm9kZXMuaGFzKGRhdGEuc291cmNlLmxhYmVsKSAmJiBmaXhlZE5vZGVzLmhhcyhkYXRhLmRlc3QubGFiZWwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBmYWRlIG91dCBvdGhlciBsYWJlbHNcbiAgICAgICAgICAgICAgICBkMy5zZWxlY3RBbGwoXCIub3BlblRhcmdldHNfaW50ZXJhY3Rpb25zX2xhYmVsXCIpXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKFwib3BhY2l0eVwiLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpeGVkTm9kZXMuaGFzKGRhdGEubGFiZWwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBGaXJlIHRoZSBpbnRlcmFjdGlvbiBldmVudFxuICAgICAgICAgICAgICAgIGxldCBpbnRlck9iaiA9IHt9O1xuICAgICAgICAgICAgICAgIGxldCBpTmFtZXMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGlOYW1lIG9mIGZpeGVkTm9kZXMua2V5cygpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlOYW1lcy5wdXNoKGlOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGludGVyYWN0aW9ucyA9IFtdO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiaW50ZXJhY3RvcnM6XCIpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGZpeGVkTm9kZXMuZ2V0KGlOYW1lc1swXSkpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGZpeGVkTm9kZXMuZ2V0KGlOYW1lc1sxXSkpO1xuICAgICAgICAgICAgICAgIGxldCBpdyA9IGZpeGVkTm9kZXMuZ2V0KGlOYW1lc1swXSkuaW50ZXJhY3RzV2l0aDtcbiAgICAgICAgICAgICAgICBsZXQgaTIgPSBmaXhlZE5vZGVzLmdldChpTmFtZXNbMV0pLmxhYmVsO1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGl3KS5mb3JFYWNoKGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpd1tpXS5sYWJlbCA9PT0gaTIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGludGVyYWN0aW9ucyA9IGl3W2ldLnByb3ZlbmFuY2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpbnRlck9iaiA9IHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3RvcjE6IGlOYW1lc1swXSxcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJhY3RvcjI6IGlOYW1lc1sxXSxcbiAgICAgICAgICAgICAgICAgICAgcHJvdmVuYW5jZTogaW50ZXJhY3Rpb25zXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGRpc3BhdGNoLmludGVyYWN0aW9uLmNhbGwoY2xpY2tlZE5vZGUsIGludGVyT2JqKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY2FsY0ludGVyYWN0aW9uc0RvbWFpbihkYXRhKSB7XG4gICAgICAgICAgICBsZXQgbWluID0gSW5maW5pdHk7XG4gICAgICAgICAgICBsZXQgbWF4ID0gMDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCBkID0gZGF0YVtpXTtcbiAgICAgICAgICAgICAgICBsZXQgaWwgPSBPYmplY3Qua2V5cyhkLmludGVyYWN0c1dpdGgpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBpZiAoaWwgPiBtYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF4ID0gaWw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpbCA8IG1pbikge1xuICAgICAgICAgICAgICAgICAgICBtaW4gPSBpbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gW21pbiwgbWF4XTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIHJlbmRlci5maWx0ZXIgPSBmdW5jdGlvbiAoY2Jhaykge1xuICAgICAgICAvLyBUaGUgY2JhayBpcyBydW4gb24gZXZlcnkgbGluayBhbmQgaXMgZXhwZWN0ZWQgdG8gcmV0dXJuIHRydWUgb3IgZmFsc2UuXG4gICAgfTtcblxuICAgIGFwaWpzKHJlbmRlcilcbiAgICAgICAgLmdldHNldChjb25maWcpO1xuXG4gICAgZnVuY3Rpb24gY2FsY1JhZGl1cyAobiwgbm9kZUFyYz1jb25maWcubm9kZUFyYykge1xuICAgICAgICAvLyBHaXZlbiB0aGUgbnVtYmVyIG9mIG5vZGVzIHRvIGFsbG9jYXRlIGluIHRoZSBjaXJjdW1mZXJlbmNlIGFuZCB0aGUgYXJjIHRoYXQgZWFjaCBub2RlIG5lZWRzLCBjYWxjdWxhdGUgdGhlIG1pbmltdW0gcmFkaXVzIG9mIHRoZSBwbG90XG4gICAgICAgIC8vIDIgKiBQSSAqIHIgPSB0b3RhbEFyYyA9IG5vZGVBcmMgKiBuXG4gICAgICAgIHJldHVybiB+fihub2RlQXJjICogbiAvICgyICogTWF0aC5QSSkpO1xuICAgIH1cblxuICAgIHJldHVybiBkMy5yZWJpbmQocmVuZGVyLCBkaXNwYXRjaCwgXCJvblwiKTtcbn1cbiJdfQ==