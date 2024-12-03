import * as d3 from "d3";
import * as d3Sankey from "d3-sankey";

const width = 928;
const height = 600;
const format = d3.format(",.0f");
const linkColor = "source-target"; // source, target, source-target, or a color string.

// Create a SVG container.
const svg = d3.create("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [0, 0, width, height])
  .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

// Constructs and configures a Sankey generator.
const sankey = d3Sankey.sankey()
  .nodeId(d => d.name)
  .nodeAlign(d3Sankey.sankeyJustify) // d3.sankeyLeft, etc.
  .nodeWidth(15)
  .nodePadding(10)
  .extent([[1, 5], [width - 1, height - 5]]);



let nodeCounter = 0;


function getNodesJMUStudent(data) {
  const costsArr = data["student-costs"];
  const nodes = [];

  for (let i = 0; i < costsArr.length; i++) {
    const item = costsArr[i];

    const node = {
      name: nodeCounter++,
      title: item["name"],
    };

    nodes.push(node);
  }
  return nodes;
}

function getNodesFallSpring(data) {
  const costsArr = data["student-costs"];
  const nodes = [];

  for (let i = 0; i < costsArr.length; i++) {
    if (!costsArr[i].hasOwnProperty("semester")) {
      break;
    }

    const item = costsArr[i];

    const node = {
      name: nodeCounter++,
      title: item["name"],
      category: item["semester"],
    };


    if (node.category === "fall") {
      nodes.unshift(node);
    } else {
      nodes.push(node);
    }    
  }

  return nodes;
}

function getNodesItemized(data) {
  const costsArr = data["student-costs"];
  const nodes = [];

  for (let i = 0; i < costsArr.length; i++) {
    const item = costsArr[i];

    if (!item.type === "student itemized") {
      break;
    }

    const node = {
      name: nodeCounter++,
      title: item["name"],
    };
    nodes.push(node);
  }
  return nodes;
}
function getNodes(data) {
  const leftmost = getNodesJMUStudent(data);
  const middle = getNodesFallSpring(data);
  const rightmost = getNodesItemized(data);

  return leftmost.concat(middle).concat(rightmost);
}

//TODO: add links 


function forDiagram1(data) {

  const nodes = getNodes(data);
  const links = getLinks(data);

  return {nodes, links};
}


async function init() {
  /* const data = await d3.json("data/data_sankey.json"); */

  const jmuData = await d3.json("data/jmu.json");

  const data = forDiagram1(jmuData);
  // Applies it to the data. We make a copy of the nodes and links objects
  // so as to avoid mutating the original.
  const { nodes, links } = sankey({
    // const tmp = sankey({
    nodes: data.nodes.map(d => Object.assign({}, d)),
    links: data.links.map(d => Object.assign({}, d))
  });

  // console.log('tmp', tmp);
  console.log('nodes', nodes);
  console.log('links', links);

  // Defines a color scale.
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Creates the rects that represent the nodes.
  const rect = svg.append("g")
    .attr("stroke", "#000")
    .selectAll()
    .data(nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", d => color(d.category));

  // Adds a title on the nodes.
  rect.append("title")
    .text(d => {
      console.log('d', d);
      return `${d.name}\n${format(d.value)}`
    });

  // Creates the paths that represent the links.
  const link = svg.append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5)
    .selectAll()
    .data(links)
    .join("g")
    .style("mix-blend-mode", "multiply");

  // Creates a gradient, if necessary, for the source-target color option.
  if (linkColor === "source-target") {
    const gradient = link.append("linearGradient")
      .attr("id", d => (d.uid = `link-${d.index}`))
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", d => d.source.x1)
      .attr("x2", d => d.target.x0);
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", d => color(d.source.category));
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", d => color(d.target.category));
  }

  link.append("path")
    .attr("d", d3Sankey.sankeyLinkHorizontal())
    .attr("stroke", linkColor === "source-target" ? (d) => `url(#${d.uid})`
      : linkColor === "source" ? (d) => color(d.source.category)
        : linkColor === "target" ? (d) => color(d.target.category)
          : linkColor)
    .attr("stroke-width", d => Math.max(1, d.width));

  link.append("title")
    .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);

  // Adds labels on the nodes.
  svg.append("g")
    .selectAll()
    .data(nodes)
    .join("text")
    .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
    .text(d => d.title);

  // Adds labels on the links.
  svg.append("g")
    .selectAll()
    .data(links)
    .join("text")
    .attr("x", d => {
      console.log('linkd', d)
      const midX = (d.source.x1 + d.target.x0) / 2;
      return midX < width / 2 ? midX + 6 : midX - 6
    })
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
    .text(d => {
      console.log('linkd', d);
      return `${d.source.title} → ${d.value} → ${d.target.title}`
    });

  const svgNode = svg.node();
  document.body.appendChild(svgNode);
  return svgNode;
}

init();