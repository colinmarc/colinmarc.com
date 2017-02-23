var searchSpellTemplate = `
<tr class="spell searchspell">
  <td class="levelcol">{{level}}</td>
  <td class="namecol">{{name}}</td>
  <td class="classcol">{{class_desc}}</td>
  <td class="schoolcol">{{school}}</td>
  <td class="componentcol">{{component_desc}}{{#material_cost}}*{{/material_cost}}</td>
  <td class="sourcecol">{{src}}</td>
</tr>
`;

var floatingDescriptionTemplate = `
<h2>{{name}}</h2>
<b>Casting Time:</b> {{casting_time}}<br/>
<b>Range:</b> {{range}}<br/>
<b>Components:</b> {{component_desc}}<br/>
<b>Duration:</b> {{duration}}<br/>
{{{desc}}}
{{#higher_level}}
<p><b>At higher levels:</b></p>
{{{higher_level}}}
{{/higher_level}}
`;

Mustache.parse(searchSpellTemplate);
Mustache.parse(floatingDescriptionTemplate);

function intersects(sp, filter) {
  if (sp === undefined) sp = [];

  for (var v of sp) {
    if (filter.has(v)) return true;
  }

  return false;
}

$(document).ready(function() {
  var $selectedTable = $('#selectedtable'),
      $selectedTableBody = $('#selectedtablebody'),
      $searchTable = $('#searchtable'),
      $searchTableBody = $('#searchtablebody'),
      $moreRows = $('#morerows'),

      selectedSpells = new Set(),
      selectedSpellsBitSet = new BitSet(),

      // These filters are OR filters with eachother, but AND filters otherwise
      filterClasses = new Set(),
      filterDomains = new Set(),
      filterCircles = new Set(),
      filterOaths = new Set(),
      filterPatrons = new Set(),

      filterSources = new Set(['PHB']),
      filterLevels = new Set(),
      filterSchools = new Set(),
      filterSearch = '';

  var filterSpell = function(sp) {
    if (selectedSpells.has(sp.id))
      return false;

    if (filterSearch !== "" && sp.name.toLowerCase().indexOf(filterSearch) === -1)
      return false;

    if (filterSources.size !== 0 && !filterSources.has(sp.src))
      return false;

    if ((filterClasses.size + filterDomains.size + filterCircles.size +
           filterOaths.size + filterPatrons.size) !== 0 &&
       !(intersects(sp.class, filterClasses) ||
         intersects(sp.cleric_domain, filterDomains) ||
         intersects(sp.druid_circle, filterCircles) ||
         intersects(sp.paladin_oath, filterOaths) ||
         intersects(sp.warlock_patron, filterPatrons))) return false;

    if (filterSchools.size !== 0 && !filterSchools.has(sp.school))
      return false;

    if (filterLevels.size !== 0 && !filterLevels.has(sp.level))
      return false;

    return true;
  };

  var refilter = function() {
    var numSelected = 0;

    for (var row of $searchTableBody.children().toArray()) {
      var $row = $(row),
          sp = $row.data('sp');

      if (filterSpell(sp)) {
        if (numSelected < 50)
          $row.show();
        else
          $row.hide();

        numSelected++;
      } else {
        $row.hide();
      }
    }

    if (numSelected > 50) {
      var remaining = numSelected - 50;
      $moreRows.html(`${remaining} more...`);
      $moreRows.show();
    } else {
      $moreRows.hide();
    }

    // Make the selected table's widths match.
    $selectedTableBody.find('td').each(function (i) {
      $(this).width($($("#searchtablebody tr:first td")[i%6]).width());
    })
  };

  // Initial render.
  spells.forEach(function(sp, i) {
    sp.id = i;

    var $row = $(Mustache.render(searchSpellTemplate, sp));
    $row.data('sp', sp);

    if (i >= 50) {
      $row.hide();
    }

    $searchTableBody.append($row);
  });

  $searchTable.stupidtable();
  $('#startsorted').stupidsort();

  $searchTable.on('aftertablesort', function() { refilter(); });
  refilter();

  // Hovering description.
  var $floater = $('#floater');
  $(document).on('mousemove', function(e){
    var x = e.pageX + 5,
        y = e.pageY + 5,
        floaterHeight = $floater.height(),
        documentHeight = $(document).height();

    if (y + floaterHeight > $(document).height() && floaterHeight < documentHeight)
      y = e.pageY - 15 - $floater.height();

    $floater.css({
      position: 'absolute',
      left:  x,
      top:   y
    });
  });

  $(document).on('mouseenter', '.spell', function() {
    var sp = $(this).data('sp');

    var $content = $(Mustache.render(floatingDescriptionTemplate, sp));
    $floater.html($content);
    $floater.show();
  });

  $(document).on('mouseleave', '.spell', function() {
    $floater.hide();
  });

  // Selecting spells.
  var $selectInstructions = $('#selectinstructions'),
      $generate = $('#generate');

  $searchTableBody.find('.spell').bind('click', function() {
    var $this = $(this),
        sp = $this.data('sp');

    var $row = $(Mustache.render(searchSpellTemplate, sp));
    $row.data('sp', sp)

    $selectedTableBody.append($row);
    $selectedTableBody.children().sort(function(row1, row2) {
      var sp1 = $(row1).data('sp'),
          sp2 = $(row2).data('sp')

      if (sp1.level == sp2.level)
        return sp1.name < sp2.name ? -1 : 1;
      else
        return sp1.level < sp2.level ? -1 : 1;
    }).appendTo($selectedTableBody);

    selectedSpells.add(sp.id);
    refilter();

    selectedSpellsBitSet.set(sp.id, 1);
    $generate.attr('href', 'gen.html?' + selectedSpellsBitSet.toString(16))

    $selectInstructions.hide();
  });

  // Deselecting spells.
  $selectedTableBody.on('click', '.spell', function() {
    var $this = $(this),
        sp = $this.data('sp');

    $(this).remove();
    selectedSpells.delete(sp.id);
    refilter();

    selectedSpellsBitSet.set(sp.id, 0);
    $generate.attr('href', 'gen.html?' + selectedSpellsBitSet.toString(16))

    if (selectedSpells.size === 0)
      $selectInstructions.show();
  });

  $('#emptyspellbook').bind('click', function() {
    $selectedTableBody.empty();
    selectedSpells = new Set();
    refilter();

    $selectInstructions.show();
  });

  // Filter buttons.
  var toggleFilter = function(dom, filter, v) {
    var $this = $(dom);

    if ($this.hasClass('selected')) {
      $this.removeClass('selected');
      filter.delete(v);
    } else {
      $this.addClass('selected');
      filter.add(v);
    }

    refilter();
  }

  $('#filterphb').bind('click',function() { toggleFilter(this, filterSources, 'PHB') });
  $('#filtereepc').bind('click',function() { toggleFilter(this, filterSources, 'EE PC') });
  $('#filterscag').bind('click',function() { toggleFilter(this, filterSources, 'SCAG') });
  $('#filteruatobm').bind('click',function() { toggleFilter(this, filterSources, 'UA TOBM') });
  $('#filtertrotspells').bind('click',function() { toggleFilter(this, filterSources, 'TROT SPELLS') });
  $('#clearsources').bind('click', function() {
    $('a.filtersource').removeClass('selected');
    filterSources = new Set();
    refilter();
  });

  $('#filtersorcerer').bind('click', function() { toggleFilter(this, filterClasses, 'Sorcerer') });
  $('#filterwizard').bind('click', function() { toggleFilter(this, filterClasses, 'Wizard') });
  $('#filterdruid').bind('click', function() { toggleFilter(this, filterClasses, 'Druid') });
  $('#filterranger').bind('click', function() { toggleFilter(this, filterClasses, 'Ranger') });
  $('#filtercleric').bind('click', function() { toggleFilter(this, filterClasses, 'Cleric') });
  $('#filterpaladin').bind('click', function() { toggleFilter(this, filterClasses, 'Paladin') });
  $('#filterritualcaster').bind('click', function() { toggleFilter(this, filterClasses, 'Ritual Caster') });
  $('#filterbard').bind('click', function() { toggleFilter(this, filterClasses, 'Bard') });
  $('#filterwarlock').bind('click', function() { toggleFilter(this, filterClasses, 'Warlock') });

  $('#filternature').bind('click', function() { toggleFilter(this, filterDomains, 'Nature') });
  $('#filterknowledge').bind('click', function() { toggleFilter(this, filterDomains, 'Knowledge') });
  $('#filterlife').bind('click', function() { toggleFilter(this, filterDomains, 'Life') });
  $('#filtertrickery').bind('click', function() { toggleFilter(this, filterDomains, 'Trickery') });
  $('#filterlight').bind('click', function() { toggleFilter(this, filterDomains, 'Light') });
  $('#filtertempest').bind('click', function() { toggleFilter(this, filterDomains, 'Tempest') });
  $('#filterwar').bind('click', function() { toggleFilter(this, filterDomains, 'War') });

  $('#filterforest').bind('click', function() { toggleFilter(this, filterCircles, 'Forest') });
  $('#filterdesert').bind('click', function() { toggleFilter(this, filterCircles, 'Desert') });
  $('#filterunderdark').bind('click', function() { toggleFilter(this, filterCircles, 'Underdark') });
  $('#filterarctic').bind('click', function() { toggleFilter(this, filterCircles, 'Arctic') });
  $('#filtercoast').bind('click', function() { toggleFilter(this, filterCircles, 'Coast') });
  $('#filterswamp').bind('click', function() { toggleFilter(this, filterCircles, 'Swamp') });
  $('#filtergrassland').bind('click', function() { toggleFilter(this, filterCircles, 'Grassland') });
  $('#filtermountain').bind('click', function() { toggleFilter(this, filterCircles, 'Mountain') });

  $('#filtervengeance').bind('click', function() { toggleFilter(this, filterOaths, 'Vengeance') });
  $('#filterdevotion').bind('click', function() { toggleFilter(this, filterOaths, 'Devotion') });
  $('#filterancients').bind('click', function() { toggleFilter(this, filterOaths, 'Ancients') });

  $('#filterfiend').bind('click', function() { toggleFilter(this, filterPatrons, 'Fiend') });
  $('#filterarchfey').bind('click', function() { toggleFilter(this, filterPatrons, 'Archfey') });
  $('#filtergreatoldone').bind('click', function() { toggleFilter(this, filterPatrons, 'Great Old One') });

  $('#clearlists').bind('click', function() {
    $('a.filterclass, a.filterdomain, a.filtercircle, a.filteroath, a.filterpatron').removeClass('selected');
    filterClasses = new Set();
    filterDomains = new Set();
    filterCircles = new Set();
    filterOaths = new Set();
    filterPatrons = new Set();
    refilter();
  });

  $('#filternecromancy').bind('click', function() { toggleFilter(this, filterSchools, 'Necromancy') });
  $('#filterabjuration').bind('click', function() { toggleFilter(this, filterSchools, 'Abjuration') });
  $('#filterconjuration').bind('click', function() { toggleFilter(this, filterSchools, 'Conjuration') });
  $('#filterevocation').bind('click', function() { toggleFilter(this, filterSchools, 'Evocation') });
  $('#filtertransmutation').bind('click', function() { toggleFilter(this, filterSchools, 'Transmutation') });
  $('#filterenchantment').bind('click', function() { toggleFilter(this, filterSchools, 'Enchantment') });
  $('#filterdivination').bind('click', function() { toggleFilter(this, filterSchools, 'Divination') });
  $('#filterillusion').bind('click', function() { toggleFilter(this, filterSchools, 'Illusion') });
  $('#clearschools').bind('click', function() {
    $('a.filterschool').removeClass('selected');
    filterSchools = new Set();
    refilter();
  });

  $('#filterlevel0').bind('click', function() { toggleFilter(this, filterLevels, 0) });
  $('#filterlevel1').bind('click', function() { toggleFilter(this, filterLevels, 1) });
  $('#filterlevel2').bind('click', function() { toggleFilter(this, filterLevels, 2) });
  $('#filterlevel3').bind('click', function() { toggleFilter(this, filterLevels, 3) });
  $('#filterlevel4').bind('click', function() { toggleFilter(this, filterLevels, 4) });
  $('#filterlevel5').bind('click', function() { toggleFilter(this, filterLevels, 5) });
  $('#filterlevel6').bind('click', function() { toggleFilter(this, filterLevels, 6) });
  $('#filterlevel7').bind('click', function() { toggleFilter(this, filterLevels, 7) });
  $('#filterlevel8').bind('click', function() { toggleFilter(this, filterLevels, 8) });
  $('#filterlevel9').bind('click', function() { toggleFilter(this, filterLevels, 9) });
  $('#clearlevels').bind('click', function() {
    $('a.filterlevel').removeClass('selected');
    filterLevels = new Set();
    refilter();
  });

  var $searchBox = $('#searchinput');
  $searchBox.bind('input', function() {
    filterSearch = $(this).val();
    refilter();
  });

  $('#clearsearch').bind('click', function() {
    $searchBox.val('');
    filterSearch = '';
    refilter();
  });

  $('#clearfilters').bind('click', function() {
    $('.filterbutton').removeClass('selected');
    $('#filterphb').addClass('selected');

    filterSources = new Set(['PHB']);
    filterClasses = new Set();
    filterDomains = new Set();
    filterCircles = new Set();
    filterOaths = new Set();
    filterPatrons = new Set();
    filterSchools = new Set();
    filterLevels = new Set();

    $searchBox.val('');
    filterSearch = '';

    refilter();
  });
});
