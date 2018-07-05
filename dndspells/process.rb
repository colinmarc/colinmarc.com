#!/usr/bin/env ruby

require 'json'
require 'set'

# These spells are both in the Druid Spell list and one of the Circles.
DRUID_SPELLS_DUPLICATED_IN_CIRCLE = Set.new([
  "Barkskin",
  "Blight",
  "Call Lightning",
  "Commune with Nature",
  "Conjure Elemental",
  "Control Weather",
  "Daylight",
  "Freedom of Movement",
  "Hallucinatory Terrain",
  "Hold Person",
  "Ice Storm",
  "Insect Plague",
  "Locate Creature",
  "Meld into Stone",
  "Pass without Trace",
  "Plant Growth",
  "Protection from Energy",
  "Scrying",
  "Sleet Storm",
  "Spike Growth",
  "Stone Shape",
  "Stoneskin",
  "Tree Stride",
  "Wall of Stone",
  "Water Breathing",
  "Water Walk"
])

CLERIC_SPELLS_DUPLICATED_IN_DOMAIN = Set.new(["Augury",
  "Beacon of Hope",
  "Bless",
  "Command",
  "Control Weather",
  "Cure Wounds",
  "Daylight",
  "Death Ward",
  "Dispel Magic",
  "Flame Strike",
  "Freedom of Movement",
  "Guardian of Faith",
  "Insect Plague",
  "Legend Lore",
  "Lesser Restoration",
  "Mass Cure Wounds",
  "Raise Dead",
  "Revivify",
  "Scrying",
  "Shield of Faith",
  "Speak with Dead",
  "Spirit Guardians",
  "Spiritual Weapon"
])

PALADIN_SPELLS_DUPLICATED_IN_OATH = Set.new([
  "Banishment",
  "Dispel Magic",
  "Lesser Restoration",
  "Protection from Evil and Good",
  "Zone of Truth"
])

def process(spell)
  sp = spell.dup
  sp['level_desc'] = sp['level']
  sp['level'] = sp['level_desc'][0].to_i

  # 'class_desc' gets set later.
  sp['class'] = sp['class'].split(', ')
  lists = sp['class'].dup

  if sp['archetype']
    archetypes = []
    sp['archetype'].split('<br/> ').each do |arch|
      sub_archs = arch.split(',')
      arch_class = sub_archs[0].split(':')[0]
      archetypes << sub_archs[0]
      archetypes += sub_archs[1..-1].map { |sub_arch| "#{arch_class}:#{sub_arch}" }
    end
    sp['archetype_desc'] = sp['archetype']
    sp['archetype'] = archetypes
  end

  if sp['domains']
    domains_desc = sp.delete('domains')
    sp['cleric_domain'] = domains_desc.split(', ')
    unless CLERIC_SPELLS_DUPLICATED_IN_DOMAIN.include?(sp['name'])
      sp['class'].delete('Cleric')
      lists.delete('Cleric')
    end
    lists << "Cleric: #{domains_desc}"
  end

  if sp['circles']
    circles_desc = sp.delete('circles')
    sp['druid_circle'] = circles_desc.split(', ')
    unless DRUID_SPELLS_DUPLICATED_IN_CIRCLE.include?(sp['name'])
      sp['class'].delete('Druid')
      lists.delete('Druid')
    end
    lists << "Druid: #{circles_desc}"
  end

  if sp['oaths']
    oaths_desc = sp.delete('oaths')
    sp['paladin_oath'] = oaths_desc.split(', ')
    unless PALADIN_SPELLS_DUPLICATED_IN_OATH.include?(sp['name'])
      sp['class'].delete('Paladin')
      lists.delete('Paladin')
    end
    lists << "Paladin: #{oaths_desc}"
  end

  if sp['patrons']
    patrons_desc = sp.delete('patrons')
    sp['warlock_patron'] = patrons_desc.split(', ')
    sp['class'].delete('Warlock')
    lists.delete('Warlock')
    lists << "Warlock: #{patrons_desc}"
  end

  sp['class_desc'] = lists.sort.join(', ')

  sp['ritual'] = (sp['ritual'] == "yes")
  sp['concentration'] = (sp['concentration'] == "yes")
  sp['duration'] = "Concentration, " + sp['duration'].downcase if sp['concentration']

  sp['range_desc'] = sp['range']
  sp['range'] = sp['range_desc']

  comp = sp['component_desc'] = sp.delete('components')
  material = sp.delete('material')
  sp['verbal'] = comp.include?('V')
  sp['material'] = comp.include?('M')
  sp['somatic'] = comp.include?('S')

  if material
    sp['material_desc'] = material.gsub(/\.\z/, '').gsub(/^\w{1}/) { |m| m.downcase }
    sp['material_cost'] = material.include?('gp')
  end

  src, _, page = sp.delete('page').rpartition(' ')
  sp['source'] = src.upcase
  sp['page'] = page.to_i

  # Change hyphen bullets to li's.
  if sp['desc'] =~ /<p>- /
    desc = sp['desc'].gsub!(/<p>- (.+?)<\/p>/, '<li>\1</li>')
    desc = desc.insert(desc.index('<li>'), '<ul>')
    desc = desc.insert(desc.rindex('</li>')+5, '</ul>')
    sp['desc'] = desc
  end

  sp
end

raw = JSON.load(File.open(ARGV[0]))
$stderr.puts "processing #{raw.count} spells..."
puts JSON.dump(raw.map { |sp| process(sp) })
