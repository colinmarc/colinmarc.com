import json
import re
import requests
import sys
from unidecode import unidecode
from bs4 import BeautifulSoup, Tag


def slugify(spell):
    name = spell.lower().replace(" ", "-").replace("/", "-")
    return re.sub(r"[^a-z-]", "", name)


def clean(p):
    for a in p.find_all("a"):
        a.replace_with(a.string)

    for strong in p.find_all("strong"):
        if strong.get_text().lower().startswith("at higher levels"):
            strong.extract()

    return re.sub(r"\s*<p>\s*", "<p>", unidecode(p.decode())).replace(
        "<span> </span>", ""
    )


spells = json.load(open("spells.json"))


def process(spell):
    sys.stderr.write("processing " + spell["name"] + "\n")

    slug = slugify(spell["name"])

    req = requests.get("https://www.dndbeyond.com/spells/{}/more-info".format(slug))
    parsed = BeautifulSoup(req.text, "html5lib")

    body = parsed.find(class_="more-info-body-description")
    if not body:
        sys.stderr.write("skipping...\n")
        return

    desc = ""
    higher_level = ""
    past_split = False
    for child in body.children:
        if not isinstance(child, Tag):
            continue

        if child.name not in ["p", "ul"]:
            continue

        if child.get_text().lower().startswith("at higher levels"):
            past_split = True

        if past_split:
            higher_level += clean(child)
        else:
            desc += clean(child)

    spell["desc"] = desc
    if higher_level.strip() != "":
        spell["higher_level"] = higher_level


for spell in spells:
    # if spell["name"] == "Catapult":
    process(spell)
    # print(spell)
    # print(json.dumps(spell))

print(json.dumps(spells))
