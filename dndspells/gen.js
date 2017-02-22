var template = `
{{#spells}}
<div class="row">
  {{#left}}
  <div class="spell">
    <h3><span class="printlevel">{{level}}</span> {{name}}</h3>
    <b>Casting Time:</b> {{casting_time}}<br/>
    <b>Range:</b> {{range}}<br/>
    <b>Components:</b> {{component_desc}}<br/>
    <b>Duration:</b> {{duration}}<br/>
    <b>School:</b> {{school}}<br/>
    {{{desc}}}
    {{#higher_level}}
    <p><b>At higher levels:</b></p>
    {{{higher_level}}}
    {{/higher_level}}
  </div>
  {{/left}}
  {{#right}}
  <div class="spell">
    <h3><span class="printlevel">{{level}}</span> {{name}}</h3>
    <b>Casting Time:</b> {{casting_time}}<br/>
    <b>Range:</b> {{range}}<br/>
    <b>Components:</b> {{component_desc}}<br/>
    <b>Duration:</b> {{duration}}<br/>
    <b>School:</b> {{school}}<br/>
    {{{desc}}}
    {{#higher_level}}
    <p><b>At higher levels:</b></p>
    {{{higher_level}}}
    {{/higher_level}}
  </div>
  {{/right}}
</div>
{{/spells}}
`;

Mustache.parse(template);

var query = window.location.search.substring(1),
    selected = new BitSet('0x' + query).toArray().sort().map(id => spells[id]),
    spellbook = {spells: []};

selected.sort(function(a, b) {
  if (a.level === b.level)
    return a.name < b.name ? -1 : 1;
  else
    return a.level - b.level;
})

//     levels = [];

// for (let sp of selected) {
//   if (levels[sp.level] === undefined)
//     levels[sp.level] = {level: sp.level, spells: [sp]}
//   else
//     levels[sp.level].spells.push(sp)
// }

while (selected.length > 1) {
  spellbook.spells.push({left: selected.shift(), right: selected.shift()})
  // TODO last spell
}

window.onload = function () {
  document.getElementById('spells').innerHTML = Mustache.render(template, spellbook);
}
