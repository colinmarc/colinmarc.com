var template = `
{{#spells}}
<div class="spell">
  <h3>{{name}}</h3>
  <div class="type">{{type}}</div>
  <b>Casting Time:</b> {{casting_time}}<br/>
  <b>Range:</b> {{range}}<br/>
  <b>Components:</b> {{component_desc}}{{#material_cost}} ({{material_desc}}){{/material_cost}}<br/>
  <b>Duration:</b> {{duration}}<br/>
  {{{desc}}}
  {{#higher_level}}
  <p><b>At higher levels:</b></p>
  {{{higher_level}}}
  {{/higher_level}}
</div>
{{/spells}}
`;

Mustache.parse(template);

var query = window.location.search.substring(1),
    spellbook = new BitSet('0x' + query).toArray().sort().map(id => spells[id]);

spellbook.sort(function(a, b) {
  if (a.level === b.level)
    return a.name < b.name ? -1 : 1;
  else
    return a.level - b.level;
});

for (let sp of spellbook) {
  if (sp.level === 0)
    sp.type = `${sp.school} cantrip`
  else
    sp.type = `${sp.level_desc} ${sp.school.toLowerCase()}`
}

window.onload = function () {
  document.getElementById('spells').innerHTML = Mustache.render(template, {spells: spellbook});
}

var closeHeader = function() {
  document.getElementById('header').style.display = 'none';
}

var edit = function() {
  window.location.pathname = window.location.pathname + '/..'
}
