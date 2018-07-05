#!/usr/bin/env ruby

require 'json'

spells = JSON.load(File.read('spells.json'))
spells.each_with_index { |sp, i| sp['id'] = i }

cleric_base = spells.select { |sp| sp['class'].include?('Cleric') }.map { |sp| sp['id'] }
puts "addPreset('cleric', 'Cleric Base', #{cleric_base.inspect});"
puts

domains = spells.map { |sp| sp['cleric_domain'] }.flatten.uniq.compact.sort
domains.each do |domain|
  ids = spells.select { |sp| sp['class'].include?('Cleric') || sp.fetch('cleric_domain', []).include?(domain) }.map { |sp| sp['id'] }
  puts "addPreset('cleric#{domain.downcase}', 'Cleric: #{domain}', #{ids.inspect});"
  puts
end

druid_base = spells.select { |sp| sp['class'].include? ('Druid') }.map { |sp| sp['id'] }
puts "addPreset('druid', 'Druid Base', #{druid_base.inspect});"
puts

circles = spells.map { |sp| sp['druid_circle'] }.flatten.uniq.compact.sort
circles.each do |circle|
  ids = spells.select { |sp| sp['class'].include?('Druid') || sp.fetch('druid_circle', []).include?(circle) }.map { |sp| sp['id'] }
  puts "addPreset('druid#{circle.downcase}', 'Druid: #{circle}', #{ids.inspect});"
  puts
end

paladin_base = spells.select { |sp| sp['class'].include?('Paladin') }.map { |sp| sp['id'] }
puts "addPreset('paladin', 'Paladin Base', #{paladin_base.inspect});"
puts

oaths = spells.map { |sp| sp['paladin_oath'] }.flatten.uniq.compact.sort
oaths.each do |oath|
  ids = spells.select { |sp| sp['class'].include?('Paladin') || sp.fetch('paladin_oath', []).include?(oath) }.map { |sp| sp['id'] }
  puts "addPreset('paladin#{oath.downcase}', 'Paladin: #{oath}', #{ids.inspect});"
  puts
end
